"""
Gemini TTS AI Module — BuocChanSoiDa
Tạo file audio từ văn bản bằng Gemini 2.5 Flash TTS Preview.

Tài liệu: https://ai.google.dev/gemini-api/docs/speech-generation
Model: gemini-2.5-flash-preview-tts
Format output: WAV (PCM 24kHz, 16-bit, mono)
"""

import io
import wave
import logging
import time

logger = logging.getLogger(__name__)

# ─── Danh sách 30 giọng nói từ Gemini TTS Docs ──────────────────────────────
# Nguồn: https://ai.google.dev/gemini-api/docs/speech-generation
GEMINI_VOICES: list[dict] = [
    {"name": "Zephyr",       "style": "Bright"},
    {"name": "Puck",         "style": "Upbeat"},
    {"name": "Charon",       "style": "Informative"},
    {"name": "Kore",         "style": "Firm"},
    {"name": "Fenrir",       "style": "Excitable"},
    {"name": "Leda",         "style": "Youthful"},
    {"name": "Orus",         "style": "Firm"},
    {"name": "Aoede",        "style": "Breezy"},
    {"name": "Callirrhoe",   "style": "Easy-going"},
    {"name": "Autonoe",      "style": "Bright"},
    {"name": "Enceladus",    "style": "Breathy"},
    {"name": "Iapetus",      "style": "Clear"},
    {"name": "Umbriel",      "style": "Easy-going"},
    {"name": "Algieba",      "style": "Smooth"},
    {"name": "Despina",      "style": "Smooth"},
    {"name": "Erinome",      "style": "Clear"},
    {"name": "Algenib",      "style": "Gravelly"},
    {"name": "Rasalgethi",   "style": "Informative"},
    {"name": "Laomedeia",    "style": "Upbeat"},
    {"name": "Achernar",     "style": "Soft"},
    {"name": "Alnilam",      "style": "Firm"},
    {"name": "Schedar",      "style": "Even"},
    {"name": "Gacrux",       "style": "Mature"},
    {"name": "Pulcherrima",  "style": "Forward"},
    {"name": "Achird",       "style": "Friendly"},
    {"name": "Zubenelgenubi", "style": "Casual"},
    {"name": "Vindemiatrix", "style": "Gentle"},
    {"name": "Sadachbia",    "style": "Lively"},
    {"name": "Sadaltager",   "style": "Knowledgeable"},
    {"name": "Sulafat",      "style": "Warm"},
]

# Choices để dùng trong Django model / Django form
GEMINI_VOICE_CHOICES = [(v["name"], f"{v['name']} — {v['style']}") for v in GEMINI_VOICES]

# Tên model TTS
GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"

# Số lần retry khi Gemini trả về lỗi ngẫu nhiên
MAX_RETRIES = 3
RETRY_DELAY_SEC = 2.0


def _build_wav_bytes(pcm_data: bytes, channels: int = 1, rate: int = 24000, sample_width: int = 2) -> bytes:
    """Đóng gói PCM data thô thành file WAV bytes."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm_data)
    return buf.getvalue()


def generate_tts_audio(text: str, voice_name: str = "Aoede", style_prompt: str = "") -> bytes:
    """
    Gọi Gemini TTS API và trả về WAV bytes.

    Args:
        text: Văn bản cần chuyển thành giọng nói.
        voice_name: Tên giọng nói từ GEMINI_VOICES (mặc định 'Aoede').
        style_prompt: Câu hướng dẫn phong cách (ví dụ: '[cheerfully]', 'Speak clearly and slowly').
                      Để trống để dùng style tự nhiên của giọng được chọn.

    Returns:
        WAV bytes sẵn sàng upload.

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

    # Validate voice name
    valid_voice_names = [v["name"] for v in GEMINI_VOICES]
    if voice_name not in valid_voice_names:
        logger.warning(f"[GeminiTTS] Unknown voice '{voice_name}', falling back to 'Aoede'.")
        voice_name = "Aoede"

    # Ghép style prompt nếu có
    full_text = text
    if style_prompt:
        full_text = f"{style_prompt.strip()}\n\n{text}"

    # Import google-genai SDK
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
            logger.info(f"[GeminiTTS] Attempt {attempt}/{MAX_RETRIES}: voice={voice_name}, len={len(full_text)}")
            response = client.models.generate_content(
                model=GEMINI_TTS_MODEL,
                contents=full_text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice_name,
                            )
                        )
                    ),
                ),
            )
            candidates = response.candidates
            if not candidates:
                raise RuntimeError("Gemini TTS trả về kết quả rỗng.")

            part = candidates[0].content.parts[0]
            if not hasattr(part, "inline_data") or part.inline_data is None:
                raise RuntimeError(
                    "Gemini TTS không trả về audio data. "
                    "Có thể model đang trả về text tokens — thử lại."
                )

            pcm_data: bytes = part.inline_data.data
            logger.info(f"[GeminiTTS] Success: {len(pcm_data)} bytes PCM")
            return _build_wav_bytes(pcm_data)

        except Exception as exc:
            last_error = exc
            logger.warning(f"[GeminiTTS] Attempt {attempt} failed: {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SEC)

    raise RuntimeError(f"Gemini TTS thất bại sau {MAX_RETRIES} lần thử: {last_error}") from last_error
