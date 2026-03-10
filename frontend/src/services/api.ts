import axios from 'axios';
import type { User, POI, Media, Partner, Tour, TourReview, NarrationLog, BreadcrumbPoint } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Offline mode interceptor - kiểm tra flag từ localStorage
// Cơ chế Switch Logic: khi offline, request ghi (POST/PUT) vào SyncQueue,
// request đọc (GET) trả về lỗi đặc biệt để caller dùng dữ liệu local
apiClient.interceptors.request.use((config) => {
    const isOffline = localStorage.getItem('bcsd_offline_mode') === 'true' && !navigator.onLine;
    if (isOffline) {
        // Ghi requests (POST, PUT): queue vào SyncQueue thay vì gửi thẳng
        if (config.method === 'post' || config.method === 'put') {
            const syncQueue = JSON.parse(localStorage.getItem('bcsd_sync_queue') || '[]');
            syncQueue.push({
                type: config.url?.includes('/narration/start') ? 'narration_start'
                    : config.url?.includes('/narration/end') ? 'narration_end'
                        : config.url?.includes('/breadcrumbs') ? 'breadcrumb'
                            : 'unknown',
                payload: config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {},
                created_at: new Date().toISOString(),
            });
            localStorage.setItem('bcsd_sync_queue', JSON.stringify(syncQueue.slice(-500)));
        }
        // Tất cả offline requests đều throw error để caller sử dụng mock/local data
        const error = new Error('OFFLINE_MODE') as Error & { isOfflineMode: boolean };
        error.isOfflineMode = true;
        throw error;
    }
    return config;
});

// --- User endpoints ---
export const initUser = async (deviceId: string): Promise<User> => {
    const { data } = await apiClient.post<User>('/users/init', { device_id: deviceId });
    return data;
};

// --- POI endpoints ---
export const getPOIsNearMe = async (lat: number, lng: number, radius = 500): Promise<POI[]> => {
    const { data } = await apiClient.get<POI[]>('/pois/near-me', { params: { lat, lng, radius } });
    return data;
};

export const getPOIById = async (id: string): Promise<POI> => {
    const { data } = await apiClient.get<POI>(`/pois/${id}`);
    return data;
};

export const scanQRCode = async (code: string): Promise<POI> => {
    const { data } = await apiClient.get<POI>('/pois/scan', { params: { code } });
    return data;
};

export const getPOIMedia = async (poiId: string, language: string, voiceRegion: string): Promise<Media | null> => {
    try {
        const { data } = await apiClient.get<Media[]>(`/pois/${poiId}/media`, { params: { language, voice_region: voiceRegion } });
        // Media Selection Engine: exact match > language-only match > null (TTS fallback)
        const exactMatch = data.find(m => m.language === language && m.voice_region === voiceRegion);
        if (exactMatch) return exactMatch;
        const languageMatch = data.find(m => m.language === language);
        return languageMatch || null;
    } catch {
        return null;
    }
};

export const getPOIPartners = async (poiId: string): Promise<Partner[]> => {
    const { data } = await apiClient.get<Partner[]>(`/pois/${poiId}/partners`);
    return data;
};

// --- Tour endpoints ---
export const getTours = async (): Promise<Tour[]> => {
    const { data } = await apiClient.get<Tour[]>('/tours');
    return data;
};

export const getTourById = async (id: string): Promise<Tour> => {
    const { data } = await apiClient.get<Tour>(`/tours/${id}`);
    return data;
};

export const getTourReviews = async (tourId: string): Promise<TourReview[]> => {
    const { data } = await apiClient.get<TourReview[]>(`/tours/${tourId}/reviews`);
    return data;
};

export const submitTourReview = async (review: Omit<TourReview, 'id' | 'created_at'>): Promise<TourReview> => {
    const { data } = await apiClient.post<TourReview>(`/tours/${review.tour_id}/reviews`, review);
    return data;
};

// --- Log endpoints ---
export const startNarration = async (log: Omit<NarrationLog, 'id' | 'duration'>): Promise<NarrationLog> => {
    const { data } = await apiClient.post<NarrationLog>('/logs/narration/start', log);
    return data;
};

export const endNarration = async (logId: string, duration: number): Promise<void> => {
    await apiClient.put(`/logs/narration/end`, { log_id: logId, duration });
};

export const postBreadcrumbs = async (userId: string, points: BreadcrumbPoint[]): Promise<void> => {
    await apiClient.post('/logs/breadcrumbs', { user_id: userId, points });
};

// --- Offline data endpoint ---
export const downloadOfflinePackage = async (tourId: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(`/offline/package/${tourId}`, { responseType: 'blob' });
    return data;
};

export default apiClient;
