from django.urls import path

from . import views

app_name = 'partners'

urlpatterns = [
    path('', views.PartnerListCreateView.as_view(), name='list-create'),
    path('<int:pk>/', views.PartnerDetailCRUDView.as_view(), name='detail-crud'),
]
