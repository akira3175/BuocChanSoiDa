from django.contrib import admin
from .models import POI, Media, Partner


class MediaInline(admin.TabularInline):
    model = Media
    extra = 1
    fields = ['language', 'voice_region', 'media_type', 'file_url', 'status']


class PartnerInline(admin.TabularInline):
    model = Partner
    extra = 1
    fields = ['business_name', 'opening_hours', 'status']


@admin.register(POI)
class POIAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'latitude', 'longitude', 'geofence_radius', 'status']
    list_filter = ['status', 'category']
    search_fields = ['name', 'description', 'qr_code_data']
    ordering = ['name']
    inlines = [MediaInline, PartnerInline]
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('name', 'description', 'category', 'status'),
        }),
        ('Địa lý & Geofence', {
            'fields': ('latitude', 'longitude', 'geofence_radius'),
        }),
        ('QR Code', {
            'fields': ('qr_code_data',),
        }),
    )


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'poi', 'language', 'voice_region', 'media_type', 'status']
    list_filter = ['language', 'voice_region', 'media_type', 'status']
    search_fields = ['poi__name']
    list_select_related = ['poi']


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ['id', 'business_name', 'poi', 'opening_hours', 'status']
    list_filter = ['status']
    search_fields = ['business_name', 'poi__name']
    list_select_related = ['poi']
