import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
    points: [number, number, number][]; // [lat, lng, weight]
    radius?: number;
    blur?: number;
    maxZoom?: number;
}

export default function HeatmapLayer({ points, radius = 25, blur = 15, maxZoom = 17 }: HeatmapLayerProps) {
    const map = useMap();
    const heatLayerRef = useRef<L.HeatLayer | null>(null);

    useEffect(() => {
        if (!map || points.length === 0) return;

        // Xóa layer cũ nếu có
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }

        const maxWeight = Math.max(...points.map(p => p[2]), 1);

        // Sử dụng L.heatLayer từ npm package leaflet.heat (không phải window.L)
        heatLayerRef.current = L.heatLayer(points, {
            radius,
            blur,
            maxZoom,
            max: maxWeight,
            minOpacity: 0.4,
            gradient: {
                0.2: '#3b82f6',   // blue
                0.4: '#06b6d4',   // cyan
                0.6: '#22c55e',   // green
                0.75: '#eab308',  // yellow
                0.9: '#f97316',   // orange
                1.0: '#ef4444',   // red
            },
        });

        heatLayerRef.current.addTo(map);

        return () => {
            if (heatLayerRef.current && map) {
                map.removeLayer(heatLayerRef.current);
                heatLayerRef.current = null;
            }
        };
    }, [points, radius, blur, maxZoom, map]);

    return null;
}
