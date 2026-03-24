"""
pois/signals.py
Tự động khởi tạo và dịch tts_content cho các ngôn ngữ mặc định (en, ja, ko).
"""
import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)

DEFAULT_LANGS = ['en', 'ja', 'ko', 'zh']


def _translate(text: str, target_lang: str) -> str:
    """Dịch text từ 'vi' sang target_lang bằng deep-translator."""
    if not text or not text.strip():
        return ''
    if target_lang == 'vi':
        return text
    try:
        from deep_translator import GoogleTranslator
        # GoogleTranslator trả về None hoặc '' nếu lỗi kết nối
        translated = GoogleTranslator(source='vi', target=target_lang).translate(text)
        return translated if translated else ''
    except Exception as e:
        logger.warning(f'[AutoTranslate] Lỗi dịch sang {target_lang}: {e}')
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
    1. Tạo Media record thiếu cho [en, ja, ko].
    2. Dịch/Cập nhật tts_content cho tất cả Media TTS của POI này.
    """
    if not instance.description:
        return

    from pois.models import Media
    old_desc = getattr(instance, '_old_description', None)
    is_changed = (old_desc != instance.description) or created

    # 1. Đảm bảo các ngôn ngữ mặc định luôn tồn tại
    for lang in DEFAULT_LANGS:
        media, media_created = Media.objects.get_or_create(
            poi=instance,
            language=lang,
            media_type=Media.MediaType.TTS,
            defaults={'status': Media.Status.ACTIVE}
        )
        
        # Nếu vừa tạo mới HOẶC description thay đổi HOẶC tts_content đang trống
        if media_created or is_changed or not media.tts_content:
            translated = _translate(instance.description, lang)
            if translated:
                # Dùng update_fields để tránh trigger signal Media (nếu có)
                media.tts_content = translated
                media.save(update_fields=['tts_content'])
                logger.info(f'[AutoTranslate] Updated {lang} for POI: {instance.name}')


# ─── 2. Hỗ trợ trường hợp tạo Media thủ công trong Admin ─────────────────────
@receiver(post_save, sender='pois.Media')
def translate_manual_media(sender, instance, created, **kwargs):
    """Nếu Admin tạo tay 1 bản Media TTS mà để trống nội dung -> tự dịch."""
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
