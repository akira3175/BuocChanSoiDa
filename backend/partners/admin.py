from django.contrib import admin
from django.utils.html import format_html
from .models import Partner


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'business_name', 'poi', 'opening_hours',
        'has_intro_tts', 'status_badge',
    ]
    list_filter = ['status', 'poi']
    search_fields = ['business_name', 'poi__name']
    list_select_related = ['poi']
    list_per_page = 30
    actions = ['mark_pending_approval', 'approve_selected', 'reject_selected']

    fieldsets = (
        ('Thông tin cơ sở', {
            'fields': ('poi', 'business_name', 'opening_hours', 'status'),
        }),
        ('🎙️ Nội dung TTS giới thiệu', {
            'description': (
                'Văn bản sẽ được đọc TTS sau khi thuyết minh POI kết thúc. '
                'Để trống nếu không muốn phát giới thiệu đối tác.'
            ),
            'fields': ('intro_text',),
        }),
        ('📋 Menu & Chi tiết', {
            'fields': ('menu_details',),
            'classes': ('collapse',),
        }),
    )

    def has_intro_tts(self, obj):
        if obj.intro_text and obj.intro_text.strip():
            preview = obj.intro_text[:40] + ('...' if len(obj.intro_text) > 40 else '')
            return format_html(
                '<span style="color:#28a745" title="{}">✅ Có TTS</span>', preview
            )
        return format_html('<span style="color:#6c757d">— Chưa có</span>')
    has_intro_tts.short_description = 'Intro TTS'

    def status_badge(self, obj):
        colors = {
            Partner.Status.ACTIVE: '#28a745',
            Partner.Status.INACTIVE: '#dc3545',
            Partner.Status.PENDING_APPROVAL: '#ffc107',
        }
        labels = {
            Partner.Status.ACTIVE: '✅ Hoạt động',
            Partner.Status.INACTIVE: '❌ Bị từ chối',
            Partner.Status.PENDING_APPROVAL: '⏳ Chờ duyệt',
        }
        color = colors.get(obj.status, '#6c757d')
        label = labels.get(obj.status, str(obj.status))
        return format_html(
            '<span style="color:{};font-weight:600">{}</span>', color, label
        )
    status_badge.short_description = 'Trạng thái'
    status_badge.admin_order_field = 'status'

    @admin.action(description='⏳ Đánh dấu chờ phê duyệt')
    def mark_pending_approval(self, request, queryset):
        updated = queryset.update(status=Partner.Status.PENDING_APPROVAL)
        self.message_user(request, f'{updated} đối tác được đánh dấu chờ duyệt.')

    @admin.action(description='✅ Duyệt đối tác đã chọn')
    def approve_selected(self, request, queryset):
        updated = queryset.update(status=Partner.Status.ACTIVE)
        self.message_user(request, f'{updated} đối tác đã được duyệt.')

    @admin.action(description='❌ Từ chối đối tác đã chọn')
    def reject_selected(self, request, queryset):
        updated = queryset.update(status=Partner.Status.INACTIVE)
        self.message_user(request, f'{updated} đối tác đã bị từ chối.')
