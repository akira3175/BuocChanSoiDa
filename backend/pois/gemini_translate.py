"""
Gemini AI Translate Module — BuocChanSoiDa
Dịch mô tả POI sang nhiều ngôn ngữ chỉ với 1 API request.

Model: gemini-3.1-flash-lite-preview
Trả về JSON có cấu trúc cho từng ngôn ngữ.
"""

import json
import logging
import time

logger = logging.getLogger(__name__)

# Model dịch
GEMINI_TRANSLATE_MODEL = "gemini-3.1-flash-lite-preview"

# Số lần retry
MAX_RETRIES = 3
RETRY_DELAY_SEC = 2.0

# Ánh xạ mã ngôn ngữ → tên đầy đủ cho prompt
LANGUAGE_NAMES = {
    'vi': 'Vietnamese',
    'en': 'English',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
    'th': 'Thai',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ar': 'Arabic',
}


def translate_poi(poi_name: str, description: str, languages: list[str]) -> dict:
    """
    Dịch tên và mô tả POI sang danh sách ngôn ngữ chỉ với 1 API request.

    Args:
        poi_name: Tên gốc của POI (tiếng Việt).
        description: Mô tả gốc của POI (tiếng Việt).
        languages: Danh sách mã ngôn ngữ cần dịch (ví dụ: ['en', 'ja', 'ko']).

    Returns:
        Dict dạng:
        {
            "en": { "translated_name": "...", "tts_content": "..." },
            "ja": { "translated_name": "...", "tts_content": "..." },
        }

    Raises:
        ValueError: Nếu API key chưa được cấu hình.
        RuntimeError: Nếu Gemini API trả về lỗi sau khi retry.
    """
    from pois.models import GeminiApiConfig  # import muộn tránh circular
    try:
        cfg = GeminiApiConfig.get_solo()
        api_key = cfg.api_key
    except Exception:
        api_key = ""

    if not api_key:
        raise ValueError(
            "Chưa cấu hình Gemini API Key. "
            "Vào Django Admin → Cấu hình Gemini AI → nhập API Key."
        )

    # Lọc bỏ ngôn ngữ nguồn (vi) và ngôn ngữ không hỗ trợ
    target_langs = [lang for lang in languages if lang != 'vi']
    if not target_langs:
        return {}

    # Tạo danh sách ngôn ngữ cần dịch cho prompt
    lang_list_str = ", ".join(
        f'"{lang}" ({LANGUAGE_NAMES.get(lang, lang)})' for lang in target_langs
    )

    # Xây dựng schema JSON mẫu
    schema_example = {lang: {"translated_name": "...", "tts_content": "..."} for lang in target_langs}

    prompt = f"""You are a professional translator for a Vietnamese tourism app. Your task is to TRANSLATE (not rewrite or invent) the provided Vietnamese text into the requested languages.

SOURCE TEXT TO TRANSLATE:
- POI Name: {poi_name}
- Description: {description}

Target languages: {lang_list_str}

STRICT RULES:
1. translated_name: Transliterate or translate the POI name faithfully. If it is a proper noun (restaurant/place name), keep it as-is or romanize it — do NOT invent a new meaning.
2. tts_content: DIRECTLY TRANSLATE the Vietnamese description text into each target language. Do NOT add, invent, or replace content that is not in the original. If the original is short, the translation must also be short.
3. FORBIDDEN: Do not generate generic tourism phrases like "Welcome to this serene location..." if the original does not say that.
4. If the description is a proper name or very short, translate only what is given. Do not pad with invented content.

Return ONLY a valid JSON object with this exact structure:
{json.dumps(schema_example, ensure_ascii=False, indent=2)}"""

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise RuntimeError(
            "Thư viện google-genai chưa được cài. Chạy: pip install google-genai"
        )

    client = genai.Client(api_key=api_key)

    last_error: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(
                f"[GeminiTranslate] Attempt {attempt}/{MAX_RETRIES}: "
                f"poi='{poi_name}', langs={target_langs}"
            )
            response = client.models.generate_content(
                model=GEMINI_TRANSLATE_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    thinking_config=types.ThinkingConfig(thinking_level="minimal"),
                    temperature=0.2,
                ),
            )

            raw_text = response.text or ""
            logger.info(f"[GeminiTranslate] Raw response length: {len(raw_text)}")

            # Parse JSON
            result = json.loads(raw_text)

            # Validate structure
            for lang in target_langs:
                if lang not in result:
                    logger.warning(f"[GeminiTranslate] Missing language '{lang}' in response")
                    result[lang] = {"translated_name": poi_name, "tts_content": description}
                else:
                    entry = result[lang]
                    if "translated_name" not in entry:
                        entry["translated_name"] = poi_name
                    if "tts_content" not in entry:
                        entry["tts_content"] = description

            logger.info(f"[GeminiTranslate] Success: translated {len(result)} languages")
            return result

        except json.JSONDecodeError as exc:
            last_error = exc
            logger.warning(f"[GeminiTranslate] JSON decode error on attempt {attempt}: {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SEC)
        except Exception as exc:
            last_error = exc
            logger.warning(f"[GeminiTranslate] Attempt {attempt} failed: {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SEC)

    raise RuntimeError(
        f"Gemini Translate thất bại sau {MAX_RETRIES} lần thử: {last_error}"
    ) from last_error
