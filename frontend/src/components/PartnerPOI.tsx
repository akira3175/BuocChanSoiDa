import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import AiTtsCheckout from './AiTtsCheckout';
import AiTranslateCheckout from './AiTranslateCheckout';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import apiClient, { getApiErrorMessage, getPartnerMapQrUrl, uploadPOICoverImage, updatePOIMedia } from '../services/api';
import type { Media, POI, POICategory } from '../types';

const LANGUAGE_LABELS: Record<string, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  th: 'ภาษาไทย',
};

const VOICE_REGION_LABELS: Record<string, string> = {
  mien_nam: 'Miền Nam',
  mien_bac: 'Miền Bắc',
  mien_trung: 'Miền Trung',
  usa: 'USA',
  uk: 'UK',
};

// 30 giọng Gemini TTS (theo tài liệu chính thức)
const GEMINI_VOICES = [
  { name: 'Zephyr',        style: 'Bright' },
  { name: 'Puck',          style: 'Upbeat' },
  { name: 'Charon',        style: 'Informative' },
  { name: 'Kore',          style: 'Firm' },
  { name: 'Fenrir',        style: 'Excitable' },
  { name: 'Leda',          style: 'Youthful' },
  { name: 'Orus',          style: 'Firm' },
  { name: 'Aoede',         style: 'Breezy' },
  { name: 'Callirrhoe',    style: 'Easy-going' },
  { name: 'Autonoe',       style: 'Bright' },
  { name: 'Enceladus',     style: 'Breathy' },
  { name: 'Iapetus',       style: 'Clear' },
  { name: 'Umbriel',       style: 'Easy-going' },
  { name: 'Algieba',       style: 'Smooth' },
  { name: 'Despina',       style: 'Smooth' },
  { name: 'Erinome',       style: 'Clear' },
  { name: 'Algenib',       style: 'Gravelly' },
  { name: 'Rasalgethi',    style: 'Informative' },
  { name: 'Laomedeia',     style: 'Upbeat' },
  { name: 'Achernar',      style: 'Soft' },
  { name: 'Alnilam',       style: 'Firm' },
  { name: 'Schedar',       style: 'Even' },
  { name: 'Gacrux',        style: 'Mature' },
  { name: 'Pulcherrima',   style: 'Forward' },
  { name: 'Achird',        style: 'Friendly' },
  { name: 'Zubenelgenubi', style: 'Casual' },
  { name: 'Vindemiatrix',  style: 'Gentle' },
  { name: 'Sadachbia',     style: 'Lively' },
  { name: 'Sadaltager',    style: 'Knowledgeable' },
  { name: 'Sulafat',       style: 'Warm' },
] as const;


function languageSelectLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code.toUpperCase();
}

function voiceRegionLabel(region: string): string {
  if (!region) return 'Mặc định';
  return VOICE_REGION_LABELS[region] ?? region.replace(/_/g, ' ');
}

