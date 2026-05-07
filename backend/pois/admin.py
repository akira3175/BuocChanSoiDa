from django.contrib import admin
from django.utils.html import format_html
from django.contrib import messages
from django.urls import path, reverse
from django.shortcuts import get_object_or_404, redirect
from django import forms
from .models import GeminiApiConfig, POI, Media, Partner
from pois.gemini_tts import GEMINI_VOICE_CHOICES

# ─── Language code mappings ────────────────────────────────────────────────────
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


class GeminiApiConfigAdminForm(forms.ModelForm):
    """Form hiển thị API Key dạng password (không bao giờ hiện giá trị thực)."""
    api_key_input = forms.CharField(
        label='Gemini API Key',
        required=False,
        widget=forms.PasswordInput(render_value=False, attrs={'style': 'width:420px', 'autocomplete': 'new-password'}),
        help_text=(
            'Nhập API Key mới để cập nhật. Để trống nếu không muốn thay đổi. '
            'Key được mã hóa Fernet trước khi lưu vào DB.'
        ),
    )

    class Meta:
        model = GeminiApiConfig
        fields = ['api_key_input', 'tts_model', 'default_voice']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['api_key_input'].initial = ''
        self.fields['default_voice'].widget = forms.Select(choices=[('', '—')] + list(GEMINI_VOICE_CHOICES))

    def save(self, commit=True):
        instance = super().save(commit=False)
        new_key = self.cleaned_data.get('api_key_input', '').strip()
        if new_key:
            instance.api_key = new_key  # triggers setter → mã hóa Fernet
        if commit:
            instance.save()
        return instance


