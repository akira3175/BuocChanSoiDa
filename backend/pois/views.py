from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Media, POI, Partner
from .serializers import (
    MediaSerializer,
    POIDetailSerializer,
    POIListSerializer,
)
from partners.serializers import PartnerSerializer

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


class POIMediaView(generics.ListAPIView):
    """
    GET /api/pois/<poi_id>/media/?language=vi&voice_region=mien_nam

    Trả về danh sách media của POI (có thể filter theo language và voice_region).
    """
    serializer_class = MediaSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        poi_id = self.kwargs['poi_id']
        qs = Media.objects.filter(
            poi_id=poi_id,
            status=Media.Status.ACTIVE,
        )
        language = self.request.query_params.get('language')
        voice_region = self.request.query_params.get('voice_region')
        if language:
            qs = qs.filter(language=language)
        if voice_region:
            qs = qs.filter(voice_region=voice_region)
        return qs

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
