// Types for Phố Ẩm Thực Vĩnh Khánh App

export type Language = 'vi' | 'en' | 'zh' | 'ja' | 'ko';
export type VoiceRegion = 'mien_nam' | 'mien_bac' | 'mien_trung' | 'usa' | 'uk';
export type TriggerType = 'AUTO' | 'QR';
export type POICategory = 'food' | 'historical' | 'cultural' | 'scenic';

export interface User {
    id: string;
    device_id: string;
    preferred_language: Language;
    preferred_voice_region: VoiceRegion;
    created_at?: string;
}

export interface POI {
    id: string;
    name: string;
    description: string;
    latitude: number;  // khớp với backend serializer
    longitude: number; // khớp với backend serializer
    geofence_radius: number; // meters
    category: POICategory;
    qr_code_data: string;
    status?: number;
    distance?: number; // field inject từ near-me view (mét)
    image_url?: string;
    address?: string;
}

export interface Media {
    id: string;
    language: Language;
    voice_region: VoiceRegion;
    file_url: string;
    media_type: 'AUDIO' | 'TTS'; // uppercase, khớp với backend TextChoices
    media_type_display?: string;
}

export interface Partner {
    id: string;
    business_name: string;
    menu_details?: { must_try?: string[]; price_range?: string };
    opening_hours?: string;
}

export interface Tour {
    id: string;
    name: string;
    description?: string;
    status: 0 | 1;
    is_suggested: boolean;
    estimated_duration_min?: number;
    cover_image_url?: string;
    pois: TourPOI[];
}

export interface TourPOI {
    poi: POI;
    sequence_order: number;
}

export interface TourReview {
    id: string;
    tour_id: string;
    user_id: string;
    user_name: string;
    rating: number; // 1-5
    comment: string;
    created_at: string;
}

export interface NarrationLog {
    id?: string;
    /** poi (BE dùng FK id số nguyên, gửi lên dưới dạng số) */
    poi: number | string;
    start_time: string; // ISO
    trigger_type: TriggerType;
    duration?: number; // seconds
}

/** Response từ POST /api/analytics/narration/start/ */
export interface NarrationStartResponse {
    should_play: boolean;
    log?: NarrationLog;
    reason?: string;
}

export interface BreadcrumbPoint {
    lat: number;
    /** Kinh độ — dùng 'long' để match field name của BE */
    long: number;
    timestamp: string;
}

export interface NarrationState {
    poi: POI;
    media?: Media;
    partners: Partner[];
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
}

export interface PartnerAuthUser {
    id: string;
    email: string;
    username: string;
    full_name?: string;
    preferred_language?: Language;
    preferred_voice_region?: VoiceRegion;
}

export interface PartnerAuthTokens {
    access: string;
    refresh: string;
}

export interface PartnerAuthSession {
    user: PartnerAuthUser;
    tokens: PartnerAuthTokens;
}

export interface PartnerLoginPayload {
    email: string;
    password: string;
}

export interface PartnerSignupPayload {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
}
