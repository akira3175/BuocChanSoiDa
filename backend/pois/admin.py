from django.contrib import admin
from django.utils.html import format_html
from django.contrib import messages
from django import forms
from .models import POI, Media, Partner

# ─── Language code mappings ────────────────────────────────────────────────────
LANG_TO_TTS = {
    'vi': 'vi-VN',
    'en': 'en-US',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'es': 'es-ES',
    'th': 'th-TH',
}

LANG_NAMES = {
    'vi': 'Tiếng Việt', 'en': 'English', 'ja': '日本語',
    'ko': '한국어', 'zh': '中文', 'fr': 'Français',
    'de': 'Deutsch', 'es': 'Español', 'th': 'ภาษาไทย',
}


# ─── Forms ──────────────────────────────────────────────────────────────────
class POIAdminForm(forms.ModelForm):
    class Meta:
        model = POI
        fields = '__all__'
        widgets = {
            'latitude': forms.NumberInput(attrs={'step': 'any', 'placeholder': '10.755...', 'style': 'width:180px'}),
            'longitude': forms.NumberInput(attrs={'step': 'any', 'placeholder': '106.703...', 'style': 'width:180px'}),
        }


# ─── Inlines ────────────────────────────────────────────────────────────────
class MediaInline(admin.StackedInline):
    model = Media
    extra = 1
    fields = ['language', 'voice_region', 'media_type', 'file_url', 'tts_content', 'status']
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


# ─── POI Admin ──────────────────────────────────────────────────────────────
@admin.register(POI)
class POIAdmin(admin.ModelAdmin):
    form = POIAdminForm
    list_display = ['id', 'name', 'category', 'latitude', 'longitude', 'geofence_radius', 'status_badge', 'narration_count']
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
        return format_html(
            '<span style="color:{};font-weight:600">{}</span>',
            colors.get(obj.status, '#6c757d'),
            labels.get(obj.status, str(obj.status)),
        )
    status_badge.short_description = 'Trạng thái'
    status_badge.admin_order_field = 'status'

    def narration_count(self, obj):
        count = obj.narration_logs.count()
        return format_html('<span style="font-weight:600;color:#0066cc">🎧 {}</span>', count)
    narration_count.short_description = 'Lượt nghe'


# ─── Media Admin ─────────────────────────────────────────────────────────────
@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'poi', 'language_label', 'voice_region', 'media_type', 'tts_status', 'status', 'preview_link']
    list_filter = ['language', 'media_type', 'status']
    search_fields = ['poi__name']
    list_select_related = ['poi']
    list_per_page = 30
    readonly_fields = ['preview_link', 'original_text_display']
    actions = ['auto_translate']

    fieldsets = (
        ('📌 Thông tin cơ bản', {
            'fields': ('poi', 'language', 'voice_region', 'media_type', 'status'),
        }),
        ('📝 Văn bản gốc (tham khảo)', {
            'description': 'Nội dung tiếng Việt lấy tự động từ mô tả POI.',
            'fields': ('original_text_display',),
            'classes': ('collapse',),
        }),
        ('🌐 Nội dung đã dịch (→ TTS)', {
            'description': (
                'Điền văn bản đã dịch vào đây để App đọc TTS khi khách chọn ngôn ngữ này. '
                'Hoặc chọn nhiều bản ghi ở danh sách rồi nhấn <b>Action: Tự động dịch</b>.'
            ),
            'fields': ('tts_content',),
        }),
        ('🔊 File âm thanh thu sẵn (tuỳ chọn)', {
            'description': 'Upload file MP3 chất lượng cao. Nếu có, App ưu tiên phát file này thay vì TTS.',
            'fields': ('file_url', 'preview_link'),
            'classes': ('collapse',),
        }),
    )

    def original_text_display(self, obj):
        if obj.poi_id:
            text = obj.poi.description or '(Chưa có mô tả)'
            return format_html('<div style="white-space:pre-wrap;max-height:200px;overflow-y:auto;background:#f8f8f8;padding:8px;border-radius:4px">{}</div>', text)
        return '—'
    original_text_display.short_description = '📄 Văn bản gốc (Tiếng Việt)'

    def language_label(self, obj):
        return LANG_NAMES.get(obj.language, obj.language)
    language_label.short_description = 'Ngôn ngữ'
    language_label.admin_order_field = 'language'

    def tts_status(self, obj):
        if obj.tts_content:
            preview = obj.tts_content[:40] + '…' if len(obj.tts_content) > 40 else obj.tts_content
            return format_html('<span style="color:#28a745" title="{}">✅ Đã dịch</span>', preview)
        return format_html('<span style="color:#dc3545">⛔ Chưa dịch</span>')
    tts_status.short_description = 'Nội dung TTS'

    def preview_link(self, obj):
        if obj.file_url:
            return format_html('<a href="{}" target="_blank">▶ Nghe</a>', obj.file_url)
        return '—'
    preview_link.short_description = 'Nghe thử'

    @admin.action(description='🌐 Tự động dịch nội dung POI sang ngôn ngữ của bản ghi')
    def auto_translate(self, request, queryset):
        try:
            from deep_translator import GoogleTranslator
        except ImportError:
            self.message_user(request, '❌ Thư viện deep-translator chưa được cài. Chạy: pip install deep-translator', messages.ERROR)
            return

        success, skipped, errors = 0, 0, 0
        for media in queryset.select_related('poi'):
            if not media.poi.description:
                skipped += 1
                continue

            target_lang = media.language
            if target_lang == 'vi':
                # Tiếng Việt → không cần dịch, dùng luôn bản gốc
                media.tts_content = media.poi.description
                media.save(update_fields=['tts_content'])
                success += 1
                continue

            try:
                translator = GoogleTranslator(source='vi', target=target_lang)
                translated = translator.translate(media.poi.description)
                media.tts_content = translated
                media.save(update_fields=['tts_content'])
                success += 1
            except Exception as e:
                errors += 1
                self.message_user(
                    request,
                    f'❌ Lỗi dịch [{media.poi.name} → {target_lang}]: {e}',
                    messages.WARNING,
                )

        summary = f'✅ Dịch thành công: {success}'
        if skipped:
            summary += f' | ⏭️ Bỏ qua (chưa có mô tả): {skipped}'
        if errors:
            summary += f' | ❌ Lỗi: {errors}'
        self.message_user(request, summary, messages.SUCCESS if success else messages.WARNING)
