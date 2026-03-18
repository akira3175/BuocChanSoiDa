from django.urls import path
from . import views

app_name = 'pois'

urlpatterns = [
    # POI endpoints
    path('near-me/', views.POINearMeView.as_view(), name='near-me'),
    path('scan/', views.POIScanView.as_view(), name='scan'),
    path('<int:pk>/', views.POIDetailView.as_view(), name='detail'),
    path('<int:poi_id>/media/', views.POIMediaView.as_view(), name='media'),
    path('<int:poi_id>/partners/', views.POIPartnersView.as_view(), name='poi-partners'),
]
