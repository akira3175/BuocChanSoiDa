"""
pois/signals.py
Tự động khởi tạo, dịch tts_content, và sinh file TTS audio (upload lên Cloudinary)
cho các ngôn ngữ mặc định khi POI được tạo/cập nhật.
"""
import io
import logging
import tempfile

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)

DEFAULT_LANGS = ['en', 'ja', 'ko', 'zh']

# Mapping từ mã ngôn ngữ app → mã ngôn ngữ cho gTTS
GTTS_LANG_MAP = {
    'vi': 'vi',
    'en': 'en',
    'ja': 'ja',
    'ko': 'ko',
    'zh': 'zh-CN',
}


def _translate(text: str, target_lang: str) -> str:
    """
    Dịch text từ 'vi' sang target_lang bằng deep-translator.
    Yêu cầu: pip install deep-translator beautifulsoup4
    """
    if not text or not text.strip():
        return ''
    if target_lang == 'vi':
        return text

    # GoogleTranslator dùng 'zh-CN' (giản thể) hoặc 'zh-TW' (phồn thể), không dùng 'zh'
    engine_lang = 'zh-CN' if target_lang == 'zh' else target_lang

    try:
        from deep_translator import GoogleTranslator
        translated = GoogleTranslator(source='vi', target=engine_lang).translate(text)
        return translated if translated else ''
    except Exception as e:
        logger.warning(f'[AutoTranslate] Lỗi dịch sang {target_lang} (engine={engine_lang}): {e}')
        return ''


def _generate_tts_and_upload(text: str, lang: str, poi_name: str) -> str:
    """
    Sinh file TTS (.mp3) từ text bằng gTTS, upload lên Cloudinary.
    Trả về URL Cloudinary (secure_url) hoặc '' nếu lỗi.
    """
    if not text or not text.strip():
        return ''

    gtts_lang = GTTS_LANG_MAP.get(lang, lang)

    try:
        from gtts import gTTS
        import cloudinary.uploader
        from django.utils.text import slugify

        # Sinh audio vào buffer trong RAM (không cần file tạm trên disk)
        tts = gTTS(text=text, lang=gtts_lang, slow=False)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        # Upload lên Cloudinary
        # public_id format: bcsd/tts-audio/<poi_name_slugified>_<lang>
        safe_name = slugify(poi_name) or f"poi_{lang}"
        public_id = f'bcsd/tts-audio/{safe_name}_{lang}'

        result = cloudinary.uploader.upload(
            audio_buffer,
            resource_type='video',  # Cloudinary dùng 'video' cho audio files
            folder='',  # folder đã nằm trong public_id
            public_id=public_id,
            overwrite=True,
            format='mp3',
        )

        url = result.get('secure_url', '')
        if url:
            logger.info(f'[TTS] Uploaded {lang} audio for POI "{poi_name}" → {url}')
        return url

    except Exception as e:
        logger.warning(f'[TTS] Lỗi sinh TTS ({lang}) cho POI "{poi_name}": {e}')
        return ''


# ─── 1. Khi POI được lưu (Tạo mới hoặc Sửa) ──────────────────────────────────
@receiver(pre_save, sender='pois.POI')
def track_poi_changes(sender, instance, **kwargs):
    """Lưu lại description cũ để so sánh trong post_save."""
    if instance.pk:
        try:
            from pois.models import POI
            instance._old_description = POI.objects.only('description').get(pk=instance.pk).description
        except Exception:
            instance._old_description = None
    else:
        instance._old_description = None


@receiver(post_save, sender='pois.POI')
def handle_poi_translations(sender, instance, created, **kwargs):
    """
    Tự động hóa:
    1. Tạo Media record thiếu cho các ngôn ngữ mặc định.
    2. Dịch/Cập nhật tts_content cho tất cả Media TTS của POI này.
    3. Sinh file TTS audio (.mp3) và upload lên Cloudinary.
    """
    if not instance.description:
        return

    from pois.models import Media
    old_desc = getattr(instance, '_old_description', None)
    is_changed = (old_desc != instance.description) or created

    # Tạo Media TTS cho tiếng Việt gốc (nếu chưa có)
    vi_media, vi_created = Media.objects.get_or_create(
        poi=instance,
        language='vi',
        media_type=Media.MediaType.TTS,
        defaults={'status': Media.Status.ACTIVE, 'tts_content': instance.description}
    )
    if vi_created or is_changed or not vi_media.tts_content:
        vi_media.tts_content = instance.description
        vi_media.save(update_fields=['tts_content'])

    # Sinh TTS audio cho tiếng Việt nếu cần
    if vi_created or is_changed or not vi_media.file_url:
        url = _generate_tts_and_upload(instance.description, 'vi', instance.name)
        if url:
            vi_media.file_url = url
            vi_media.save(update_fields=['file_url'])

    # Xử lý các ngôn ngữ mặc định khác
    for lang in DEFAULT_LANGS:
        media, media_created = Media.objects.get_or_create(
            poi=instance,
            language=lang,
            media_type=Media.MediaType.TTS,
            defaults={'status': Media.Status.ACTIVE}
        )

        # Dịch tts_content nếu cần
        needs_translate = media_created or is_changed or not media.tts_content
        if needs_translate:
            translated = _translate(instance.description, lang)
            if translated:
                media.tts_content = translated
                media.save(update_fields=['tts_content'])
                logger.info(f'[AutoTranslate] Updated {lang} for POI: {instance.name}')

        # Sinh TTS audio nếu cần (mới tạo, description thay đổi, hoặc chưa có file)
        needs_tts = media_created or is_changed or not media.file_url
        if needs_tts and media.tts_content:
            url = _generate_tts_and_upload(media.tts_content, lang, instance.name)
            if url:
                media.file_url = url
                media.save(update_fields=['file_url'])


# ─── 2. Hỗ trợ trường hợp tạo Media thủ công trong Admin ─────────────────────
@receiver(post_save, sender='pois.Media')
def translate_manual_media(sender, instance, created, **kwargs):
    """Nếu Admin tạo tay 1 bản Media TTS mà để trống nội dung -> tự dịch + sinh TTS."""
    if (
        instance.media_type == 'TTS'
        and not instance.tts_content
        and instance.language != 'vi'
        and instance.poi.description
    ):
        translated = _translate(instance.poi.description, instance.language)
        if translated:
            from pois.models import Media
            Media.objects.filter(pk=instance.pk).update(tts_content=translated)
            logger.info(f'[AutoTranslate] Manual Media #{instance.pk} ({instance.language}) translated.')

            # Sinh TTS audio cho bản dịch vừa tạo
            if not instance.file_url:
                url = _generate_tts_and_upload(translated, instance.language, instance.poi.name)
                if url:
                    Media.objects.filter(pk=instance.pk).update(file_url=url)
                    logger.info(f'[TTS] Manual Media #{instance.pk} ({instance.language}) TTS uploaded.')
