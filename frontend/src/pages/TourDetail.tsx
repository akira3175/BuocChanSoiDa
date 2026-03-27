import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppLayout from '../components/AppLayout';
import type { Tour } from '../types';
import { getTourById } from '../services/api';
import { getOfflineTourById } from '../services/offlineStorage';

export default function TourDetail() {
    const { t } = useTranslation();
    const { tourId = '' } = useParams();
    const navigate = useNavigate();

    const [tour, setTour] = useState<Tour | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTour = async () => {
            setLoading(true);
            try {
                const data = await getTourById(tourId);
                setTour(data);
            } catch {
                const offlineTour = await getOfflineTourById(tourId);
                setTour(offlineTour);
            } finally {
                setLoading(false);
            }
        };

        loadTour().catch(() => {
            setTour(null);
            setLoading(false);
        });
    }, [tourId]);

    const orderedPOIs = useMemo(() => {
        if (!tour) return [];
        return [...tour.pois].sort((a, b) => a.sequence_order - b.sequence_order);
    }, [tour]);

    if (loading) {
        return (
            <AppLayout title={t('tour.title')}>
                <div className="px-4 py-8 text-sm text-slate-500">{t('common.loading')}</div>
            </AppLayout>
        );
    }

    if (!tour) {
        return (
            <AppLayout title={t('tour.title')}>
                <div className="px-4 py-10 text-center">
                    <p className="text-slate-600 font-semibold">Không tìm thấy tour</p>
                    <button
                        onClick={() => navigate('/tours')}
                        className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
                    >
                        Quay lại lộ trình
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title={tour.name}
            headerAction={
                <button
                    onClick={() => navigate('/tours')}
                    className="flex items-center justify-center size-10 rounded-full text-slate-700 hover:bg-slate-100 tap-scale"
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>
            }
        >
            <div className="px-4 py-4 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900">{tour.name}</h2>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">{tour.description || t('tour.defaultDescription')}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span>{orderedPOIs.length} {t('common.points')}</span>
                        <span>•</span>
                        <span>{tour.estimated_duration_min || '—'} {t('common.minutes')}</span>
                    </div>
                </div>

                <div>
                    <h3 className="mb-2 text-sm font-bold text-slate-700">POI liên quan</h3>
                    <div className="space-y-2">
                        {orderedPOIs.map((item) => (
                            <div key={`${tour.id}-${item.poi.id}`} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">#{item.sequence_order} {item.poi.name}</p>
                                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.poi.description}</p>
                                    </div>
                                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                                        ID {item.poi.id}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
