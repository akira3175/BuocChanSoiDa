import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient, { getApiErrorMessage } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import type { Media, POI, POICategory } from '../types';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LANG_LABELS: Record<string, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  fr: 'Français',
};

function formatVoiceRegion(region: string): string {
  if (!region) return 'Mặc định';
  const map: Record<string, string> = {
    mien_nam: 'Miền Nam',
    mien_bac: 'Miền Bắc',
    mien_trung: 'Miền Trung',
    usa: 'USA',
    uk: 'UK',
  };
  return map[region] || region;
}

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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [addressText, setAddressText] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const { isPlaying, speakTTS, pause } = useAudioPlayer();
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [mediaSubmitting, setMediaSubmitting] = useState(false);
  const [mediaForm, setMediaForm] = useState({
    language: 'vi',
    voice_region: 'mien_nam',
    media_type: 'AUDIO' as 'AUDIO' | 'TTS',
    tts_content: '',
    file_url: '',
    file: null as File | null,
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'food' as POICategory,
    latitude: 10.7552,
    longitude: 106.7038,
    geofence_radius: 80,
  });

  const mediaByLocale = useMemo(() => {
    const map = new Map<string, Media[]>();
    const sorted = [...mediaList].sort((a, b) => {
      const byLang = a.language.localeCompare(b.language);
      if (byLang !== 0) return byLang;
      const byVoice = (a.voice_region || '').localeCompare(b.voice_region || '');
      if (byVoice !== 0) return byVoice;
      return a.media_type.localeCompare(b.media_type);
    });
    for (const m of sorted) {
      const key = `${m.language}|${m.voice_region || ''}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [mediaList]);

  useEffect(() => {
    const fetchMyPoi = async () => {
      setLoading(true);
      setError('');
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
        try {
          const mediaRes = await apiClient.get<Media[]>(`/pois/${data.id}/media/`);
          setMediaList(mediaRes.data);
        } catch {
          setMediaList([]);
        }
      } catch (err) {
        setPoi(null);
        setMediaList([]);
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status === 404) {
          // Partner đã đăng nhập nhưng chưa có POI record (BE trả 404 "No POI found").
          setError('Bạn chưa có POI. Hãy tạo POI để bắt đầu quản lý thuyết minh đa ngôn ngữ.');
        } else {
          setError(getApiErrorMessage(err, 'Không thể tải POI. Vui lòng thử lại.'));
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchMyPoi();
  }, []);

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

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (poi) {
        const { data } = await apiClient.put<POI>('/pois/my-poi/', formData);
        setPoi(data);
        try {
          const mediaRes = await apiClient.get<Media[]>(`/pois/${data.id}/media/`);
          setMediaList(mediaRes.data);
        } catch {
          setMediaList([]);
        }
      } else {
        const { data } = await apiClient.post<POI>('/pois/my-poi/', formData);
        setPoi(data);
        try {
          const mediaRes = await apiClient.get<Media[]>(`/pois/${data.id}/media/`);
          setMediaList(mediaRes.data);
        } catch {
          setMediaList([]);
        }
      }
      alert('Đã lưu POI thành công.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu POI. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestPoiDescription = () => {
    const text = (formData.description || '').trim();
    if (!text) return;

    if (isPlaying) {
      pause();
    } else {
      // Preview "intro" của POI ngay trong form bằng TTS tiếng Việt.
      speakTTS(text, 'vi-VN');
    }
  };

  const handleCreateMedia = async () => {
    if (!poi) {
      setError('Cần tạo POI thật trước khi thêm media.');
      return;
    }

    setMediaSubmitting(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('language', mediaForm.language);
      payload.append('voice_region', mediaForm.voice_region);
      payload.append('media_type', mediaForm.media_type);
      payload.append('tts_content', mediaForm.tts_content);
      if (mediaForm.file_url) {
        payload.append('file_url', mediaForm.file_url);
      }
      if (mediaForm.media_type === 'AUDIO' && mediaForm.file) {
        payload.append('file', mediaForm.file);
      }

      await apiClient.post(`/pois/${poi.id}/media/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const mediaRes = await apiClient.get<Media[]>(`/pois/${poi.id}/media/`);
      setMediaList(mediaRes.data);
      setMediaForm({
        language: 'vi',
        voice_region: 'mien_nam',
        media_type: 'AUDIO',
        tts_content: '',
        file_url: '',
        file: null,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể thêm media.'));
    } finally {
      setMediaSubmitting(false);
    }
  };

  return (
    <section className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="text-base font-bold text-slate-900">{poi ? 'POI của Partner' : 'Tạo POI cho Partner'}</h3>
      {error && (
        <p className="mt-2 text-xs text-slate-500">{error}</p>
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

            <button
              type="button"
              onClick={handleTestPoiDescription}
              disabled={isPlaying ? false : !(formData.description || '').trim()}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPlaying ? 'stop_circle' : 'play_circle'}
              </span>
              {isPlaying ? 'Dừng nghe' : 'Nghe thử intro'}
            </button>
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

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/40 to-white shadow-sm">
          <div className="border-b border-slate-100 bg-white/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-slate-500">translate</span>
              <h4 className="text-sm font-bold text-slate-900">Thuyết minh đa ngôn ngữ</h4>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Mỗi ngôn ngữ có thể có file ghi âm hoặc văn bản TTS.</p>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[320px,1fr]">
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-3">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Thêm nội dung mới</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Ngôn ngữ</label>
                  <input
                    value={mediaForm.language}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, language: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Giọng vùng</label>
                  <input
                    value={mediaForm.voice_region}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, voice_region: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-600">Loại</label>
                <select
                  value={mediaForm.media_type}
                  onChange={(e) => setMediaForm((prev) => ({ ...prev, media_type: e.target.value as 'AUDIO' | 'TTS' }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="AUDIO">File âm thanh</option>
                  <option value="TTS">Đọc TTS từ văn bản</option>
                </select>
              </div>

              {mediaForm.media_type === 'TTS' && (
                <div className="mt-3">
                  <label className="text-xs font-semibold text-slate-600">Văn bản</label>
                  <textarea
                    value={mediaForm.tts_content}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, tts_content: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                  />
                </div>
              )}

              {mediaForm.media_type === 'AUDIO' && (
                <div className="mt-3 grid gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Chọn file</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setMediaForm((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))}
                      className="mt-1 block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Hoặc URL</label>
                    <input
                      value={mediaForm.file_url}
                      onChange={(e) => setMediaForm((prev) => ({ ...prev, file_url: e.target.value }))}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateMedia}
                disabled={mediaSubmitting || !poi}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                {mediaSubmitting ? 'Đang thêm…' : 'Thêm vào danh sách'}
              </button>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Danh sách hiện có</p>
              {mediaList.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">Chưa có thuyết minh nào.</p>
              )}

              <div className="space-y-3">
                {mediaByLocale.map(([localeKey, items]) => {
                  const [langCode, voiceRaw] = localeKey.split('|');
                  const voiceLabel = formatVoiceRegion(voiceRaw);
                  const langTitle = LANG_LABELS[langCode] || langCode.toUpperCase();
                  return (
                    <div
                      key={localeKey}
                      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-100/50"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-bold text-primary">{langTitle}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-medium text-slate-500">{voiceLabel}</span>
                      </div>
                      <ul className="space-y-2">
                        {items.map((m) => (
                          <li
                            key={`${m.id}`}
                            className={`flex gap-3 rounded-xl border px-3 py-2.5 ${
                              m.media_type === 'AUDIO'
                                ? 'border-emerald-100 bg-emerald-50/40'
                                : 'border-indigo-100 bg-indigo-50/35'
                            }`}
                          >
                            <span
                              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                                m.media_type === 'AUDIO' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {m.media_type === 'AUDIO' ? 'graphic_eq' : 'chat_bubble'}
                              </span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wide ${
                                    m.media_type === 'AUDIO' ? 'text-emerald-700' : 'text-indigo-700'
                                  }`}
                                >
                                  {m.media_type === 'AUDIO' ? 'Âm thanh' : 'TTS'}
                                </span>
                              </div>
                              {m.media_type === 'AUDIO' ? (
                                <div className="mt-1">
                                  <p className="truncate text-xs text-slate-600" title={m.file_url}>{m.file_url || 'Chưa có link'}</p>
                                  {m.file_url && (
                                    <a
                                      href={m.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline decoration-emerald-700/30 underline-offset-2 hover:text-emerald-900"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                      Nghe thử
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs leading-relaxed text-slate-700">{m.tts_content || '—'}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
