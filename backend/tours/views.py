from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly

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
        return Tour_POI.objects.filter(status=Tour_POI.Status.ACTIVE)


class TourPOIDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/tours/pois/<id>/
    PUT /api/tours/pois/<id>/
    DELETE /api/tours/pois/<id>/
    """
    queryset = Tour_POI.objects.all()
    serializer_class = TourPOISerializer
    permission_classes = [IsAuthenticatedOrReadOnly]