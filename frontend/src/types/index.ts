// Types for Phố Ẩm Thực Vĩnh Khánh App

export type Language = 'vi' | 'en' | 'zh' | 'ja' | 'ko';
export type VoiceRegion = 'mien_nam' | 'mien_bac' | 'mien_trung' | 'usa' | 'uk';
export type TriggerType = 'Auto' | 'QR';
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
    lat: number;
    lng: number;
    geofence_radius: number; // meters
    category: POICategory;
    qr_code_data: string;
    image_url?: string;
    address?: string;
}

export interface Media {
    id: string;
    poi_id: string;
    language: Language;
    voice_region: VoiceRegion;
    file_url: string;
    duration_seconds?: number;
    media_type: 'audio' | 'tts';
}

export interface Partner {
    id: string;
    poi_id: string;
    business_name: string;
    image_url?: string;
    menu_details?: { must_try?: string[]; price_range?: string };
    opening_hours?: string;
    distance_meters?: number;
    avg_price?: number;
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
    poi_id: string;
    start_time: string; // ISO
    trigger_type: TriggerType;
    duration?: number; // seconds
}

export interface BreadcrumbPoint {
    lat: number;
    lng: number;
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
