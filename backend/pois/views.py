from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
import cloudinary.uploader

from .models import Media, POI, Partner
from .serializers import (
    MediaCRUDSerializer,
    MediaSerializer,
    POIDetailSerializer,
    POIListSerializer,
)
from partners.serializers import PartnerSerializer
from users.permissions import IsPartner

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

        pois = POI.objects.filter(status=POI.Status.ACTIVE)

        # Tính distance và lọc trong Python (feasible với số POI nhỏ < vài nghìn)
        results = []
        for poi in pois:
            dist = poi.distance_to(lat, lng)
            if dist <= radius:
                poi._distance = dist
                results.append(poi)

        results.sort(key=lambda p: p._distance)

        # Inject distance vào serializer
        serializer = POIListSerializer(results, many=True)
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
        return Response(POIDetailSerializer(poi).data, status=status.HTTP_200_OK)


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
        if voice_region:
            qs = qs.filter(voice_region=voice_region)
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
    permission_classes = [IsAuthenticated, IsPartner]

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
        # Không cho tạo trùng nếu partner đã có POI được link.
        partner = Partner.objects.filter(user=request.user).first()
        has_linked_poi = bool(partner and partner.poi_id)
        has_owned_poi = POI.objects.filter(owner=request.user).exists()
        if has_linked_poi or has_owned_poi:
            return Response(
                {'error': 'You already have a POI'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = POIListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        poi = serializer.save(owner=request.user)

        # Nếu đã tồn tại Partner profile thì link luôn để /my-poi/ hoạt động theo trường poi.
        if partner:
            partner.poi = poi
            partner.save(update_fields=['poi'])

        if not poi.qr_code_data:
            poi.qr_code_data = f"POI_{poi.id}"
            poi.save(update_fields=['qr_code_data'])

        return Response(POIDetailSerializer(poi).data, status=status.HTTP_201_CREATED)

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
        poi = serializer.save()
        return Response(POIDetailSerializer(poi).data, status=status.HTTP_200_OK)

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
