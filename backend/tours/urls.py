from django.urls import path

from .views import (
    TourListView, 
    TourDetailView,
    TourPOIListCreateView,
    TourPOIDetailView,
)

app_name = 'tours'

urlpatterns = [
    path('', TourListView.as_view(), name='tour-list'),
    path('<int:pk>/', TourDetailView.as_view(), name='tour-detail'),
    path('pois/', TourPOIListCreateView.as_view(), name='tour-poi-list'),
    path('pois/<int:pk>/', TourPOIDetailView.as_view(), name='tour-poi-detail'),
]