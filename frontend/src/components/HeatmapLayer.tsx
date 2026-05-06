import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, weight]
  radius?: number;
  blur?: number;
  maxZoom?: number;
}

export default function HeatmapLayer({ points, radius = 25, blur = 15, maxZoom = 17 }: HeatmapLayerProps) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;
    
    // Ensure window.L and window.L.heatLayer are ready 
    const L = (window as any).L;
    if (!L || !L.heatLayer) {
        console.warn("leaflet.heat is not ready yet");
        return;
    }

    if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
    }

    const maxWeight = points.length > 0 ? Math.max(...points.map(p => p[2])) : 1.0;
    
    // Use leaflet.heat initialized from CDN
    heatLayerRef.current = L.heatLayer(points, {
      radius: radius,
      blur: blur,
      maxZoom: maxZoom,
      max: maxWeight, // Dynamic point intensity
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    });

    heatLayerRef.current.addTo(map);

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [points, radius, blur, maxZoom, map]);

  return null;
}
