import axios from 'axios';
import type {
    User,
    POI,
    Media,
    Partner,
    Tour,
    TourReview,
    NarrationLog,
    NarrationStartResponse,
    BreadcrumbPoint,
    PartnerAuthSession,
    PartnerLoginPayload,
    PartnerSignupPayload,
    PartnerAuthUser,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

const PARTNER_AUTH_STORAGE_KEY = 'bcsd_partner_auth';

interface PartnerLoginResponse {
    access: string;
    refresh: string;
    user: PartnerAuthUser;
}

interface PartnerSignupResponse {
    message: string;
    tokens: {
        access: string;
        refresh: string;
    };
    user: PartnerAuthUser;
}

const applyAuthHeader = (accessToken?: string) => {
    if (accessToken) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        return;
    }
    delete apiClient.defaults.headers.common.Authorization;
};

export const getPartnerAuthSession = (): PartnerAuthSession | null => {
    try {
        const raw = localStorage.getItem(PARTNER_AUTH_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as PartnerAuthSession;
    } catch {
        return null;
    }
};

export const setPartnerAuthSession = (session: PartnerAuthSession | null): void => {
    if (!session) {
        localStorage.removeItem(PARTNER_AUTH_STORAGE_KEY);
        applyAuthHeader();
        return;
    }
    localStorage.setItem(PARTNER_AUTH_STORAGE_KEY, JSON.stringify(session));
    applyAuthHeader(session.tokens.access);
};

export const isPartnerAuthenticated = (): boolean => {
    const session = getPartnerAuthSession();
    return Boolean(session?.tokens.access);
};

export const createPartnerDemoSession = (email: string, username?: string): PartnerAuthSession => {
    const normalizedEmail = email.trim().toLowerCase() || 'partner.demo@local';
    const normalizedUsername = (username?.trim() || normalizedEmail.split('@')[0] || 'partner_demo').toLowerCase();

    const session: PartnerAuthSession = {
        user: {
            id: `demo-${Date.now()}`,
            email: normalizedEmail,
            username: normalizedUsername,
            full_name: 'Demo Partner',
        },
        tokens: {
            access: `demo-access-${Date.now()}`,
            refresh: `demo-refresh-${Date.now()}`,
        },
    };

    setPartnerAuthSession(session);
    return session;
};

const existingSession = getPartnerAuthSession();
if (existingSession?.tokens.access) {
    applyAuthHeader(existingSession.tokens.access);
}

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
                    : config.url?.includes('/narration') && config.url?.includes('/end') ? 'narration_end'
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

export const loginPartner = async (payload: PartnerLoginPayload): Promise<PartnerAuthSession> => {
    const { data } = await apiClient.post<PartnerLoginResponse>('/users/login/', payload);
    const session: PartnerAuthSession = {
        user: data.user,
        tokens: {
            access: data.access,
            refresh: data.refresh,
        },
    };
    setPartnerAuthSession(session);
    return session;
};

export const loginUserAccount = async (payload: PartnerLoginPayload): Promise<PartnerAuthSession> => {
    const { data } = await apiClient.post<PartnerLoginResponse>('/users/login/', payload);
    return {
        user: data.user,
        tokens: {
            access: data.access,
            refresh: data.refresh,
        },
    };
};

export const signupPartner = async (payload: PartnerSignupPayload): Promise<PartnerAuthSession> => {
    const { data } = await apiClient.post<PartnerSignupResponse>('/users/register/', payload);
    const session: PartnerAuthSession = {
        user: data.user,
        tokens: {
            access: data.tokens.access,
            refresh: data.tokens.refresh,
        },
    };
    setPartnerAuthSession(session);
    return session;
};

export const signupUserAccount = async (payload: PartnerSignupPayload): Promise<PartnerAuthSession> => {
    const { data } = await apiClient.post<PartnerSignupResponse>('/users/register/', payload);
    return {
        user: data.user,
        tokens: {
            access: data.tokens.access,
            refresh: data.tokens.refresh,
        },
    };
};

export const logoutPartner = async (): Promise<void> => {
    const session = getPartnerAuthSession();
    try {
        if (session?.tokens.refresh) {
            await apiClient.post('/users/logout/', { refresh: session.tokens.refresh });
        }
    } finally {
        setPartnerAuthSession(null);
    }
};

export const getApiErrorMessage = (error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại.'): string => {
    if (!axios.isAxiosError(error)) return fallback;

    const responseData = error.response?.data;
    if (typeof responseData === 'string') return responseData;

    if (responseData && typeof responseData === 'object') {
        if ('detail' in responseData && typeof responseData.detail === 'string') return responseData.detail;
        if ('error' in responseData && typeof responseData.error === 'string') return responseData.error;
        if ('message' in responseData && typeof responseData.message === 'string') return responseData.message;

        const firstField = Object.values(responseData)[0];
        if (Array.isArray(firstField) && typeof firstField[0] === 'string') return firstField[0];
        if (typeof firstField === 'string') return firstField;
    }

    return fallback;
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
    try {
        const { data } = await apiClient.get(`/pois/${poiId}/partners`);
        // Handle DRF pagination: { count, results: [...] } hoặc plain array
        if (Array.isArray(data)) return data as Partner[];
        if (data && Array.isArray((data as { results?: unknown }).results)) {
            return (data as { results: Partner[] }).results;
        }
        return [];
    } catch {
        return [];
    }
};

// --- Tour endpoints ---
export const getTours = async (): Promise<Tour[]> => {
    const { data } = await apiClient.get('/tours');
    // DRF pagination support: { count, next, previous, results: [...] }
    if (Array.isArray(data)) return data as Tour[];
    if (data && Array.isArray((data as { results?: unknown }).results)) {
        return (data as { results: Tour[] }).results;
    }
    return [];
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

// --- Analytics / Log endpoints ---

/**
 * Gửi batch lên POST /api/analytics/narration/start/
 * Response: { should_play, log?, reason? }
 * - should_play = false → anti-spam blocked (trigger AUTO đã nghe trong 30 phút)
 * - should_play = true  → tạo record thành công, trả về log
 */
export const startNarration = async (
    payload: Pick<NarrationLog, 'poi' | 'trigger_type' | 'start_time'>
): Promise<NarrationStartResponse> => {
    const { data } = await apiClient.post<NarrationStartResponse>(
        '/analytics/narration/start/',
        payload
    );
    return data;
};

/**
 * PATCH /api/analytics/narration/<id>/end/
 * Cập nhật số giây thực tế người dùng đã nghe.
 */
export const endNarration = async (logId: string | number, duration: number): Promise<void> => {
    await apiClient.patch(`/analytics/narration/${logId}/end/`, { duration });
};

/**
 * POST /api/analytics/breadcrumbs/batch/
 * Payload: { points: [{lat, long, timestamp}] }
 * user được BE lấy từ JWT token, không cần gửi user_id.
 */
export const postBreadcrumbs = async (points: BreadcrumbPoint[]): Promise<void> => {
    await apiClient.post('/analytics/breadcrumbs/batch/', { points });
};

// --- Offline data endpoint ---
export const downloadOfflinePackage = async (tourId: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(`/offline/package/${tourId}`, { responseType: 'blob' });
    return data;
};

export default apiClient;
