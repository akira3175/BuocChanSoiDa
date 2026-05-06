import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from '../components/HeatmapLayer';
import apiClient from '../services/api';

type HeatmapPoint = [number, number, number];
type DataMode = 'all' | 'movement' | 'narration';

// Fit bounds helper
function FitBoundsOnData({ points }: { points: HeatmapPoint[] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length > 0) {
            const latlngs = points.map(p => L.latLng(p[0], p[1]));
            const bounds = L.latLngBounds(latlngs);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [48, 48], maxZoom: 17 });
            }
        }
    }, [points, map]);
    return null;
}

export default function HeatmapAnalytics() {
    const navigate = useNavigate();
    const [allPoints, setAllPoints] = useState<{ movement: HeatmapPoint[]; narration: HeatmapPoint[] }>({
        movement: [],
        narration: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<DataMode>('all');

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError('');
                const { data } = await apiClient.get<HeatmapPoint[]>('/analytics/heatmap/');

                // Phân tách điểm: điểm có weight = 1.0 là breadcrumb, còn lại là narration
                const movement: HeatmapPoint[] = [];
                const narration: HeatmapPoint[] = [];

                for (const p of data) {
                    if (p[2] <= 1.0) {
                        movement.push(p);
                    } else {
                        narration.push(p);
                    }
                }

                setAllPoints({ movement, narration });
            } catch (e) {
                console.error('Failed to fetch heatmap data', e);
                setError('Không thể tải dữ liệu bản đồ nhiệt. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const displayPoints: HeatmapPoint[] = (() => {
        if (mode === 'movement') return allPoints.movement;
        if (mode === 'narration') return allPoints.narration;
        return [...allPoints.movement, ...allPoints.narration];
    })();

    const totalPoints = allPoints.movement.length + allPoints.narration.length;

    const MODE_OPTIONS: { id: DataMode; label: string; icon: string; color: string }[] = [
        { id: 'all', label: 'Tất cả', icon: 'layers', color: 'bg-white/20 text-white' },
        { id: 'movement', label: 'Di chuyển', icon: 'route', color: 'bg-blue-500/80 text-white' },
        { id: 'narration', label: 'Nghe thuyết minh', icon: 'headphones', color: 'bg-orange-500/80 text-white' },
    ];

    return (
        <div className="relative w-full h-dvh bg-[#1a1a1a] overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 z-[1000] p-4 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="size-10 bg-black/50 backdrop-blur border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>

                <div className="bg-black/50 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-white">
                    <h1 className="text-sm font-bold tracking-wide">🔥 Bản đồ hoạt động</h1>
                </div>

                {/* Stats pill */}
                {!loading && totalPoints > 0 && (
                    <div className="bg-black/50 backdrop-blur border border-white/10 px-3 py-1.5 rounded-full">
                        <p className="text-white text-xs font-semibold">{totalPoints.toLocaleString()} điểm</p>
                    </div>
                )}
            </div>

            {/* Mode Filter Tabs */}
            <div className="absolute bottom-0 inset-x-0 z-[1000] pb-safe">
                {/* Legend */}
                <div className="mx-4 mb-3 bg-black/50 backdrop-blur border border-white/10 rounded-2xl p-3">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2">Chú thích màu sắc</p>
                    <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden mb-1.5">
                        <div className="flex-1 h-full" style={{ background: 'linear-gradient(to right, #3b82f6, #06b6d4, #22c55e, #eab308, #f97316, #ef4444)' }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/40 font-medium">
                        <span>Ít</span>
                        <span>Nhiều</span>
                    </div>

                    <div className="flex gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-blue-400 text-sm">route</span>
                            <span className="text-white/60 text-[10px]">Di chuyển ({allPoints.movement.length})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-orange-400 text-sm">headphones</span>
                            <span className="text-white/60 text-[10px]">Nghe thuyết minh ({allPoints.narration.length})</span>
                        </div>
                    </div>
                </div>

                {/* Mode tabs */}
                <div className="mx-4 mb-4 flex gap-2">
                    {MODE_OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setMode(opt.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                mode === opt.id
                                    ? 'bg-white text-slate-900 border-white shadow-lg'
                                    : 'bg-black/40 text-white/70 border-white/10 hover:bg-black/60'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Map */}
            {loading ? (
                <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-full border-[3px] border-orange-400 border-t-transparent animate-spin" />
                        <p className="text-xs text-white/50 font-medium">Đang tải dữ liệu nhiệt...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a] px-8">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-5xl text-white/20 mb-3 block">error</span>
                        <p className="text-white/50 text-sm">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-full hover:bg-white/20 transition"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            ) : totalPoints === 0 ? (
                <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a] px-8">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-white/10 mb-3 block">whatshot</span>
                        <p className="text-white/40 text-sm font-medium">Chưa có dữ liệu hoạt động</p>
                        <p className="text-white/25 text-xs mt-1">Dữ liệu sẽ xuất hiện khi có người dùng di chuyển và nghe thuyết minh</p>
                    </div>
                </div>
            ) : (
                <MapContainer
                    center={[10.7552, 106.7038]}
                    zoom={16}
                    zoomControl={false}
                    className="w-full h-full z-0"
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    {displayPoints.length > 0 && (
                        <>
                            <HeatmapLayer
                                key={mode}
                                points={displayPoints}
                                radius={mode === 'narration' ? 35 : 20}
                                blur={mode === 'narration' ? 20 : 12}
                            />
                            <FitBoundsOnData points={displayPoints} />
                        </>
                    )}
                </MapContainer>
            )}
        </div>
    );
}
