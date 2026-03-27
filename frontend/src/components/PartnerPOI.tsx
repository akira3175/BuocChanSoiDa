import { useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient, { getApiErrorMessage } from '../services/api';
import type { POI, POICategory } from '../types';

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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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
      } catch (err) {
        setPoi(null);
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
      } else {
        const { data } = await apiClient.post<POI>('/pois/my-poi/', formData);
        setPoi(data);
      }
      alert('Đã lưu POI thành công.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu POI. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
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

        {poi && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col items-center justify-center p-6 text-center">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Mã QR Địa Điểm</h4>
            <p className="text-xs text-slate-500 mb-6 max-w-xs">
              Mã QR chứa đường dẫn trực tiếp đến địa điểm. Bạn có thể in ra đặt trên bàn cho du khách quét.
            </p>
            <div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-sm">
              <QRCodeSVG
                value={`${window.location.origin}/map?poi=${poi.id}`}
                size={200}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="mt-4 flex flex-col items-center gap-1">
              <p className="font-bold text-slate-800">{poi.name}</p>
              <code className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded">
                /map?poi={poi.id}
              </code>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