# ─── GeminiApiConfig Admin — chỉ superuser ───────────────────────────────────
@admin.register(GeminiApiConfig)
class GeminiApiConfigAdmin(admin.ModelAdmin):
    form = GeminiApiConfigAdminForm
    list_display = ['__str__', 'tts_model', 'default_voice', 'api_key_status', 'updated_at']
    readonly_fields = ['created_at', 'updated_at', 'api_key_status']
    fieldsets = (
        ('🔑 API Key (Fernet encrypted)', {
            'description': (
                '<b style="color:#dc3545">⚠️ Chỉ superuser mới thấy trang này.</b><br>'
                'API Key được mã hóa bằng Fernet (AES-128-CBC) dẫn xuất từ SECRET_KEY Django. '
                'Key thực không bao giờ lưu dạng plaintext trong DB.'
            ),
            'fields': ('api_key_input', 'api_key_status'),
        }),
        ('⚙️ Cấu hình TTS', {
            'fields': ('tts_model', 'default_voice'),
        }),
        ('📅 Thời gian', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def api_key_status(self, obj):
        if obj and obj.pk and obj.api_key:
            return format_html('<span style="color:#28a745;font-weight:bold">✅ Đã cấu hình</span>')
        return format_html('<span style="color:#dc3545;font-weight:bold">⛔ Chưa có API Key</span>')
    api_key_status.short_description = 'Trạng thái API Key'

    def has_module_perms(self, request, app_label=None):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        if not request.user.is_superuser:
            return super().get_queryset(request).none()
        return super().get_queryset(request)


# ─── Inlines ─────────────────────────────────────────────────────────────────
class MediaInline(admin.StackedInline):
    model = Media
    extra = 1
    fields = [
        'language', 'voice_region', 'media_type', 'ai_voice',
        'file_url', 'tts_content', 'audio_player',
        'generate_ai_tts_button',
        'status',
    ]
    readonly_fields = ['audio_player', 'generate_ai_tts_button']

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'ai_voice':
            kwargs['widget'] = forms.Select(
                choices=[('', '— Mặc định (Aoede) —')] + list(GEMINI_VOICE_CHOICES)
            )
        return super().formfield_for_dbfield(db_field, request, **kwargs)

    def audio_player(self, obj):
        if obj.file_url:
            return format_html(
                '<audio controls style="width:100%;max-width:400px"><source src="{}" type="audio/mpeg"></audio>'
                '<br><a href="{}" target="_blank" style="font-size:12px;color:#0066cc">🔗 {}</a>',
                obj.file_url, obj.file_url,
                obj.file_url[:80] + '...' if len(obj.file_url) > 80 else obj.file_url,
            )
        return format_html('<span style="color:#999">⏳ Chưa có file TTS</span>')
    audio_player.short_description = '🔊 Nghe TTS Audio'

    def generate_ai_tts_button(self, obj):
        """Nút Tạo TTS AI ngay trong inline — chỉ hiện khi bản ghi đã tồn tại (có pk)."""
        if not obj.pk:
            return format_html(
                '<span style="color:#999;font-size:12px">'
                '💾 Lưu bản ghi trước để có thể tạo TTS AI.</span>'
            )
        url = reverse('admin:pois_media_generate_ai_tts', args=[obj.pk])
        voice = obj.ai_voice or 'Aoede'
        return format_html(
            '<a href="{}" '
            'style="display:inline-block;padding:6px 14px;background:#6f42c1;color:#fff;'
            'border-radius:6px;font-size:12px;font-weight:bold;text-decoration:none;'
            'transition:background .2s" '
            'onclick="return confirm(\'Tạo TTS AI bằng giọng {} cho bản ghi này?\\n'
            'File âm thanh hiện tại sẽ bị thay thế.\')">'
            '🤖 Tạo TTS AI (giọng: {})</a>',
            url, voice, voice,
        )
    generate_ai_tts_button.short_description = '🤖 Tạo TTS bằng Gemini AI'


class PartnerInline(admin.TabularInline):
    model = Partner
    extra = 1
    fields = ['business_name', 'intro_text', 'opening_hours', 'status']


# ─── POI Admin ────────────────────────────────────────────────────────────────
@admin.register(POI)
class POIAdmin(admin.ModelAdmin):
    form = POIAdminForm
    list_display = [
        'id', 'name', 'category', 'latitude', 'longitude', 'geofence_radius',
        'status_badge', 'cover_thumbnail', 'created_at', 'updated_at', 'narration_count',
    ]
    readonly_fields = ['created_at', 'updated_at', 'cover_preview']
    list_filter = ['status', 'category']
    search_fields = ['name', 'description', 'qr_code_data']
    ordering = ['name']
    inlines = [MediaInline]
    list_per_page = 30

    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('name', 'description', 'category', 'status', 'created_at', 'updated_at'),
        }),
        ('🖼️ Ảnh bìa', {
            'fields': ('cover_image_url', 'cover_preview'),
            'description': 'URL ảnh bìa hiển thị cho điểm tham quan.',
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

    def cover_thumbnail(self, obj):
        if obj.cover_image_url:
            return format_html(
                '<img src="{}" style="height:36px;width:64px;object-fit:cover;border-radius:4px;border:1px solid #e2e8f0" />',
                obj.cover_image_url,
            )
        return format_html('<span style="color:#ccc;font-size:11px">— Chưa có ảnh</span>')
    cover_thumbnail.short_description = 'Ảnh bìa'

    def cover_preview(self, obj):
        if obj.cover_image_url:
            return format_html(
                '<div style="margin-top:4px">'
                '<img src="{}" style="max-width:480px;max-height:240px;border-radius:8px;border:1px solid #e2e8f0;object-fit:cover" />'
                '<br><a href="{}" target="_blank" style="font-size:11px;color:#0066cc">🔗 {}</a>'
                '</div>',
                obj.cover_image_url, obj.cover_image_url,
                obj.cover_image_url[:80] + '...' if len(obj.cover_image_url) > 80 else obj.cover_image_url,
            )
        return format_html('<span style="color:#999">⚠️ Chưa có ảnh bìa</span>')
    cover_preview.short_description = '🖼️ Xem trước ảnh bìa'


# ─── Media Admin ──────────────────────────────────────────────────────────────
@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'poi', 'language_label', 'voice_region', 'ai_voice',
        'media_type', 'tts_status', 'audio_status', 'status', 'preview_link',
    ]
    list_filter = ['language', 'media_type', 'status']
    search_fields = ['poi__name']
    list_select_related = ['poi']
    list_per_page = 30
    readonly_fields = ['preview_link', 'original_text_display', 'audio_player', 'generate_ai_tts_button']
    actions = ['auto_translate', 'generate_ai_tts_action']

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
        ('🤖 Gemini AI TTS', {
            'description': 'Chọn giọng rồi bấm nút bên dưới để tạo file audio AI tức thì.',
            'fields': ('ai_voice', 'generate_ai_tts_button'),
        }),
        ('🔊 File TTS Audio (Cloudinary)', {
            'description': 'File âm thanh. App ưu tiên phát file này.',
            'fields': ('file_url', 'audio_player'),
        }),
    )

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'ai_voice':
            kwargs['widget'] = forms.Select(
                choices=[('', '— Mặc định (Aoede) —')] + list(GEMINI_VOICE_CHOICES)
            )
        return super().formfield_for_dbfield(db_field, request, **kwargs)

    def get_urls(self):
        """Thêm custom URL để xử lý tạo TTS AI cho một Media cụ thể."""
        urls = super().get_urls()
        custom = [
            path(
                '<int:media_id>/generate-ai-tts/',
                self.admin_site.admin_view(self.generate_ai_tts_view),
                name='pois_media_generate_ai_tts',
            ),
        ]
        return custom + urls

    def generate_ai_tts_view(self, request, media_id):
        """
        GET /admin/pois/media/<media_id>/generate-ai-tts/
        Tạo TTS AI cho media_id, lưu file_url, redirect về trang change.
        """
        from pois.gemini_tts import generate_tts_audio
        import cloudinary.uploader

        media = get_object_or_404(Media.objects.select_related('poi'), pk=media_id)
        text = media.tts_content or media.poi.description or ''

        if not text.strip():
            self.message_user(
                request,
                f'❌ [{media.poi.name}/{media.language}] Không có văn bản để tạo TTS. '
                'Vui lòng điền tts_content trước.',
                messages.ERROR,
            )
            return redirect(reverse('admin:pois_media_change', args=[media_id]))

        voice = media.ai_voice or 'Aoede'
        try:
            wav_bytes = generate_tts_audio(text=text, voice_name=voice)
            uploaded = cloudinary.uploader.upload(
                wav_bytes,
                resource_type='video',
                folder='bcsd/ai-tts',
                public_id=f'poi_{media.poi_id}_media_{media_id}_voice_{voice}',
                overwrite=True,
                format='wav',
            )
            media.file_url = uploaded.get('secure_url', '')
            media.media_type = 'AUDIO'
            media.save(update_fields=['file_url', 'media_type'])
            self.message_user(
                request,
                f'✅ [{media.poi.name}/{media.language}] Đã tạo TTS AI bằng giọng {voice} thành công!',
                messages.SUCCESS,
            )
        except ValueError as e:
            self.message_user(request, f'❌ {e}', messages.ERROR)
        except Exception as e:
            self.message_user(
                request,
                f'❌ [{media.poi.name}/{media.language}] Lỗi khi tạo TTS: {e}',
                messages.ERROR,
            )

        # Quay về trang change của media hoặc POI nếu đến từ POI inline
        referer = request.META.get('HTTP_REFERER', '')
        if referer and '/admin/pois/poi/' in referer:
            return redirect(referer)
        return redirect(reverse('admin:pois_media_change', args=[media_id]))

    def generate_ai_tts_button(self, obj):
        """Nút bấm tạo TTS AI trực tiếp từ trang change của Media."""
        if not obj.pk:
            return format_html(
                '<span style="color:#999;font-size:12px">'
                '💾 Lưu bản ghi trước để có thể tạo TTS AI.</span>'
            )
        url = reverse('admin:pois_media_generate_ai_tts', args=[obj.pk])
        voice = obj.ai_voice or 'Aoede'
        return format_html(
            '<a href="{}" '
            'style="display:inline-block;padding:8px 18px;background:#6f42c1;color:#fff;'
            'border-radius:6px;font-size:13px;font-weight:bold;text-decoration:none;" '
            'onclick="return confirm(\'⚠️ Tạo TTS AI bằng giọng {}?\\nFile âm thanh hiện tại sẽ bị thay thế.\')">'
            '🤖 Tạo TTS AI (giọng: {})</a>'
            '<span style="margin-left:8px;font-size:11px;color:#888">'
            '← Thay đổi giọng ở trường bên trên rồi lưu trước khi bấm</span>',
            url, voice, voice,
        )
    generate_ai_tts_button.short_description = '🤖 Tạo TTS bằng Gemini AI'

    def original_text_display(self, obj):
        if obj.poi_id:
            text = obj.poi.description or '(Chưa có mô tả)'
            return format_html(
                '<div style="white-space:pre-wrap;max-height:200px;overflow-y:auto;'
                'background:#f8f8f8;padding:8px;border-radius:4px">{}</div>',
                text,
            )
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

    def audio_status(self, obj):
        if obj.file_url:
            return format_html('<span style="color:#28a745">🔊 Có file</span>')
        return format_html('<span style="color:#999">⏳ Chưa có</span>')
    audio_status.short_description = 'TTS Audio'

    def preview_link(self, obj):
        if obj.file_url:
            return format_html('<a href="{}" target="_blank">▶ Nghe</a>', obj.file_url)
        return '—'
    preview_link.short_description = 'Nghe thử'

    def audio_player(self, obj):
        if obj.file_url:
            return format_html(
                '<audio controls style="width:100%%;max-width:500px"><source src="{}" type="audio/mpeg"></audio>'
                '<br><a href="{}" target="_blank" style="font-size:12px;color:#0066cc">🔗 {}</a>',
                obj.file_url, obj.file_url,
                obj.file_url[:80] + '...' if len(obj.file_url) > 80 else obj.file_url,
            )
        return format_html('<span style="color:#999">⏳ Chưa có file TTS</span>')
    audio_player.short_description = '🔊 Nghe TTS Audio'

    # ── Actions (hàng loạt) ────────────────────────────────────────────────────

    @admin.action(description='🌐 Tự động dịch nội dung POI sang ngôn ngữ của bản ghi')
    def auto_translate(self, request, queryset):
        try:
            from deep_translator import GoogleTranslator
        except ImportError:
            self.message_user(
                request,
                '❌ Thư viện deep-translator chưa được cài. Chạy: pip install deep-translator',
                messages.ERROR,
            )
            return

        success, skipped, errors = 0, 0, 0
        for media in queryset.select_related('poi'):
            if not media.poi.description:
                skipped += 1
                continue

            target_lang = media.language
            if target_lang == 'vi':
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

    @admin.action(description='🤖 Tạo TTS bằng Gemini AI (upload Cloudinary)')
    def generate_ai_tts_action(self, request, queryset):
        from pois.gemini_tts import generate_tts_audio
        import cloudinary.uploader

        success, skipped, errors = 0, 0, 0
        for media in queryset.select_related('poi'):
            text = media.tts_content or media.poi.description or ''
            if not text.strip():
                skipped += 1
                self.message_user(
                    request,
                    f'⏭️ [{media.poi.name}/{media.language}] Không có văn bản để tạo TTS.',
                    messages.WARNING,
                )
                continue

            voice = media.ai_voice or 'Aoede'
            try:
                wav_bytes = generate_tts_audio(text=text, voice_name=voice)
                uploaded = cloudinary.uploader.upload(
                    wav_bytes,
                    resource_type='video',
                    folder='bcsd/ai-tts',
                    public_id=f'poi_{media.poi_id}_lang_{media.language}_voice_{voice}',
                    overwrite=True,
                    format='wav',
                )
                media.file_url = uploaded.get('secure_url', '')
                media.media_type = 'AUDIO'
                media.save(update_fields=['file_url', 'media_type'])
                success += 1
                self.message_user(
                    request,
                    f'✅ [{media.poi.name}/{media.language}] Đã tạo TTS với giọng {voice}.',
                    messages.SUCCESS,
                )
            except ValueError as e:
                errors += 1
                self.message_user(request, f'❌ {e}', messages.ERROR)
                break
            except Exception as e:
                errors += 1
                self.message_user(
                    request,
                    f'❌ [{media.poi.name}/{media.language}] Lỗi: {e}',
                    messages.ERROR,
                )

        if success or skipped or errors:
            summary = f'🤖 AI TTS hoàn tất — ✅ {success} thành công'
            if skipped:
                summary += f' | ⏭️ {skipped} bỏ qua'
            if errors:
                summary += f' | ❌ {errors} lỗi'
            if success:
                self.message_user(request, summary, messages.SUCCESS)
