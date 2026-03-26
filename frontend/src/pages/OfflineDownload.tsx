import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '../components/AppLayout';
import { PackageSkeleton, staggerStyle } from '../components/Skeleton';
import { useSyncQueue } from '../hooks/useSyncQueue';
import {
    downloadOfflinePackageByMode,
    getAvailableOfflinePackages,
    getOfflineDataMode,
    OfflineDataSourceError,
    setOfflineDataMode,
    type OfflinePackageData,
} from '../services/offlinePackages';

interface OfflinePackage extends OfflinePackageData {
    id: string;
    name: string;
    description: string;
    poi_count: number;
    size_mb: number;
    downloaded_at?: string;
    downloadProgress?: number;
}

// IndexedDB helpers cho offline storage
const DB_NAME = 'bcsd_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_packages';

type StoredOfflinePackage = {
    id: string;
    data: Blob;
    downloaded_at: string;
    payload?: {
        package_type?: string;
        source?: string;
        tour_id?: string;
        generated_at?: string;
        tour?: unknown;
        tour_pois_group?: unknown;
        tour_pois?: unknown;
        pois?: unknown;
    };
    stats?: {
        tour_pois_count: number;
        pois_count: number;
    };
};

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function savePackageToDB(packageId: string, data: Blob): Promise<void> {
    let payload: StoredOfflinePackage['payload'] | undefined;
    try {
        payload = JSON.parse(await data.text()) as StoredOfflinePackage['payload'];
    } catch {
        payload = undefined;
    }

    const tourPoisCount = Array.isArray(payload?.tour_pois) ? payload?.tour_pois.length : 0;
    const poisCount = Array.isArray(payload?.pois) ? payload?.pois.length : 0;

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({
            id: packageId,
            data,
            downloaded_at: new Date().toISOString(),
            payload,
            stats: {
                tour_pois_count: tourPoisCount,
                pois_count: poisCount,
            },
        } as StoredOfflinePackage);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function deletePackageFromDB(packageId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(packageId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getPackageFromDB(packageId: string): Promise<StoredOfflinePackage | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(packageId) as IDBRequest<StoredOfflinePackage | undefined>;
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

export default function OfflineDownload() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState<OfflinePackage[]>([]);
    const [dataMode, setDataMode] = useState<'api' | 'mock'>(getOfflineDataMode());
    const [dataError, setDataError] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const { getPendingCount, flush } = useSyncQueue();
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    // Load saved packages
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setDataError(null);
            const saved = localStorage.getItem('bcsd_downloaded_packages');
            const downloadedIds: string[] = saved ? JSON.parse(saved) : [];

            // Verify IndexedDB entries exist
            const verifiedIds: string[] = [];
            for (const id of downloadedIds) {
                const entry = await getPackageFromDB(id);
                if (entry) {
                    verifiedIds.push(id);

                    // Nâng cấp record cũ (chỉ có Blob) sang record có payload/stats để dễ kiểm tra.
                    if (!entry.payload && entry.data instanceof Blob) {
                        await savePackageToDB(id, entry.data).catch(() => { /* ignore */ });
                    }
                }
            }

            let availablePackages: OfflinePackageData[] = [];
            try {
                availablePackages = await getAvailableOfflinePackages();
            } catch (error) {
                if (error instanceof OfflineDataSourceError) {
                    setDataError(error.message);
                } else {
                    setDataError('Không tải được dữ liệu offline từ API.');
                }
            }

            setPackages(availablePackages.map(p => ({
                ...p,
                downloaded_at: verifiedIds.includes(p.id) ? new Date().toLocaleDateString('vi-VN') : undefined,
            })));
            setPendingCount(getPendingCount());
            setLoading(false);
        };
        init();
    }, [getPendingCount, dataMode]);

    // Periodic update pending count
    useEffect(() => {
        const timer = setInterval(() => setPendingCount(getPendingCount()), 5000);
        return () => clearInterval(timer);
    }, [getPendingCount]);

    const handleDownload = useCallback(async (pkg: OfflinePackage) => {
        setDownloadError(null);
        setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, downloadProgress: 0 } : p));

        let blob: Blob;
        try {
            blob = await downloadOfflinePackageByMode(pkg.id);
        } catch {
            setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, downloadProgress: undefined } : p));
            setDownloadError(
                dataMode === 'api'
                    ? 'Tải gói thất bại từ API. Hãy kiểm tra backend hoặc chuyển sang MOCK để test.'
                    : 'Tải gói thất bại.'
            );
            return;
        }

        try {
            // Lưu vào IndexedDB
            await savePackageToDB(pkg.id, blob);
        } catch {
            setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, downloadProgress: undefined } : p));
            setDownloadError('Đã tải dữ liệu nhưng lưu offline thất bại (IndexedDB). Vui lòng kiểm tra bộ nhớ trình duyệt.');
            return;
        }

        setPackages(prev => {
            const updated = prev.map(p => p.id === pkg.id ? { ...p, downloadProgress: undefined, downloaded_at: new Date().toLocaleDateString('vi-VN') } : p);
            localStorage.setItem('bcsd_downloaded_packages', JSON.stringify(updated.filter(p => p.downloaded_at).map(p => p.id)));
            localStorage.setItem('bcsd_offline_mode', 'true');
            return updated;
        });
    }, [dataMode]);

    const handleDelete = useCallback(async (pkg: OfflinePackage) => {
        // Xóa khỏi IndexedDB
        await deletePackageFromDB(pkg.id).catch(() => { /* ignore */ });

        setPackages(prev => {
            const updated = prev.map(p => p.id === pkg.id ? { ...p, downloaded_at: undefined } : p);
            const downloadedIds = updated.filter(p => p.downloaded_at).map(p => p.id);
            localStorage.setItem('bcsd_downloaded_packages', JSON.stringify(downloadedIds));
            if (downloadedIds.length === 0) localStorage.setItem('bcsd_offline_mode', 'false');
            return updated;
        });
    }, []);

    const handleManualSync = useCallback(async () => {
        setIsSyncing(true);
        await flush();
        setPendingCount(getPendingCount());
        setIsSyncing(false);
    }, [flush, getPendingCount]);

    const handleToggleDataMode = useCallback((mode: 'api' | 'mock') => {
        setOfflineDataMode(mode);
        setDataMode(mode);
    }, []);

    const getSourceLabel = (pkg: OfflinePackage): string => {
        if (pkg.source === 'mock') {
            return 'MOCK';
        }
        if (pkg.source_detail === 'tour-pois') {
            return 'API: TOUR_POIS';
        }
        return 'API: TOURS_FALLBACK';
    };

    const hasDownloaded = packages.some(p => p.downloaded_at);

    return (
        <AppLayout title={t('offline.title')}>
            {/* Info Banner */}
            <div className="mx-4 mt-4 animate-fade-slide-up">
                <div className="rounded-2xl bg-gradient-to-r from-primary\/10 to-primary\/5 border border-primary\/20 p-4 flex gap-3">
                    <div className="size-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary\/20">
                        <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>offline_bolt</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">{t('offline.bannerTitle')}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t('offline.bannerDescription')}</p>
                    </div>
                </div>
            </div>

            {/* Data source switch */}
            <div className="mx-4 mt-3 animate-fade-slide-up">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold text-slate-700">Nguồn dữ liệu offline</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Chuyển nhanh giữa dữ liệu thật (API) và dữ liệu mock.</p>
                        </div>
                        <div className="inline-flex rounded-lg bg-slate-100 p-1">
                            <button
                                onClick={() => handleToggleDataMode('api')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${dataMode === 'api' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                            >
                                API
                            </button>
                            <button
                                onClick={() => handleToggleDataMode('mock')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${dataMode === 'mock' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                            >
                                MOCK
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Downloaded indicator */}
            {hasDownloaded && (
                <div className="mx-4 mt-3 animate-bounce-in">
                    <div className="rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <p className="text-xs font-semibold text-green-700">{t('offline.readyStatus')}</p>
                    </div>
                </div>
            )}

            {dataError && (
                <div className="mx-4 mt-3 animate-fade-slide-up">
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-semibold text-red-700">{dataError}</p>
                    </div>
                </div>
            )}

            {downloadError && (
                <div className="mx-4 mt-3 animate-fade-slide-up">
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-semibold text-red-700">{downloadError}</p>
                    </div>
                </div>
            )}

            {/* Sync Queue Status */}
            {pendingCount > 0 && (
                <div className="mx-4 mt-3 animate-fade-slide-up">
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
                            <p className="text-xs font-semibold text-amber-700">
                                {t('offline.syncPending', { count: pendingCount })}
                            </p>
                        </div>
                        <button
                            onClick={handleManualSync}
                            disabled={isSyncing || !navigator.onLine}
                            className={`px-3 py-1 rounded-lg text-xs font-bold tap-scale transition-all ${isSyncing
                                ? 'bg-amber-200 text-amber-500'
                                : navigator.onLine
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {isSyncing ? (
                                <span className="flex items-center gap-1">
                                    <span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t('offline.syncing')}
                                </span>
                            ) : 'Sync'}
                        </button>
                    </div>
                </div>
            )}

            {/* Package list */}
            <div className="px-4 mt-5 mb-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">{t('offline.sectionTitle')}</h3>

                {loading ? (
                    <div className="space-y-3">
                        <PackageSkeleton />
                        <PackageSkeleton />
                        <PackageSkeleton />
                    </div>
                ) : packages.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                        <p className="text-sm font-semibold text-slate-700">Không có gói offline từ API.</p>
                        <p className="text-xs text-slate-500 mt-1">Hãy tạo tour/tour_pois hoặc chuyển sang chế độ MOCK.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {packages.map((pkg, i) => {
                            const isDownloading = pkg.downloadProgress !== undefined;
                            const isDownloaded = !!pkg.downloaded_at;
                            return (
                                <div
                                    key={pkg.id}
                                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-stagger-item transition-all hover:shadow-md"
                                    style={staggerStyle(i)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`material-symbols-outlined text-lg ${isDownloaded ? 'text-green-500' : 'text-primary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    {isDownloaded ? 'folder' : 'cloud_download'}
                                                </span>
                                                <h4 className="text-sm font-bold text-slate-900 truncate">{pkg.name}</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pkg.description}</p>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                                                <span>{pkg.poi_count} {t('common.points')}</span>
                                                <span>•</span>
                                                <span>{pkg.size_mb} MB</span>
                                                <span>•</span>
                                                <span className={pkg.source === 'mock' ? 'text-amber-600' : 'text-blue-600'}>
                                                    {getSourceLabel(pkg)}
                                                </span>
                                                {isDownloaded && <span className="text-green-600">• {t('offline.downloaded')} {pkg.downloaded_at}</span>}
                                            </div>
                                        </div>
                                        <div className="shrink-0 pt-1">
                                            {isDownloading ? (
                                                <div className="flex items-center gap-1 text-xs text-primary font-bold">
                                                    <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                    {Math.round(pkg.downloadProgress || 0)}%
                                                </div>
                                            ) : isDownloaded ? (
                                                <button onClick={() => handleDelete(pkg)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold hover:bg-red-50 hover:text-red-500 tap-scale transition-all">
                                                    {t('offline.delete')}
                                                </button>
                                            ) : (
                                                <button onClick={() => handleDownload(pkg)} className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-sm shadow-primary\/20 tap-scale hover:shadow-md transition-all">
                                                    {t('offline.download')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {isDownloading && (
                                        <div className="mt-3">
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                <div className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-300 ease-out" style={{ width: `${pkg.downloadProgress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
