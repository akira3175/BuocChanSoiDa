from django.contrib import admin
from django.utils.html import format_html
from django import forms
from .models import POI, Media, Partner


class POIAdminForm(forms.ModelForm):
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
    readonly_fields = ['preview_link']

    def preview_link(self, obj):
        if obj.file_url:
            return format_html('<a href="{}" target="_blank">▶ Nghe</a>', obj.file_url)
        return '—'
    preview_link.short_description = 'Nghe thử'


class PartnerInline(admin.TabularInline):
    model = Partner
    extra = 1
    fields = ['business_name', 'intro_text', 'opening_hours', 'status']


@admin.register(POI)
class POIAdmin(admin.ModelAdmin):
    form = POIAdminForm
    list_display = [
        'id', 'name', 'category', 'latitude', 'longitude',
        'geofence_radius', 'status_badge', 'narration_count',
    ]
    list_filter = ['status', 'category']
    search_fields = ['name', 'description', 'qr_code_data']
    ordering = ['name']
    inlines = [MediaInline, PartnerInline]
    list_per_page = 30

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
            'classes': ('collapse',),
        }),
    )

    def status_badge(self, obj):
        colors = {POI.Status.ACTIVE: '#28a745', POI.Status.INACTIVE: '#dc3545'}
        labels = {POI.Status.ACTIVE: '✅ Hoạt động', POI.Status.INACTIVE: '❌ Ẩn'}
        color = colors.get(obj.status, '#6c757d')
        label = labels.get(obj.status, str(obj.status))
        return format_html(
            '<span style="color:{};font-weight:600">{}</span>', color, label
        )
    status_badge.short_description = 'Trạng thái'
    status_badge.admin_order_field = 'status'

    def narration_count(self, obj):
        count = obj.narration_logs.count()
        return format_html(
            '<span style="font-weight:600;color:#0066cc">🎧 {}</span>', count
        )
    narration_count.short_description = 'Lượt nghe'


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'poi', 'language', 'voice_region', 'media_type', 'status', 'preview_link']
    list_filter = ['language', 'voice_region', 'media_type', 'status']
    search_fields = ['poi__name']
    list_select_related = ['poi']
    list_per_page = 30

    def preview_link(self, obj):
        if obj.file_url:
            return format_html('<a href="{}" target="_blank">▶ Nghe</a>', obj.file_url)
        return '—'
    preview_link.short_description = 'Nghe thử'
