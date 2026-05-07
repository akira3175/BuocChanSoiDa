from datetime import timedelta
from urllib.parse import urlencode

from django.core.signing import BadSignature, SignatureExpired
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
import cloudinary.uploader

from .models import Media, POI, Partner
from .qr_map import MAP_QR_MAX_AGE, sign_poi_map_qr, verify_poi_map_qr
from .serializers import (
    MediaCRUDSerializer,
    MediaSerializer,
    POIDetailSerializer,
    POIListSerializer,
)
from partners.serializers import PartnerSerializer
from users.permissions import IsPartner, IsPartnerPremium

# Bán kính tìm kiếm mặc định (mét)
DEFAULT_RADIUS_M = 1000


class POINearMeView(APIView):
    """
    GET /api/pois/near-me/?lat=<lat>&lng=<lng>&radius=<m>

    Trả về danh sách POI đang hoạt động trong bán kính (mặc định 1000m).
    Dùng thuật toán Haversine tính toán tại tầng Python (không cần PostGIS).
    Kết quả được sắp xếp tăng dần theo khoảng cách.

    Response: [ { ...poi_fields, distance: <float mét> }, ... ]
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            lat = float(request.query_params.get('lat', ''))
            lng = float(request.query_params.get('lng', ''))
        except (ValueError, TypeError):
            return Response(
                {'error': 'Tham số lat và lng là bắt buộc và phải là số thực.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        radius = float(request.query_params.get('radius', DEFAULT_RADIUS_M))

        pois = POI.objects.filter(status=POI.Status.ACTIVE).prefetch_related('media')

        # Tính distance và lọc trong Python (feasible với số POI nhỏ < vài nghìn)
        results = []
        for poi in pois:
            dist = poi.distance_to(lat, lng)
            if dist <= radius:
                poi._distance = dist
                results.append(poi)

        results.sort(key=lambda p: p._distance)

        # Inject distance vào serializer
        # Inject context (request) to serializer for language-aware translation
        serializer = POIListSerializer(results, many=True, context={'request': request})
        data = serializer.data
        for i, item in enumerate(data):
            item['distance'] = round(results[i]._distance, 1)

        return Response(data, status=status.HTTP_200_OK)


class POIDetailView(generics.RetrieveAPIView):
    """
    GET /api/pois/<id>/

    Trả về thông tin đầy đủ của một POI kèm media và partners.
    """
    queryset = POI.objects.filter(status=POI.Status.ACTIVE).prefetch_related('media', 'partners')
    serializer_class = POIDetailSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context


class POIScanView(APIView):
    """
    GET /api/pois/scan/?code=<qr_code_data>

    Tìm POI từ dữ liệu mã QR. Luôn trả về ngay lập tức (không qua anti-spam).
    Client sẽ trigger narration với trigger_type=QR sau khi nhận được POI.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get('code', '').strip()
        if not code:
            return Response(
                {'error': 'Tham số code là bắt buộc.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            poi = POI.objects.prefetch_related('media', 'partners').get(
                qr_code_data=code,
                status=POI.Status.ACTIVE,
            )
        except POI.DoesNotExist:
            return Response(
                {'error': f'Không tìm thấy điểm tham quan với mã QR: {code}'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(POIDetailSerializer(poi, context={'request': request}).data, status=status.HTTP_200_OK)


class POIMediaView(APIView):
    """
    GET /api/pois/<poi_id>/media/?language=vi&voice_region=mien_nam

    Trả về danh sách media của POI (có thể filter theo language và voice_region).
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsPartner()]

    def get(self, request, poi_id):
        qs = Media.objects.filter(
            poi_id=poi_id,
            status=Media.Status.ACTIVE,
        )
        language = request.query_params.get('language')
        voice_region = request.query_params.get('voice_region')
        if language:
            qs = qs.filter(language=language)
        
        # Trả về tất cả media của ngôn ngữ này. 
        # Frontend (getPOIMedia) sẽ tự chọn bản tốt nhất (exact match voice_region -> language match).
        return Response(MediaSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, poi_id):
        poi = POI.objects.filter(id=poi_id, owner=request.user).first()
        if not poi:
            return Response(
                {'error': 'Bạn không có quyền thêm media cho POI này.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = request.data.copy()
        payload['poi'] = poi.id

        media_type = (payload.get('media_type') or '').upper()
        upload_file = request.FILES.get('file')

        if media_type == Media.MediaType.AUDIO and upload_file:
            try:
                uploaded = cloudinary.uploader.upload(
                    upload_file,
                    resource_type='auto',
                    folder='bcsd/poi-audio',
                )
                payload['file_url'] = uploaded.get('secure_url', '')
            except Exception:
                return Response(
                    {'error': 'Upload audio thất bại.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = MediaCRUDSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        media = serializer.save()
        return Response(MediaSerializer(media).data, status=status.HTTP_201_CREATED)

class POIPartnersView(generics.ListAPIView):
    """
    GET /api/pois/<poi_id>/partners/

    Trả về danh sách đối tác ẩm thực của POI.
    """
    serializer_class = PartnerSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Partner.objects.filter(
            poi_id=self.kwargs['poi_id'],
            status=Partner.Status.ACTIVE,
        )


class PartnerMyPOIView(APIView):
    """
    CRUD POI cho tài khoản Partner.
    Mỗi tài khoản Partner chỉ được sở hữu tối đa 1 POI.
    """
    permission_classes = [IsAuthenticated, IsPartnerPremium]

    def get(self, request):
        # Ưu tiên theo quan hệ link từ Partner -> POI (admin có thể gán nhiều partner vào 1 POI).
        partner = Partner.objects.select_related('poi').filter(user=request.user).first()
        if partner and partner.poi_id:
            poi = partner.poi
            poi = POI.objects.filter(id=poi.id).prefetch_related('media', 'partners').first()
        else:
            # Fallback: trường hợp dữ liệu cũ / flow tạo POI gán owner.
            poi = POI.objects.filter(owner=request.user).prefetch_related('media', 'partners').first()

        if not poi:
            return Response({'error': 'No POI found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(POIDetailSerializer(poi).data, status=status.HTTP_200_OK)

    def post(self, request):
        partner = Partner.objects.filter(user=request.user).first()
        if not partner:
            return Response(
                {
                    'detail': (
                        'Chưa có hồ sơ đối tác. Vui lòng hoàn tất đăng ký / kích hoạt hồ sơ Partner '
                        'trước khi tạo POI.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        # Cho phép tạo / liên kết POI khi chờ duyệt hoặc đang hoạt động; chỉ chặn hồ sơ không hoạt động.
        if partner.status == Partner.Status.INACTIVE:
            return Response(
                {
                    'detail': (
                        'Hồ sơ đối tác không hoạt động (bị từ chối hoặc đã tắt). '
                        'Không thể tạo POI. Vui lòng liên hệ quản trị viên.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Không cho tạo trùng nếu partner đã có POI được link.
        has_linked_poi = bool(partner and partner.poi_id)
        has_owned_poi = POI.objects.filter(owner=request.user).exists()
        if has_linked_poi or has_owned_poi:
            return Response(
                {'error': 'You already have a POI'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = POIListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data
        lat, lng = vd['latitude'], vd['longitude']
        existing_active = POI.objects.filter(
            latitude=lat,
            longitude=lng,
            status=POI.Status.ACTIVE,
        ).first()
        if existing_active:
            if existing_active.owner_id is None:
                existing_active.owner = request.user
                existing_active.save(update_fields=['owner'])
            partner.poi = existing_active
            partner.save(update_fields=['poi'])
            if not existing_active.qr_code_data:
                existing_active.qr_code_data = f"POI_{existing_active.id}"
                existing_active.save(update_fields=['qr_code_data'])
            poi = (
                POI.objects.filter(id=existing_active.id)
                .prefetch_related('media', 'partners')
                .first()
            )
            return Response(
                POIDetailSerializer(poi, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )

        poi = serializer.save(owner=request.user)

        # Nếu đã tồn tại Partner profile thì link luôn để /my-poi/ hoạt động theo trường poi.
        if partner:
            partner.poi = poi
            partner.save(update_fields=['poi'])

        if not poi.qr_code_data:
            poi.qr_code_data = f"POI_{poi.id}"
            poi.save(update_fields=['qr_code_data'])

        poi = POI.objects.filter(id=poi.id).prefetch_related('media', 'partners').first()
        return Response(
            POIDetailSerializer(poi, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def put(self, request):
        partner = Partner.objects.select_related('poi').filter(user=request.user).first()
        if partner and partner.poi_id:
            poi = POI.objects.filter(id=partner.poi_id).first()
        else:
            poi = POI.objects.filter(owner=request.user).first()

        if not poi:
            return Response({'error': 'No POI found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = POIListSerializer(poi, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data
        new_lat = vd.get('latitude', poi.latitude)
        new_lng = vd.get('longitude', poi.longitude)
        new_status = vd.get('status', poi.status)
        if new_status == POI.Status.ACTIVE and POI.objects.filter(
            latitude=new_lat,
            longitude=new_lng,
            status=POI.Status.ACTIVE,
        ).exclude(pk=poi.pk).exists():
            return Response(
                {
                    'detail': (
                        'Đã tồn tại POI đang hoạt động khác tại cùng toạ độ (vĩ độ/kinh độ). '
                        'Chỉ được một POI hoạt động cho mỗi điểm.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        poi = serializer.save()
        poi = POI.objects.filter(id=poi.id).prefetch_related('media', 'partners').first()
        return Response(
            POIDetailSerializer(poi, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        partner = Partner.objects.filter(user=request.user).first()

        # Nếu partner đang link POI thì chỉ unlink; POI chỉ delete khi thuộc owner.
        if partner and partner.poi_id:
            linked_poi = POI.objects.filter(id=partner.poi_id).first()
            partner.poi = None
            partner.save(update_fields=['poi'])
            if linked_poi and linked_poi.owner_id == request.user.id:
                linked_poi.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        poi = POI.objects.filter(owner=request.user).first()
        if not poi:
            return Response(status=status.HTTP_404_NOT_FOUND)
        poi.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class POICoverImageView(APIView):
    """
    POST /api/pois/my-poi/cover-image/

    Partner upload ảnh bìa cho POI của mình lên Cloudinary.
    Chấp nhận multipart/form-data với field 'image'.
    Response: { cover_image_url: <url> }
    """
    permission_classes = [IsAuthenticated, IsPartnerPremium]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        # Tìm POI của partner (theo link hoặc owner)
        partner = Partner.objects.select_related('poi').filter(user=request.user).first()
        if partner and partner.poi_id:
            poi = POI.objects.filter(id=partner.poi_id).first()
        else:
            poi = POI.objects.filter(owner=request.user).first()

        if not poi:
            return Response(
                {'error': 'Không tìm thấy POI. Vui lòng tạo POI trước.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {'error': 'Vui lòng chọn file ảnh để upload.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Kiểm tra định dạng file (cho phép các định dạng ảnh phổ biến)
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'Định dạng ảnh không hợp lệ. Vui lòng dùng JPG, PNG, WebP hoặc GIF.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Giới hạn kích thước 10MB
        if image_file.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'File ảnh quá lớn. Kích thước tối đa là 10MB.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            uploaded = cloudinary.uploader.upload(
                image_file,
                resource_type='image',
                folder='bcsd/poi-covers',
                public_id=f'poi_{poi.id}_cover',
                overwrite=True,
                transformation=[
                    {'width': 1200, 'height': 630, 'crop': 'fill', 'quality': 'auto:good'},
                ],
            )
            cover_url = uploaded.get('secure_url', '')
        except Exception:
            return Response(
                {'error': 'Upload ảnh thất bại. Vui lòng thử lại.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        poi.cover_image_url = cover_url
        poi.save(update_fields=['cover_image_url'])

        return Response({'cover_image_url': cover_url}, status=status.HTTP_200_OK)


class POIMapQrUrlView(APIView):
    """
    GET /api/pois/my-poi/qr-map-url/

    Trả về đường dẫn /map?poi=&qr= kèm chữ ký có thời hạn 1 giờ (in mã QR đặt tại quán).
    """

    permission_classes = [IsAuthenticated, IsPartnerPremium]

    def get(self, request):
        partner = Partner.objects.select_related('poi').filter(user=request.user).first()
        poi = None
        if partner and partner.poi_id:
            poi = POI.objects.filter(id=partner.poi_id).first()
        else:
            poi = POI.objects.filter(owner=request.user).first()
        if not poi:
            return Response({'error': 'No POI found'}, status=status.HTTP_404_NOT_FOUND)

        token = sign_poi_map_qr(poi.id)
        map_path = '/map?' + urlencode({'poi': str(poi.id), 'qr': token})
        expires_at = timezone.now() + timedelta(seconds=MAP_QR_MAX_AGE)
        return Response(
            {
                'map_path': map_path,
                'expires_in_seconds': MAP_QR_MAX_AGE,
                'expires_at': expires_at.isoformat(),
            },
            status=status.HTTP_200_OK,
        )


class POIMapQrResolveView(APIView):
    """
    GET /api/pois/map-qr/resolve/?poi=<id>&qr=<signed_token>

    Xác thực chữ ký và trả về POI (cùng shape với GET /api/pois/<id>/).
    """

    permission_classes = [AllowAny]

    def get(self, request):
        poi_param = request.query_params.get('poi', '').strip()
        qr_token = request.query_params.get('qr', '').strip()
        if not poi_param or not qr_token:
            return Response(
                {'error': 'Tham số poi và qr là bắt buộc.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            expected_id = int(poi_param)
        except ValueError:
            return Response(
                {'error': 'Tham số poi không hợp lệ.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            verified_id = verify_poi_map_qr(qr_token)
        except SignatureExpired:
            return Response(
                {'error': 'Mã QR đã hết hạn (1 giờ). Vui lòng quét mã mới từ đối tác.'},
                status=status.HTTP_410_GONE,
            )
        except BadSignature:
            return Response(
                {'error': 'Mã QR không hợp lệ.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if verified_id != expected_id:
            return Response(
                {'error': 'Mã QR không khớp điểm tham quan.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            poi = POI.objects.prefetch_related('media', 'partners').get(
                id=verified_id,
                status=POI.Status.ACTIVE,
            )
        except POI.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy điểm tham quan.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            POIDetailSerializer(poi, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )


class MediaGenerateTTSView(APIView):
    """
    POST /api/pois/<poi_id>/media/<media_id>/generate-tts/
    Body (JSON): { "voice": "Aoede" }   ← optional, defaults to media.ai_voice or 'Aoede'

    Tạo audio TTS bằng Gemini AI cho bản ghi Media được chỉ định.
    Upload lên Cloudinary và cập nhật file_url.
    Permission: Partner sở hữu POI đó.
    """
    permission_classes = [IsAuthenticated, IsPartner]

    def post(self, request, poi_id, media_id):
        from .gemini_tts import generate_tts_audio
        import cloudinary.uploader

        # Kiểm tra POI ownership
        poi = None
        from partners.models import Partner as PartnerModel
        partner = PartnerModel.objects.filter(user=request.user).first()
        if partner and partner.poi_id == poi_id:
            poi = POI.objects.filter(id=poi_id).first()
        else:
            poi = POI.objects.filter(id=poi_id, owner=request.user).first()

        if not poi:
            return Response(
                {'error': 'Không tìm thấy POI hoặc bạn không có quyền.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            media = Media.objects.get(id=media_id, poi=poi)
        except Media.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy bản ghi âm thanh.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Lấy text
        text = media.tts_content or poi.description or ''
        if not text.strip():
            return Response(
                {'error': 'Không có văn bản để tạo TTS. Vui lòng thêm nội dung tts_content trước.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Kiểm tra Partner còn lượt TTS AI không (superuser bypass)
        if not request.user.is_superuser:
            from payments.models import get_ai_tts_price_vnd, get_ai_tts_quota_per_purchase
            if not partner or partner.ai_tts_quota <= 0:
                price = get_ai_tts_price_vnd()
                quota_per_purchase = get_ai_tts_quota_per_purchase()
                price_str = f"{price:,}".replace(',', '.')
                return Response(
                    {
                        'error': f'Bạn đã hết lượt tạo AI TTS. Cần thanh toán {price_str}₫ để mua thêm {quota_per_purchase} lượt.',
                        'payment_required': True,
                        'price': price,
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

        # Lấy voice
        voice = (request.data.get('voice') or media.ai_voice or '').strip()
        if voice:
            # Lưu lại voice đã chọn
            media.ai_voice = voice
            media.save(update_fields=['ai_voice'])
        else:
            voice = media.ai_voice or 'Aoede'

        try:
            wav_bytes = generate_tts_audio(text=text, voice_name=voice)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except RuntimeError as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            uploaded = cloudinary.uploader.upload(
                wav_bytes,
                resource_type='video',
                folder='bcsd/ai-tts',
                public_id=f'poi_{poi_id}_media_{media_id}_voice_{voice}',
                overwrite=True,
                format='wav',
            )
            file_url = uploaded.get('secure_url', '')
        except Exception as e:
            return Response(
                {'error': f'Upload Cloudinary thất bại: {e}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        media.file_url = file_url
        media.media_type = 'AUDIO'
        media.save(update_fields=['file_url', 'media_type'])

        # Trừ lượt (nếu không phải superuser)
        if not request.user.is_superuser and partner and partner.ai_tts_quota > 0:
            partner.ai_tts_quota -= 1
            partner.save(update_fields=['ai_tts_quota'])

        return Response(
            {
                'file_url': file_url,
                'voice': voice,
                'media': MediaCRUDSerializer(media).data,
            },
            status=status.HTTP_200_OK,
        )


class AITranslateAllView(APIView):
    """
    POST /api/pois/<poi_id>/translate-all/
    Dịch mô tả POI sang tất cả ngôn ngữ có trong Media list chỉ với 1 Gemini request.
    Trừ 1 lượt ai_translate_quota sau khi thành công.
    Permission: Partner sở hữu POI đó.
    """
    permission_classes = [IsAuthenticated, IsPartner]

    def post(self, request, poi_id):
        from .gemini_translate import translate_poi

        # Kiểm tra quyền sở hữu POI
        poi = None
        try:
            from partners.models import Partner as PartnerModel
        except ImportError:
            from pois.models import Partner as PartnerModel

        partner = PartnerModel.objects.filter(user=request.user).first()
        if partner and partner.poi_id == poi_id:
            poi = POI.objects.filter(id=poi_id).first()

        if not poi:
            # Superuser có thể dùng bất kỳ POI nào
            if request.user.is_superuser:
                poi = POI.objects.filter(id=poi_id).first()
            if not poi:
                return Response(
                    {'error': 'Bạn không có quyền truy cập POI này.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Kiểm tra quota (superuser bypass)
        if not request.user.is_superuser:
            if not partner or partner.ai_translate_quota <= 0:
                from payments.models import get_ai_translate_price_vnd, get_ai_translate_quota_per_purchase
                return Response({
                    'error': 'Bạn đã hết lượt dịch AI. Hãy nạp thêm lượt.',
                    'price': get_ai_translate_price_vnd(),
                    'quota_per_purchase': get_ai_translate_quota_per_purchase(),
                }, status=status.HTTP_402_PAYMENT_REQUIRED)

        # Lấy danh sách ngôn ngữ từ Media records hiện có (loại trừ vi)
        media_qs = Media.objects.filter(poi=poi)
        languages = list(set(m.language for m in media_qs if m.language and m.language != 'vi'))

        if not languages:
            return Response(
                {'error': 'POI chưa có Media với ngôn ngữ nào ngoài tiếng Việt. Hãy thêm Media trước.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Gọi Gemini để dịch
        source_text = poi.description or ''
        if not source_text:
            return Response(
                {'error': 'POI chưa có mô tả. Hãy điền mô tả trước khi dịch.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            translations = translate_poi(
                poi_name=poi.name,
                description=source_text,
                languages=languages,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except RuntimeError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Cập nhật tts_content & translated_name cho từng Media record
        updated_media = []
        for lang, trans in translations.items():
            translated_name = trans.get('translated_name', poi.name)
            tts_content = trans.get('tts_content', '')
            # Cập nhật TẤT CẢ Media records có ngôn ngữ này (mọi voice_region)
            media_qs.filter(language=lang).update(
                tts_content=tts_content,
                translated_name=translated_name,
            )
            updated_records = media_qs.filter(language=lang)
            updated_media.extend(MediaCRUDSerializer(updated_records, many=True).data)

        # Trừ 1 lượt (nếu không phải superuser và còn lượt)
        if not request.user.is_superuser and partner and partner.ai_translate_quota > 0:
            partner.ai_translate_quota -= 1
            partner.save(update_fields=['ai_translate_quota'])

        # Lấy quota thực tế từ DB
        if partner:
            partner.refresh_from_db(fields=['ai_translate_quota'])
            remaining_quota = partner.ai_translate_quota
        else:
            remaining_quota = 0

        return Response({
            'success': True,
            'translated_languages': list(translations.keys()),
            'updated_media': updated_media,
            'remaining_quota': remaining_quota,
        }, status=status.HTTP_200_OK)
