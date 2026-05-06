import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeatmapLayer from '../components/HeatmapLayer';

type HeatmapPoint = [number, number, number];

export default function HeatmapAnalytics() {
  const navigate = useNavigate();
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        // Assuming your API endpoint is at the backend host
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await axios.get(`${API_URL}/api/analytics/heatmap/`);
        const data = response.data;
        // Inject a mock point exactly at the map center to verify if the layer even renders!
        const mockPoint = [10.7552, 106.7038, 1000] as HeatmapPoint;
        setPoints([...data, mockPoint]);
      } catch (error) {
        console.error('Failed to fetch heatmap data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

  return (
    <div className="relative w-full h-dvh bg-[#1a1a1a]">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-[1000] p-4 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="size-10 bg-black/50 backdrop-blur border border-white/10 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-black/70 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div className="bg-black/50 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-white pointer-events-auto">
          <h1 className="text-sm font-semibold tracking-wide">Bản đồ nhiệt POI</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a]">
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="size-12 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Đang tải dữ liệu nhiệt...</p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={[10.7552, 106.7038]} // Vĩnh Khánh center, since POIs are here
          zoom={16}
          zoomControl={false}
          className="w-full h-full z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {points.length > 0 && <HeatmapLayer points={points} />}
        </MapContainer>
      )}
    </div>
  );
}
