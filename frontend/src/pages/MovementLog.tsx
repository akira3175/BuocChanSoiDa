import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polyline, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AppLayout from '../components/AppLayout';
import { getBreadcrumbHistory, isUserAuthenticated } from '../services/api';
import type { BreadcrumbHistoryPoint } from '../services/api';
import type { Language } from '../types';

// Fix leaflet default icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(L.Icon.Default.prototype as any)._getIconUrl = undefined;
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
    { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'zh', label: '中文', flag: '🇨🇳' },
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
    { value: 'ko', label: '한국어', flag: '🇰🇷' },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string, todayLabel: string, yesterdayLabel: string, lng: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
        a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

    if (sameDay(d, today)) return todayLabel;
    if (sameDay(d, yesterday)) return yesterdayLabel;
    const locale = lng === 'vi' ? 'vi-VN' : lng === 'zh' ? 'zh-CN' : lng === 'ja' ? 'ja-JP' : lng === 'ko' ? 'ko-KR' : 'en-US';
    return d.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function groupByDay(points: BreadcrumbHistoryPoint[]): Map<string, BreadcrumbHistoryPoint[]> {
    const map = new Map<string, BreadcrumbHistoryPoint[]>();
    for (const p of points) {
        const key = new Date(p.timestamp).toLocaleDateString('vi-VN');
        const arr = map.get(key) ?? [];
        arr.push(p);
        map.set(key, arr);
    }
    return map;
}

function FitBoundsOnLoad({ points }: { points: [number, number][] }) {
    const map = useMap();
    const fitted = useRef(false);
    useEffect(() => {
        if (!fitted.current && points.length > 1) {
            const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
            map.fitBounds(bounds, { padding: [24, 24] });
            fitted.current = true;
        }
    }, [map, points]);
    return null;
}

