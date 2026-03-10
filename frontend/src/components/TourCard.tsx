import { useTranslation } from 'react-i18next';
import type { Tour } from '../types';

interface TourCardProps {
    tour: Tour;
    isActive?: boolean;
    onClick?: () => void;
}

export default function TourCard({ tour, isActive = false, onClick }: TourCardProps) {
    const { t } = useTranslation();
    const poiCount = tour.pois.length;
    const duration = tour.estimated_duration_min;

    return (
        <div
            onClick={onClick}
            className={`flex h-full flex-col gap-3 rounded-xl min-w-[220px] bg-white p-3 shadow-sm border cursor-pointer transition-all ${isActive
                ? 'border-primary/40 shadow-primary/10 shadow-md'
                : 'border-slate-100 hover:border-primary/20'
                } ${!tour.status ? 'opacity-60 pointer-events-none' : ''}`}
        >
            <div
                className="w-full aspect-video bg-center bg-no-repeat bg-cover rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden"
                style={tour.cover_image_url ? { backgroundImage: `url(${tour.cover_image_url})` } : {}}
            >
                {!tour.cover_image_url && (
                    <span className="material-symbols-outlined text-slate-300 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
                )}
            </div>
            <div>
                <p className={`text-base font-bold leading-tight ${isActive ? 'text-primary' : 'text-slate-900'}`}>
                    {tour.name}
                </p>
                <p className="text-slate-500 text-xs font-medium mt-1">
                    {duration ? `${duration} ${t('common.minutes')}` : '—'} • {poiCount} {t('common.locations')}
                </p>
            </div>
        </div>
    );
}
