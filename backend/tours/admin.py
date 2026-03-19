from django.contrib import admin
from .models import Tour, Tour_POI


@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = ('id', 'tour_name', 'estimated_duration_min', 'created_by', 'is_suggested', 'status')
    list_filter = ('status', 'is_suggested')
    search_fields = ('tour_name', 'description', 'created_by__username')


@admin.register(Tour_POI)
class TourPOIAdmin(admin.ModelAdmin):
    list_display = ('id', 'tour', 'poi', 'sequence_order', 'status')
    list_filter = ('status', 'tour')
    search_fields = ('tour__tour_name', 'poi__name')
    ordering = ('tour', 'sequence_order')