export default function MovementLog() {
    const { t, i18n } = useTranslation();
    const [points, setPoints] = useState<BreadcrumbHistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(true);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [currentLang, setCurrentLang] = useState<Language>(
        (localStorage.getItem('bcsd_language') as Language) || 'vi'
    );

    const handleChangeLang = (lang: Language) => {
        setCurrentLang(lang);
        localStorage.setItem('bcsd_language', lang);
        i18n.changeLanguage(lang);
    };

    useEffect(() => {
        let alive = true;
        async function load() {
            if (!isUserAuthenticated()) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError('');
                const data = await getBreadcrumbHistory(500);
                if (!alive) return;
                setPoints(data);
            } catch {
                if (!alive) return;
                setError(t('movementLog.loadError'));
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalDistance = useMemo(() => {
        let d = 0;
        for (let i = 1; i < points.length; i++) {
            d += haversineDistance(points[i - 1].lat, points[i - 1].long, points[i].lat, points[i].long);
        }
        return d;
    }, [points]);

    const grouped = useMemo(() => groupByDay(points), [points]);
    const dayKeys = useMemo(() => [...grouped.keys()].reverse(), [grouped]);

    const mapCenter: [number, number] = points.length > 0
        ? [points[Math.floor(points.length / 2)].lat, points[Math.floor(points.length / 2)].long]
        : [10.7769, 106.7009];

    const firstTs = points.length > 0 ? new Date(points[0].timestamp) : null;
    const lastTs = points.length > 0 ? new Date(points[points.length - 1].timestamp) : null;

    const durationHours = firstTs && lastTs
        ? ((lastTs.getTime() - firstTs.getTime()) / 3600000).toFixed(1)
        : null;

    const displayPoints = selectedDay
        ? (grouped.get(selectedDay) ?? [])
        : points;

    const displayRoute = useMemo<[number, number][]>(() =>
        displayPoints.map(p => [p.lat, p.long]), [displayPoints]);

    return (
        <AppLayout title={t('movementLog.title')} showBack backPath="/settings">
            <div className="pb-6">
                {/* ── Language Switcher ── */}
                <div className="px-4 pt-4 animate-fade-slide-up">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
                            <span
                                className="material-symbols-outlined text-primary text-[18px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                language
                            </span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {t('movementLog.language')}
                            </span>
                        </div>
                        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.value}
                                    onClick={() => handleChangeLang(lang.value)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all tap-scale ${
                                        currentLang === lang.value
                                            ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>{lang.flag}</span>
                                    <span>{lang.label}</span>
                                    {currentLang === lang.value && (
                                        <span
                                            className="material-symbols-outlined text-[13px] animate-pop-in"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            check
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="px-4 pt-4 space-y-3 animate-fade-in">
                        <div className="h-32 rounded-2xl skeleton" />
                        <div className="h-48 rounded-2xl skeleton" />
                        <div className="h-24 rounded-2xl skeleton" />
                    </div>
                ) : error ? (
                    <div className="mx-4 mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
                        <span className="material-symbols-outlined text-rose-500 text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                        <p className="text-sm text-rose-700 font-semibold flex-1">{error}</p>
                    </div>
                ) : !isUserAuthenticated() ? (
                    /* ── Unauthenticated State ── */
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
                        <div className="size-24 rounded-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center mb-5 animate-float">
                            <span className="material-symbols-outlined text-5xl text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2">{t('movementLog.loginRequired')}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {t('movementLog.loginDesc')}
                        </p>
                    </div>
                ) : points.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
                        <div className="size-24 rounded-full bg-gradient-to-br from-primary/10 to-orange-100 flex items-center justify-center mb-5 animate-float">
                            <span className="material-symbols-outlined text-5xl text-primary/60" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2">{t('movementLog.emptyTitle')}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {t('movementLog.emptyDesc')}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Stats Cards ── */}
                        <div className="px-4 pt-4 grid grid-cols-3 gap-3 animate-fade-slide-up">
                            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                                <p className="text-lg font-black text-slate-900 leading-none">{points.length}</p>
                                <p className="text-[10px] text-slate-400 font-semibold text-center">{t('movementLog.gpsPoints')}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>straighten</span>
                                <p className="text-lg font-black text-slate-900 leading-none">{formatDistance(totalDistance)}</p>
                                <p className="text-[10px] text-slate-400 font-semibold text-center">{t('movementLog.distance')}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                                <p className="text-lg font-black text-slate-900 leading-none">{durationHours ?? '—'}h</p>
                                <p className="text-[10px] text-slate-400 font-semibold text-center">{t('movementLog.duration')}</p>
                            </div>
                        </div>

                        {/* ── Map ── */}
                        <div className="px-4 mt-4 animate-fade-slide-up">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-slate-700">{t('movementLog.mapTitle')}</h3>
                                <button
                                    onClick={() => setShowMap(v => !v)}
                                    className="text-xs text-primary font-bold flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-lg tap-scale"
                                >
                                    <span className="material-symbols-outlined text-sm">{showMap ? 'visibility_off' : 'visibility'}</span>
                                    {showMap ? t('movementLog.hide') : t('movementLog.show')}
                                </button>
                            </div>
                            {showMap && (
                                <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200/60 shadow-inner">
                                    <MapContainer
                                        key={selectedDay ?? 'all'}
                                        center={mapCenter}
                                        zoom={15}
                                        zoomControl={false}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        />
                                        <FitBoundsOnLoad points={displayRoute} />
                                        {displayRoute.length > 1 && (
                                            <Polyline
                                                positions={displayRoute}
                                                pathOptions={{
                                                    color: '#ff6a00',
                                                    weight: 3,
                                                    opacity: 0.85,
                                                    dashArray: '6 4',
                                                    lineCap: 'round',
                                                }}
                                            />
                                        )}
                                        {displayRoute.length > 0 && (
                                            <Circle
                                                center={displayRoute[0]}
                                                radius={8}
                                                pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1, weight: 2 }}
                                            />
                                        )}
                                        {displayRoute.length > 1 && (
                                            <Circle
                                                center={displayRoute[displayRoute.length - 1]}
                                                radius={8}
                                                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
                                            />
                                        )}
                                    </MapContainer>
                                </div>
                            )}
                        </div>

                        {/* ── Day Filter Tabs ── */}
                        <div className="px-4 mt-4">
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        selectedDay === null
                                            ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {t('movementLog.all')} ({points.length})
                                </button>
                                {dayKeys.map((day) => {
                                    const dayPoints = grouped.get(day) ?? [];
                                    const label = formatDateLabel(
                                        dayPoints[0]?.timestamp ?? '',
                                        t('movementLog.today'),
                                        t('movementLog.yesterday'),
                                        i18n.language,
                                    );
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDay(day)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                selectedDay === day
                                                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                        >
                                            {label} ({dayPoints.length})
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Point List grouped by day ── */}
                        <div className="px-4 mt-4 space-y-4">
                            {(selectedDay ? [selectedDay] : dayKeys).map((day) => {
                                const dayPoints = grouped.get(day) ?? [];
                                const dayLabel = formatDateLabel(
                                    dayPoints[0]?.timestamp ?? '',
                                    t('movementLog.today'),
                                    t('movementLog.yesterday'),
                                    i18n.language,
                                );
                                let dayDist = 0;
                                for (let i = 1; i < dayPoints.length; i++) {
                                    dayDist += haversineDistance(
                                        dayPoints[i - 1].lat, dayPoints[i - 1].long,
                                        dayPoints[i].lat, dayPoints[i].long,
                                    );
                                }

                                return (
                                    <div key={day}>
                                        {/* Day Header */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-800">{dayLabel}</h4>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                                                <span>{dayPoints.length} {t('movementLog.points')}</span>
                                                <span>·</span>
                                                <span>{formatDistance(dayDist)}</span>
                                            </div>
                                        </div>

                                        {/* Points */}
                                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                            {dayPoints.map((p, idx) => (
                                                <div
                                                    key={p.id}
                                                    className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-slate-50' : ''}`}
                                                >
                                                    <div className={`size-2 rounded-full flex-shrink-0 ${idx === 0 ? 'bg-green-500' : idx === dayPoints.length - 1 ? 'bg-red-400' : 'bg-slate-300'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-mono text-slate-600">
                                                            {p.lat.toFixed(5)}, {p.long.toFixed(5)}
                                                        </p>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                                                        {formatTime(p.timestamp)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="px-4 mt-4 flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="size-3 rounded-full bg-green-500" />
                                <span className="text-[10px] text-slate-400 font-medium">{t('movementLog.startPoint')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="size-3 rounded-full bg-red-400" />
                                <span className="text-[10px] text-slate-400 font-medium">{t('movementLog.endPoint')}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
