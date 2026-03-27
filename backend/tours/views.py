import json

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Tour, Tour_POI
from .serializers import TourSerializer, TourPOISerializer


class TourListView(generics.ListCreateAPIView):
    """
    GET /api/tours/
    Danh sách các tour đang hoạt động.

    POST /api/tours/
    Tạo tour mới.
    """
    serializer_class = TourSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return (
            Tour.objects
            .filter(status=Tour.Status.ACTIVE)
            .prefetch_related('tour_pois__poi')
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TourDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/tours/<id>/
    PUT /api/tours/<id>/
    DELETE /api/tours/<id>/
    """
    queryset = Tour.objects.all()
    serializer_class = TourSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class TourPOIListCreateView(generics.ListCreateAPIView):
    """
    GET /api/tours/pois/
    Danh sách các Tour_POI.

    POST /api/tours/pois/
    Thêm POI vào Tour.
    """
    serializer_class = TourPOISerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Tour_POI.objects.filter(
            status=Tour_POI.Status.ACTIVE,
            poi__status=1,
            tour__status=Tour.Status.ACTIVE,
        )


class TourPOIDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/tours/pois/<id>/
    PUT /api/tours/pois/<id>/
    DELETE /api/tours/pois/<id>/
    """
    queryset = Tour_POI.objects.all()
    serializer_class = TourPOISerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class TourPOIGroupedView(APIView):
    """
    GET /api/tours/tour-pois/
    Trả về danh sách nhóm tour_pois theo từng tour để frontend build offline package.

    Query params:
    - tour_ids=1,2,3  (tùy chọn) lọc theo danh sách tour id.
    """

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        raw_tour_ids = request.query_params.get('tour_ids', '').strip()
        tour_ids = []
        if raw_tour_ids:
            for value in raw_tour_ids.split(','):
                value = value.strip()
                if value.isdigit():
                    tour_ids.append(int(value))

        tours_qs = Tour.objects.filter(status=Tour.Status.ACTIVE)
        if tour_ids:
            tours_qs = tours_qs.filter(id__in=tour_ids)

        tours = list(tours_qs.order_by('id'))
        if not tours:
            return Response([])

        tour_id_set = {tour.id for tour in tours}
        mappings = (
            Tour_POI.objects
            .filter(
                tour_id__in=tour_id_set,
                status=Tour_POI.Status.ACTIVE,
                poi__status=1,
            )
            .select_related('poi', 'tour')
            .order_by('tour_id', 'sequence_order')
        )

        grouped = {
            tour.id: {
                'tour_id': tour.id,
                'tour_name': tour.tour_name,
                'description': tour.description,
                'is_suggested': tour.is_suggested,
                'estimated_duration_min': tour.estimated_duration_min,
                'items': [],
            }
            for tour in tours
        }

        for mapping in mappings:
            grouped[mapping.tour_id]['items'].append({
                'sequence_order': mapping.sequence_order,
                'poi': {
                    'id': mapping.poi.id,
                    'name': mapping.poi.name,
                    'description': mapping.poi.description,
                    'latitude': mapping.poi.latitude,
                    'longitude': mapping.poi.longitude,
                    'geofence_radius': mapping.poi.geofence_radius,
                    'category': mapping.poi.category,
                    'qr_code_data': mapping.poi.qr_code_data,
                    'status': mapping.poi.status,
                },
            })

        result = []
        for group in grouped.values():
            payload_bytes = len(
                json.dumps(group, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
            )
            group['payload_bytes'] = payload_bytes
            result.append(group)

        return Response(result)