function getPublicBaseUrl(): string {
  const envBase = (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.trim();
  return (envBase && envBase.length > 0 ? envBase : window.location.origin).replace(/\/+$/, '');
}

function formatVnExpiry(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
}

function languageToBCP47(code: string): string {
  const map: Record<string, string> = {
    vi: 'vi-VN',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
    fr: 'fr-FR',
    de: 'de-DE',
    es: 'es-ES',
    th: 'th-TH',
  };
  return map[code] ?? `${code}-${code.toUpperCase()}`;
}

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapSelector({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition: (next: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} />;
}

export default function PartnerPOI() {
  const [poi, setPoi] = useState<POI | null>(null);
  const [loading, setLoading] = useState(true);
  /** Thông báo nhẹ (vd. chưa có POI — không phải lỗi). */
  const [notice, setNotice] = useState('');
  /** Lỗi tải / lưu — hiển thị nổi bật. */
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  /** Chặn double-submit trước khi React kịp re-render (setSaving bất đồng bộ). */
  const saveInFlightRef = useRef(false);
  const [addressText, setAddressText] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'food' as POICategory,
    latitude: 10.7552,
    longitude: 106.7038,
    geofence_radius: 80,
  });
  const { isPlaying, speakTTS, pause, load, play } = useAudioPlayer();
  /** Ngôn ngữ đang xem trong danh sách media POI (combo, không hiện tất cả cùng lúc). */
  const [poiMediaLang, setPoiMediaLang] = useState<string>('');
  const [playingMediaId, setPlayingMediaId] = useState<string | null>(null);
  const [uploadCoverLoading, setUploadCoverLoading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [coverUploadError, setCoverUploadError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [mapQrFullUrl, setMapQrFullUrl] = useState('');
  const [mapQrExpiresAt, setMapQrExpiresAt] = useState<string | null>(null);
  const [mapQrLoading, setMapQrLoading] = useState(false);
  const [mapQrError, setMapQrError] = useState('');
  // AI TTS state per-media: map mediaId → { voice, loading, error, ttsContent, saving }
  const [aiTtsState, setAiTtsState] = useState<Record<string, { voice: string; loading: boolean; error: string; ttsContent?: string; saving?: boolean }>>({});
  // AI TTS purchase status
  const [aiTtsQuota, setAiTtsQuota] = useState(0);
  const [aiTtsPrice, setAiTtsPrice] = useState(25000);
  const [aiTtsQuotaPerPurchase, setAiTtsQuotaPerPurchase] = useState(5);

  const [showTtsCheckout, setShowTtsCheckout] = useState(false);

  // AI Translate states
  const [aiTranslateQuota, setAiTranslateQuota] = useState(0);
  const [aiTranslatePrice, setAiTranslatePrice] = useState(50000);
  const [aiTranslateQuotaPerPurchase, setAiTranslateQuotaPerPurchase] = useState(10);
  const [aiTranslating, setAiTranslating] = useState(false);
  const [aiTranslateError, setAiTranslateError] = useState('');
  const [showTranslateCheckout, setShowTranslateCheckout] = useState(false);

  const fetchTtsQuota = async () => {
    try {
      const { data } = await apiClient.get<{ quota: number; price: number; quota_per_purchase: number }>('/payments/ai-tts/check/');
      setAiTtsQuota(data.quota);
      setAiTtsPrice(data.price || 25000);
      setAiTtsQuotaPerPurchase(data.quota_per_purchase || 5);
    } catch {
      // Silently fail — default to 0
    }
  };

  const fetchTranslateQuota = async () => {
    try {
      const { data } = await apiClient.get<{ quota: number; price: number; quota_per_purchase: number }>('/payments/ai-translate/check/');
      setAiTranslateQuota(data.quota);
      setAiTranslatePrice(data.price || 50000);
      setAiTranslateQuotaPerPurchase(data.quota_per_purchase || 10);
    } catch {
      // Silently fail
    }
  };

  // Check AI TTS purchase status
  useEffect(() => {
    void fetchTtsQuota();
    void fetchTranslateQuota();
  }, []);

  useEffect(() => {
    const fetchMyPoi = async () => {
      setLoading(true);
      setError('');
      setNotice('');
      try {
        const { data } = await apiClient.get<POI>('/pois/my-poi/');
        setPoi(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          category: (data.category as POICategory) || 'food',
          latitude: data.latitude,
          longitude: data.longitude,
          geofence_radius: data.geofence_radius || 50,
        });
        setCoverImageUrl(data.cover_image_url || '');
      } catch (err) {
        setPoi(null);
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status === 404) {
          setNotice('Bạn chưa có POI. Điền thông tin bên dưới và bấm lưu để tạo POI.');
          setError('');
        } else {
          setNotice('');
          setError(getApiErrorMessage(err, 'Không thể tải POI. Vui lòng thử lại.'));
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchMyPoi();
  }, []);

  const poiMediaList = useMemo(() => (Array.isArray(poi?.media) ? poi.media : []), [poi?.media]);
  const poiMediaLanguages = useMemo(
    () => [...new Set(poiMediaList.map((m) => m.language))].sort((a, b) => a.localeCompare(b)),
    [poiMediaList],
  );

  useEffect(() => {
    if (poiMediaLanguages.length === 0) {
      setPoiMediaLang('');
      return;
    }
    setPoiMediaLang((prev) =>
      poiMediaLanguages.some((c) => c === prev) ? prev : poiMediaLanguages[0],
    );
  }, [poi?.id, poiMediaLanguages]);

  useEffect(() => {
    if (!poi?.id) {
      setMapQrFullUrl('');
      setMapQrExpiresAt(null);
      setMapQrError('');
      return;
    }
    let cancelled = false;
    const loadQr = async () => {
      setMapQrLoading(true);
      setMapQrError('');
      try {
        const data = await getPartnerMapQrUrl();
        if (cancelled) return;
        const base = getPublicBaseUrl();
        setMapQrFullUrl(`${base}${data.map_path}`);
        setMapQrExpiresAt(data.expires_at);
      } catch (err) {
        if (!cancelled) {
          setMapQrError(getApiErrorMessage(err, 'Không tạo được mã QR. Vui lòng thử lại.'));
          setMapQrFullUrl('');
          setMapQrExpiresAt(null);
        }
      } finally {
        if (!cancelled) setMapQrLoading(false);
      }
    };
    void loadQr();
    return () => {
      cancelled = true;
    };
  }, [poi?.id]);

  const refreshMapQr = () => {
    if (!poi?.id) return;
    setMapQrLoading(true);
    setMapQrError('');
    void (async () => {
      try {
        const data = await getPartnerMapQrUrl();
        const base = getPublicBaseUrl();
        setMapQrFullUrl(`${base}${data.map_path}`);
        setMapQrExpiresAt(data.expires_at);
      } catch (err) {
        setMapQrError(getApiErrorMessage(err, 'Không tạo được mã QR. Vui lòng thử lại.'));
      } finally {
        setMapQrLoading(false);
      }
    })();
  };

  useEffect(() => {
    const lat = formData.latitude;
    const lng = formData.longitude;
    if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) return;

    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      setAddressLoading(true);
      setAddressError('');
      setAddressText('');
      try {
        const url =
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
          `&lat=${lat}&lon=${lng}` +
          `&zoom=16&addressdetails=1&accept-language=vi`;
        if (import.meta.env.DEV) {
          console.debug('[PartnerPOI] reverse geocode request', { lat, lng, url });
        }
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          display_name?: string;
          address?: {
            road?: string;
            city_district?: string;
            county?: string;
            suburb?: string;
            neighbourhood?: string;
            city?: string;
            town?: string;
            village?: string;
            province?: string;
            state?: string;
          };
        };
        const a = json.address ?? {};
        const road = a.road;
        const district = a.city_district || a.county || a.suburb || a.neighbourhood;
        const city = a.city || a.town || a.village || a.province || a.state;
        const short = [road, district, city].filter(Boolean).join(', ');
        if (import.meta.env.DEV) {
          console.debug('[PartnerPOI] reverse geocode response', { short, displayName: json.display_name });
        }
        setAddressText(short || (json.display_name ? json.display_name.slice(0, 90) : ''));
      } catch {
        if (!controller.signal.aborted) {
          if (import.meta.env.DEV) {
            console.debug('[PartnerPOI] reverse geocode failed');
          }
          setAddressError('Không lấy được địa chỉ (thử lại).');
        }
      } finally {
        if (!controller.signal.aborted) {
          setAddressLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [formData.latitude, formData.longitude]);

  if (loading) {
    return <section className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 shadow-sm">Đang tải POI...</section>;
  }

  const handleTestPoiDescription = () => {
    if (isPlaying) {
      pause();
      setPlayingMediaId(null);
    } else if (formData.description.trim()) {
      setPlayingMediaId(null);
      speakTTS(formData.description.trim(), 'vi-VN');
    }
  };

  const filteredPoiMedia = poiMediaLang
    ? poiMediaList.filter((m) => m.language === poiMediaLang)
    : [];

  const playPoiMediaRow = async (m: Media) => {
    if (playingMediaId === String(m.id) && isPlaying) {
      pause();
      setPlayingMediaId(null);
      return;
    }
    pause();
    setPlayingMediaId(String(m.id));
    if (m.media_type === 'AUDIO' && m.file_url?.trim()) {
      await load(m.file_url);
      await play();
    } else {
      const text = (m.tts_content || formData.description || '').trim();
      if (!text) {
        setPlayingMediaId(null);
        return;
      }
      speakTTS(text, languageToBCP47(m.language));
    }
  };

  const handleSaveTtsContent = async (m: Media) => {
    if (!poi?.id) return;
    const cur = aiTtsState[m.id];
    const text = cur?.ttsContent;
    if (text === undefined || text === m.tts_content) return;

    setAiTtsState(s => ({ ...s, [m.id]: { ...getAiTts(m.id), saving: true } }));
    try {
      const updated = await updatePOIMedia(poi.id, m.id, { tts_content: text });
      setPoi(prev => prev ? {
        ...prev,
        media: (prev.media ?? []).map(x => x.id === m.id ? { ...x, tts_content: updated.tts_content } : x)
      } : prev);
      setAiTtsState(s => ({ ...s, [m.id]: { ...getAiTts(m.id), saving: false } }));
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Lưu bản dịch thất bại.');
      setAiTtsState(s => ({ ...s, [m.id]: { ...getAiTts(m.id), saving: false, error: msg } }));
    }
  };

  const handleSave = async () => {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaving(true);
    setError('');
    try {
      if (poi) {
        const { data } = await apiClient.put<POI>('/pois/my-poi/', formData);
        setPoi(data);
        setCoverImageUrl(data.cover_image_url || '');
      } else {
        const { data } = await apiClient.post<POI>('/pois/my-poi/', formData);
        setPoi(data);
        setCoverImageUrl(data.cover_image_url || '');
      }
      setNotice('');
      alert('Đã lưu POI thành công.');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Không thể lưu POI. Vui lòng thử lại.');
      setError(msg);
      if (import.meta.env.DEV) {
        console.warn('[PartnerPOI] save failed', axios.isAxiosError(err) ? err.response?.status : err, err);
      }
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input value to allow re-selecting same file
    if (coverInputRef.current) coverInputRef.current.value = '';
    setCoverUploadError('');
    setUploadCoverLoading(true);
    try {
      const result = await uploadPOICoverImage(file);
      setCoverImageUrl(result.cover_image_url);
      if (poi) {
        setPoi({ ...poi, cover_image_url: result.cover_image_url });
      }
    } catch (err) {
      setCoverUploadError(getApiErrorMessage(err, 'Upload ảnh thất bại. Vui lòng thử lại.'));
    } finally {
      setUploadCoverLoading(false);
    }
  };;

  const getAiTts = (mediaId: string) =>
    aiTtsState[mediaId] ?? { voice: 'Aoede', loading: false, error: '', ttsContent: undefined, saving: false };

  const generateAiTts = async (m: Media) => {
    if (!poi?.id) return;
    // Kiểm tra quota
    if (aiTtsQuota <= 0) {
      const priceStr = aiTtsPrice.toLocaleString('vi-VN');
      setError(`Bạn đã hết lượt tạo AI TTS. Hãy nạp thêm ${aiTtsQuotaPerPurchase} lượt với phí ${priceStr}₫ bằng nút bên dưới.`);
      return;
    }
    const cur = getAiTts(m.id);
    if (cur.loading) return;
    const chosenVoice = cur.voice || 'Aoede';
    const text = cur.ttsContent !== undefined ? cur.ttsContent : (m.tts_content || formData.description || '');

    setAiTtsState((s) => ({ ...s, [m.id]: { ...cur, loading: true, error: '' } }));
    try {
      const { data } = await apiClient.post<{ file_url: string; voice: string; media: Media }>(
        `/pois/${poi.id}/media/${m.id}/generate-tts/`,
        { voice: chosenVoice, tts_content: text },
      );
      // Cập nhật POI media list inline
      setPoi((prev) =>
        prev
          ? {
              ...prev,
              media: (prev.media ?? []).map((x) =>
                x.id === m.id ? { ...x, file_url: data.file_url, media_type: 'AUDIO' } : x,
              ),
            }
          : prev,
      );
      setAiTtsState((s) => ({ ...s, [m.id]: { voice: chosenVoice, loading: false, error: '' } }));
      // Trừ 1 lượt trên frontend sau khi thành công
      setAiTtsQuota((q) => Math.max(0, q - 1));
      alert(`✅ Đã tạo TTS bằng giọng ${chosenVoice} thành công! (Còn ${aiTtsQuota - 1} lượt)`);
    } catch (err) {
      // Xử lý trường hợp chưa thanh toán/hết lượt (HTTP 402)
      if (axios.isAxiosError(err) && err.response?.status === 402) {
        setAiTtsQuota(0);
        const respPrice = err.response?.data?.price;
        if (respPrice) setAiTtsPrice(Number(respPrice));
      }
      const msg = getApiErrorMessage(err, 'Tạo TTS AI thất bại.');
      setAiTtsState((s) => ({ ...s, [m.id]: { voice: chosenVoice, loading: false, error: msg } }));
    }
  };

  const buyAiTts = () => {
    setShowTtsCheckout(true);
  };

  const errorPopup =
    typeof document !== 'undefined' &&
    error &&
    createPortal(
      <div
        className="fixed inset-0 z-[260] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-poi-error-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
          aria-label="Đóng thông báo"
          onClick={() => setError('')}
        />
        <div className="relative z-10 w-full max-w-[480px] animate-fade-slide-up rounded-2xl border border-rose-200 bg-white p-4 shadow-2xl">
          <div className="flex gap-3">
            <span className="material-symbols-outlined shrink-0 text-[28px] text-rose-600">error</span>
            <div className="min-w-0 flex-1">
              <h4 id="partner-poi-error-title" className="text-sm font-bold text-slate-900">
                Thông báo lỗi
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{error}</p>
              <button
                type="button"
                onClick={() => setError('')}
                className="mt-4 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <section className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {errorPopup}
      <h3 className="text-base font-bold text-slate-900">{poi ? 'POI của Partner' : 'Tạo POI cho Partner'}</h3>
      {notice && (
        <div
          role="status"
          className="mt-3 flex gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-900"
        >
          <span className="material-symbols-outlined shrink-0 text-[20px] text-sky-600">info</span>
          <p className="leading-snug">{notice}</p>
        </div>
      )}
      <div className="mt-3 grid gap-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-500">location_on</span>
            <h4 className="text-sm font-bold text-slate-900">Thông tin POI</h4>
          </div>

          <div className="grid gap-3">
            <div>
          <label className="text-xs font-semibold text-slate-600">Tên POI</label>
          <input
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
          />
        </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
            />
            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={handleTestPoiDescription}
                className="flex items-center justify-center gap-1 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">{isPlaying ? 'stop_circle' : 'play_circle'}</span>
                {isPlaying ? 'Dừng nghe' : 'Nghe thử intro'}
              </button>
            </div>
          </div>
          
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Danh mục</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as POICategory }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
                >
                  <option value="food">Ẩm thực</option>
                  <option value="historical">Lịch sử</option>
                  <option value="cultural">Văn hóa</option>
                  <option value="scenic">Phong cảnh</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Geofence (m)</label>
                <input
                  type="number"
                  value={formData.geofence_radius}
                  onChange={(e) => setFormData((prev) => ({ ...prev, geofence_radius: parseInt(e.target.value, 10) || 50 }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Vị trí trên bản đồ (click để chọn)</label>
            <div className="h-52 w-full overflow-hidden rounded-xl border border-slate-200">
              <MapContainer center={[formData.latitude, formData.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapSelector
                  position={[formData.latitude, formData.longitude]}
                  setPosition={(p) => setFormData((prev) => ({ ...prev, latitude: p[0], longitude: p[1] }))}
                />
              </MapContainer>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Toạ độ: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </p>
            <label className="mt-2 block text-xs font-semibold text-slate-600">Địa chỉ</label>
            <textarea
              value={
                addressLoading
                  ? 'Đang lấy địa chỉ...'
                  : addressText || addressError || 'Click lên bản đồ để lấy địa chỉ.'
              }
              readOnly
              rows={3}
              className={`mt-1 w-full resize-none rounded-xl border bg-slate-50/60 px-3 py-2 text-sm outline-none ${
                addressError
                  ? 'border-rose-200 text-rose-600'
                  : 'border-slate-200 text-slate-700'
              }`}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!formData.name || saving}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:opacity-50"
          >
          {saving ? 'Đang lưu...' : poi ? 'Cập nhật POI' : 'Tạo POI'}
          </button>
        </div>

        {poi && poiMediaList.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-3">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-slate-500">translate</span>
                <h4 className="text-sm font-bold text-slate-900">Thuyết minh đa ngôn ngữ</h4>
              </div>
              <div className="min-w-[160px] flex-1 sm:flex-initial">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Ngôn ngữ</label>
                <select
                  value={poiMediaLang}
                  onChange={(e) => setPoiMediaLang(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary"
                >
                  {poiMediaLanguages.map((code) => (
                    <option key={code} value={code}>
                      {languageSelectLabel(code)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* 🌐 AI Dịch tất cả ngôn ngữ */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700">🌐 AI Dịch</span>
                <span className="text-[10px] text-slate-500">
                  Còn: <strong className={aiTranslateQuota > 0 ? 'text-emerald-700' : 'text-rose-600'}>{aiTranslateQuota}</strong> lượt
                </span>
              </div>
              {aiTranslateError && <p className="w-full text-[10px] font-medium text-red-600">{aiTranslateError}</p>}
              {aiTranslateQuota <= 0 ? (
                <button
                  type="button"
                  onClick={() => setShowTranslateCheckout(true)}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                  <span className="material-symbols-outlined text-[14px]">add_circle</span>
                  Nạp {aiTranslateQuotaPerPurchase} lượt ({aiTranslatePrice.toLocaleString('vi-VN')}₫)
                </button>
              ) : (
                <button
                  type="button"
                  disabled={aiTranslating}
                  onClick={async () => {
                    if (!poi?.id) return;
                    setAiTranslating(true);
                    setAiTranslateError('');
                    try {
                      const { data } = await apiClient.post<{ success: boolean; remaining_quota: number }>(`/pois/${poi.id}/translate-all/`);
                      setAiTranslateQuota(data.remaining_quota);
                      // Reload lại POI media
                      const { data: updated } = await apiClient.get<POI>('/pois/my-poi/');
                      setPoi(updated);
                    } catch (e) {
                      if (axios.isAxiosError(e) && e.response?.status === 402) {
                        setShowTranslateCheckout(true);
                      } else {
                        setAiTranslateError(getApiErrorMessage(e, 'Dịch thất bại. Vui lòng thử lại.'));
                      }
                    } finally {
                      setAiTranslating(false);
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aiTranslating ? (
                    <><span className="animate-spin material-symbols-outlined text-[14px]">autorenew</span> Đang dịch...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[14px]">translate</span> Dịch tất cả</>
                  )}
                </button>
              )}
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Chọn ngôn ngữ để xem từng bản TTS / file âm thanh. Mỗi dòng có thể là giọng miền khác nhau.
            </p>
            <ul className="grid gap-2">
              {filteredPoiMedia.map((m) => {
                const isRowPlaying = playingMediaId === String(m.id) && isPlaying;
                const canPlayAudio = m.media_type === 'AUDIO' && Boolean(m.file_url?.trim());
                const canPlayTts =
                  m.media_type === 'TTS' && Boolean((m.tts_content || formData.description || '').trim());
                const canPlay = canPlayAudio || canPlayTts;
                return (
                  <li
                    key={m.id}
                    className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-800">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                            {m.media_type_display ?? (m.media_type === 'TTS' ? 'TTS' : 'Âm thanh')}
                          </span>
                          <span className="text-slate-500">{voiceRegionLabel(m.voice_region)}</span>
                        </div>
                        
                        <div className="mt-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Đoạn giới thiệu đã dịch</label>
                          <textarea
                            value={getAiTts(m.id).ttsContent ?? m.tts_content ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAiTtsState(s => ({ ...s, [m.id]: { ...getAiTts(m.id), ttsContent: val } }));
                            }}
                            placeholder="Nhập đoạn giới thiệu đã dịch ở đây..."
                            rows={3}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary transition"
                          />
                          <div className="mt-1 flex justify-between items-center">
                             {m.media_type === 'AUDIO' && m.file_url && (
                               <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                                 <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                 Đã có file âm thanh
                               </span>
                             )}
                             {(getAiTts(m.id).ttsContent !== undefined && getAiTts(m.id).ttsContent !== m.tts_content) && (
                               <button 
                                 onClick={() => void handleSaveTtsContent(m)}
                                 disabled={getAiTts(m.id).saving}
                                 className="ml-auto text-[10px] font-bold text-primary hover:underline disabled:opacity-50"
                               >
                                 {getAiTts(m.id).saving ? 'Đang lưu...' : 'Lưu bản dịch'}
                               </button>
                             )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canPlay}
                        onClick={() => void playPoiMediaRow(m)}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isRowPlaying ? 'stop_circle' : 'play_circle'}
                        </span>
                        {isRowPlaying ? 'Dừng' : 'Nghe'}
                      </button>
                    </div>
                    {/* 🤖 AI TTS — chọn giọng + tạo */}
                    {(() => {
                      const ai = getAiTts(m.id);
                      return (
                        <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-violet-700">🤖 Gemini TTS</span>
                            <span className="text-[10px] font-medium text-slate-500">
                              Lượt dùng: <strong className={aiTtsQuota > 0 ? "text-violet-700" : "text-rose-600"}>{aiTtsQuota}</strong>
                            </span>
                          </div>

                          {ai.error && <p className="text-[10px] font-medium text-red-600">{ai.error}</p>}

                          {aiTtsQuota <= 0 ? (
                            <div className="flex flex-col items-start gap-1 rounded-lg border border-violet-200 bg-violet-50/50 p-2">
                              <span className="text-xs text-slate-600">
                                Mua gói {aiTtsQuotaPerPurchase} lượt với phí {aiTtsPrice.toLocaleString('vi-VN')}₫ để sử dụng AI TTS.
                              </span>
                              <button
                                type="button"
                                onClick={() => void buyAiTts()}
                                className="mt-1 flex shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700"
                              >
                                <span className="text-[14px] material-symbols-outlined">add_circle</span>
                                Nạp {aiTtsQuotaPerPurchase} lượt
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                id={`ai-voice-${m.id}`}
                                value={ai.voice}
                                onChange={(e) =>
                                  setAiTtsState((s) => ({ ...s, [m.id]: { ...getAiTts(m.id), voice: e.target.value } }))
                                }
                                disabled={ai.loading}
                                className="flex-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-violet-400 disabled:opacity-50"
                              >
                                {GEMINI_VOICES.map((v) => (
                                  <option key={v.name} value={v.name}>
                                    {v.name} — {v.style}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                id={`btn-ai-tts-${m.id}`}
                                disabled={ai.loading}
                                onClick={() => void generateAiTts(m)}
                                className="flex shrink-0 items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {ai.loading ? (
                                  <>
                                    <span className="animate-spin text-[14px] material-symbols-outlined">autorenew</span>{' '}
                                    Đang tạo...
                                  </>
                                ) : (
                                  '🤖 Tạo TTS AI'
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {poi && (
          <>
            {/* Ảnh bìa POI */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
              <div className="relative">
                {coverImageUrl ? (
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={coverImageUrl}
                      alt="Ảnh bìa POI"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                    <span className="absolute bottom-2 left-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                      ✓ Đã có ảnh bìa
                    </span>
                  </div>
                ) : (
                  <div className="flex h-44 w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 to-slate-100">
                    <span className="material-symbols-outlined text-5xl text-slate-300">image</span>
                    <p className="text-xs font-medium text-slate-400">Chưa có ảnh bìa</p>
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Ảnh bìa</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Hiển thị trên bản đồ và bottom sheet thược minh. Tỷ lệ 16:9 được khuyến nghị.
                    </p>
                    {coverUploadError && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600">{coverUploadError}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={uploadCoverLoading || !poi}
                    onClick={() => coverInputRef.current?.click()}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadCoverLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        {coverImageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                      </>
                    )}
                  </button>
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => void handleCoverUpload(e)}
                />
              </div>
            </div>

            {/* Mã QR Địa Điểm (đường dẫn có chữ ký, hiệu lực 1 giờ) */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col items-center justify-center p-6 text-center">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Mã QR</h4>
              <p className="text-xs text-slate-500 mb-4 max-w-xs">
                Mỗi mã có hiệu lực <span className="font-semibold text-slate-700">1 giờ</span>. In mới hoặc bấm làm mới
                trước khi in để du khách quét được.
              </p>
              <button
                type="button"
                onClick={() => refreshMapQr()}
                disabled={mapQrLoading || !poi}
                className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mapQrLoading ? 'Đang tạo mã…' : 'Làm mới mã (gia hạn 1 giờ)'}
              </button>
              {mapQrError ? (
                <p className="mb-4 text-xs text-rose-600">{mapQrError}</p>
              ) : null}
              <div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-sm">
                {mapQrLoading && !mapQrFullUrl ? (
                  <div className="flex h-[200px] w-[200px] items-center justify-center text-xs text-slate-500">
                    Đang tải…
                  </div>
                ) : mapQrFullUrl ? (
                  <QRCodeSVG
                    value={mapQrFullUrl}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="H"
                    includeMargin={false}
                  />
                ) : (
                  <div className="flex h-[200px] w-[200px] items-center justify-center px-2 text-xs text-slate-500">
                    Chưa có mã
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-col items-center gap-1">
                <p className="font-bold text-slate-800">{poi.name}</p>
                <p className="text-[11px] text-slate-500">
                  Hết hạn dự kiến:{' '}
                  <span className="font-medium text-slate-700">{formatVnExpiry(mapQrExpiresAt)}</span>
                </p>
              </div>
            </div>
          </>
        )}
        {showTtsCheckout && (
          <AiTtsCheckout
            amount={aiTtsPrice}
            quotaPerPurchase={aiTtsQuotaPerPurchase}
            onClose={() => setShowTtsCheckout(false)}
            onSuccess={() => {
              setShowTtsCheckout(false);
              void fetchTtsQuota();
            }}
          />
        )}
        {showTranslateCheckout && (
          <AiTranslateCheckout
            amount={aiTranslatePrice}
            quotaPerPurchase={aiTranslateQuotaPerPurchase}
            onClose={() => setShowTranslateCheckout(false)}
            onSuccess={() => {
              setShowTranslateCheckout(false);
              void fetchTranslateQuota();
            }}
          />
        )}
      </div>
    </section>
  );
}
