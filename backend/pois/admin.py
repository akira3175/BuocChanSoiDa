from django.contrib import admin
from django import forms
# import mapwidgets
from .models import POI, Media, Partner


class POIAdminForm(forms.ModelForm):
    """
    Form dùng MapboxPointFieldWidget để admin click bản đồ chọn tọa độ.
    Dùng 2 field riêng biệt latitude + longitude với widget PointFieldInlineAdmin.
    """
    class Meta:
        model = POI
        fields = '__all__'
        widgets = {
            'latitude': forms.NumberInput(attrs={
                'step': 'any',
                'placeholder': '10.755...',
                'style': 'width:180px',
            }),
            'longitude': forms.NumberInput(attrs={
                'step': 'any',
                'placeholder': '106.703...',
                'style': 'width:180px',
            }),
        }


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
    form = POIAdminForm
    list_display = ['id', 'name', 'category', 'latitude', 'longitude', 'geofence_radius', 'status']
    list_filter = ['status', 'category']
    search_fields = ['name', 'description', 'qr_code_data']
    ordering = ['name']
    inlines = [MediaInline, PartnerInline]

    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('name', 'description', 'category', 'status'),
        }),
        ('📍 Vị trí & Geofence', {
            'description': (
                '👉 Nhập toạ độ thủ công, hoặc mở Google Maps → click chuột phải → '
                '"Copy coordinates" → dán vào 2 ô dưới đây.<br>'
                '📌 Ví dụ phố Vĩnh Khánh Q4: Vĩ độ <b>10.7552</b>, Kinh độ <b>106.7038</b>'
            ),
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


