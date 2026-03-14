from django.urls import path
from . import views

app_name = 'pois'

urlpatterns = [
    # Tìm POI gần vị trí hiện tại: GET /api/pois/near-me/?lat=...&lng=...&radius=...
    path('near-me/', views.POINearMeView.as_view(), name='near-me'),

    # Quét QR: GET /api/pois/scan/?code=BCSD-POI-001
    # (phải đặt TRƯỚC <int:pk>/ để tránh conflict)
    path('scan/', views.POIScanView.as_view(), name='scan'),

    # Chi tiết POI (embed media + partners)
    path('<int:pk>/', views.POIDetailView.as_view(), name='detail'),

    # Media theo ngôn ngữ: GET /api/pois/<id>/media/?language=vi&voice_region=mien_nam
    path('<int:poi_id>/media/', views.POIMediaView.as_view(), name='media'),

    # Danh sách đối tác ẩm thực: GET /api/pois/<id>/partners/
    path('<int:poi_id>/partners/', views.POIPartnersView.as_view(), name='partners'),
]
