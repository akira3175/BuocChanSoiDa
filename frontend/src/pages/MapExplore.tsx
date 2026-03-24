import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import { useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import type { POI } from '../types';
import { useApp } from '../context/AppContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useGeofence } from '../hooks/useGeofence';
import { useNarrationEngine } from '../hooks/useNarrationEngine';
import { unlockAudioAndTTS } from '../hooks/useAudioPlayer';
import { getPOIsNearMe } from '../services/api';
import NarrationBottomSheet from '../components/NarrationBottomSheet';
import QRScanOverlay from '../components/QRScanOverlay';
import BottomNavBar from '../components/BottomNavBar';
import type { Media, Partner } from '../types';

// Fix Leaflet default marker icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(L.Icon.Default.prototype as any)._getIconUrl = undefined;
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// Custom POI icons
function createPOIIcon(color: string, iconName: string) {
    return L.divIcon({
        className: '',
        html: `<div style="width:40px;height:48px;display:flex;flex-direction:column;align-items:center">
      <div style="width:40px;height:40px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px ${color}66;border:2.5px solid white">
        <span class="material-symbols-outlined" style="color:white;font-size:20px;font-variation-settings:'FILL' 1">${iconName}</span>
      </div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};margin-top:-1px"></div>
    </div>`,
        iconSize: [40, 48],
        iconAnchor: [20, 48],
        popupAnchor: [0, -48],
    });
}

const FOOD_ICON = createPOIIcon('#ff6a00', 'restaurant');
const HISTORICAL_ICON = createPOIIcon('#dc2626', 'castle');
const CULTURAL_ICON = createPOIIcon('#7c3aed', 'museum');

function getPOIIcon(category: POI['category']) {
    switch (category) {
        case 'food': return FOOD_ICON;
        case 'historical': return HISTORICAL_ICON;
        default: return CULTURAL_ICON;
    }
}

// Component con để re-center map
function RecenterMap({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
    const map = useMap();
    useEffect(() => { 
        map.setView([lat, lng], zoom ?? map.getZoom()); 
    }, [lat, lng, zoom, map]);
    return null;
}

// Component cho phép click mock tọa độ
function MapClickInterceptor({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

function estimateTTSDuration(text: string): string {
    if (!text) return '0s';
    const totalSeconds = Math.ceil(text.length / 4);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) return `~${minutes}p ${seconds}s`;
    return `~${seconds}s`;
}

// MOCK POI data — phố Vĩnh Khánh, Quận 4, TP.HCM (fallback khi offline)
const MOCK_POIS: POI[] = [
    { id: '1', name: 'Hẻm Bánh Tráng Nướng', description: 'Hẻm nổi tiếng với bánh tráng nướng giòn rụm, được phủ đầy trứng cút, tôm khô và các loại topping. Một trong những món ăn đường phố đặc trưng của phố Vĩnh Khánh.', latitude: 10.7550, longitude: 106.7035, geofence_radius: 40, category: 'food', qr_code_data: 'BCSD-POI-001' },
    { id: '2', name: 'Quán Hải Sản Đêm', description: 'Khu ẩm thực hải sản về đêm với các món ghẹ rang me, ốc hương xào, tôm nướng muối ớt được chế biến tươi ngon.', latitude: 10.7558, longitude: 106.7042, geofence_radius: 35, category: 'food', qr_code_data: 'BCSD-POI-002' },
    { id: '3', name: 'Góc Chè & Nước Ép', description: 'Điểm dừng quen thuộc của dân địa phương với các loại chè truyền thống và nước ép trái cây nhiệt đới tươi mát.', latitude: 10.7545, longitude: 106.7028, geofence_radius: 30, category: 'food', qr_code_data: 'BCSD-POI-003' },
    { id: '4', name: 'Chùa Vĩnh Khánh Cổ', description: 'Ngôi chùa cổ hơn 150 tuổi nằm giữa lòng phố ẩm thực, là nơi người dân địa phương đến cúng tế và cầu bình an.', latitude: 10.7565, longitude: 106.7050, geofence_radius: 50, category: 'historical', qr_code_data: 'BCSD-POI-004' },
];

// Vĩnh Khánh street center: Q4, HCMC
const DEFAULT_CENTER: [number, number] = [10.7552, 106.7038];

export default function MapExplore() {
    const { t } = useTranslation();
    const { user, openNarration, closeNarration, dispatch } = useApp();
    const [pois, setPois] = useState<POI[]>(MOCK_POIS);
    const [showQR, setShowQR] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [narrationData, setNarrationData] = useState<{ poi: POI; media: Media | null; partners: Partner[] } | null>(null);
    const [isRecenterRequested, setIsRecenterRequested] = useState(false);
    const [selectedSearchPOI, setSelectedSearchPOI] = useState<POI | null>(null);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Đọc POI được truyền qua navigation state (từ QR scan ở trang khác)
    const location = useLocation();
    const navigate = useNavigate();

    const { position, permissionStatus, setMockLocation, isMocking } = useGeolocation();

    // Fetch POIs từ backend khi có vị trí GPS
    useEffect(() => {
        if (!position) return;
        getPOIsNearMe(position.lat, position.lng)
            .then((data) => {
                if (data.length > 0) {
                    setPois(data);
                    dispatch({ type: 'SET_NEARBY_POIS', payload: data });
                }
            })
            .catch(() => { /* offline: giữ mock data */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [position?.lat, position?.lng]);

    // Narration engine callbacks
    const handleNarrationReady = useCallback((poi: POI, media: Media | null, partners: Partner[]) => {
        setNarrationData({ poi, media, partners });
        openNarration(poi, undefined, partners);
    }, [openNarration]);

    const handleNarrationConflict = useCallback((newPoi: POI) => {
        dispatch({ type: 'PUSH_TO_QUEUE', payload: newPoi });
    }, [dispatch]);

    const { triggerNarration, finishNarration } = useNarrationEngine({
        language: user?.preferred_language || 'vi',
        voiceRegion: user?.preferred_voice_region || 'mien_nam',
        onNarrationReady: handleNarrationReady,
        onNarrationConflict: handleNarrationConflict,
    });

    // Khi navigate về /map từ QR scan (QRScanOverlay gọi navigate với state.qrPOI)
    useEffect(() => {
        const state = location.state as { qrPOI?: POI } | null;
        if (state?.qrPOI) {
            unlockAudioAndTTS();
            triggerNarration(state.qrPOI, 'QR');
            // Xoá state để không trigger lại khi re-render
            navigate('/map', { replace: true, state: {} });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);

    // Geofence engine
    useGeofence({
        pois,
        position: position || null,
        onEnter: (poi) => {
            triggerNarration(poi, 'AUTO');
        },
    });

    const handlePOIMarkerClick = useCallback((poi: POI) => {
        unlockAudioAndTTS();
        // Sử dụng 'QR' trigger type để bypass anti-spam khi click thủ công
        triggerNarration(poi, 'QR');
    }, [triggerNarration]);

    const handleQRSuccess = useCallback((poi: POI) => {
        setShowQR(false);
        unlockAudioAndTTS();
        triggerNarration(poi, 'QR');
    }, [triggerNarration]);

    const handleNarrationClose = useCallback(async (duration: number) => {
        await finishNarration(duration);
        setNarrationData(null);
        closeNarration();
    }, [finishNarration, closeNarration]);

    const filteredPOIs = pois.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Handle search result selection - center map on selected POI
    const handleSearchResultClick = useCallback((poi: POI) => {
        setSelectedSearchPOI(poi);
        setShowSearchResults(false);
        setSearchQuery('');
    }, []);

    // Clear search when closing results
    const handleCloseSearchResults = useCallback(() => {
        setShowSearchResults(false);
        setSelectedSearchPOI(null);
        setSearchQuery('');
    }, []);

    return (
        <div className="relative flex h-dvh w-full flex-col overflow-hidden">
            {/* MAP LAYER */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={DEFAULT_CENTER}
                    zoom={17}
                    zoomControl={false}
                    style={{ height: '100%', width: '100%' }}
                    className="h-full w-full"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    {/* Re-center when GPS acquired or button pressed */}
                    {isRecenterRequested && position && (
                        <RecenterMap lat={position.lat} lng={position.lng} />
                    )}

                    {/* Re-center to selected search POI */}
                    {selectedSearchPOI && (
                        <RecenterMap lat={selectedSearchPOI.latitude} lng={selectedSearchPOI.longitude} zoom={18} />
                    )}

                    {/* Enable Map Click to mock GPS */}
                    <MapClickInterceptor onMapClick={setMockLocation} />

                    {/* Current user location */}
                    {position && (
                        <>
                            <Circle
                                center={[position.lat, position.lng]}
                                radius={15}
                                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3, weight: 2 }}
                            />
                            <Circle
                                center={[position.lat, position.lng]}
                                radius={60}
                                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1, dashArray: '4' }}
                            />
                        </>
                    )}

                    {/* POI Markers */}
                    {filteredPOIs.map((poi) => (
                        <Marker
                            key={poi.id}
                            position={[poi.latitude, poi.longitude]}
                            icon={getPOIIcon(poi.category)}
                            eventHandlers={{ click: () => handlePOIMarkerClick(poi) }}
                        >
                            <Popup minWidth={220} maxWidth={300}>
                                <div className="text-sm font-semibold">{poi.name}</div>
                                <div className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-4">{poi.description.slice(0, 150)}{poi.description.length > 150 ? '...' : ''}</div>
                                <div className="mt-2 text-[10px] text-primary font-bold bg-primary\/10 w-fit px-2 py-0.5 rounded-full inline-block">
                                    {poi.category === 'food' ? t('tour.categoryFood', { defaultValue: 'Ẩm thực' }) : t('tour.categoryHistorical', { defaultValue: 'Di tích' })}
                                </div>
                                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                        <span className="material-symbols-outlined text-[14px]">headphones</span>
                                        {estimateTTSDuration(poi.description)}
                                    </div>
                                    <button
                                        onClick={() => handlePOIMarkerClick(poi)}
                                        className="px-3 py-1.5 bg-primary text-white rounded-full text-xs font-bold active:scale-95 transition-transform shadow-sm"
                                    >
                                        {t('map.listenNarration')}
                                    </button>
                                </div>
                            </Popup>
                            {/* Geofence visualization */}
                            <Circle
                                center={[poi.latitude, poi.longitude]}
                                radius={poi.geofence_radius}
                                pathOptions={{ color: '#ff6a00', fillColor: '#ff6a00', fillOpacity: 0.06, weight: 1, dashArray: '4 4' }}
                            />
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* TOP HEADER */}
            <div className="relative z-20 flex flex-col gap-3 p-4 pt-safe">
                {/* Status bar */}
                <div className="flex items-center justify-between rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                            <span className={`material-symbols-outlined text-[20px] ${permissionStatus === 'granted' ? 'animate-pulse' : ''}`}>
                                {permissionStatus === 'granted' ? 'my_location' : 'location_disabled'}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{t('map.status')}</p>
                            <h2 className="text-sm font-bold leading-tight">
                                {isMocking ? t('map.recording', { defaultValue: 'Đang mock vị trí' }) : permissionStatus === 'granted' ? t('map.recording') : permissionStatus === 'denied' ? t('map.gpsDenied') : t('map.waitingGps')}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                    </div>
                </div>
                {/* Search Bar */}
                <div className="flex h-12 w-full items-center gap-2 rounded-xl bg-white px-4 shadow-xl">
                    <span className="material-symbols-outlined text-slate-400">search</span>
                    <input
                        className="flex-1 border-none bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
                        placeholder={t('map.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSearchResults(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                    />
                    <div className="h-4 w-px bg-slate-200" />
                    <span className="material-symbols-outlined text-primary">mic</span>
                </div>

                {/* Search Results Panel */}
                {showSearchResults && filteredPOIs.length > 0 && (
                    <div className="max-h-64 w-full rounded-xl bg-white shadow-xl overflow-y-auto">
                        {filteredPOIs.map((poi) => (
                            <button
                                key={poi.id}
                                onClick={() => handleSearchResultClick(poi)}
                                className="w-full px-4 py-3 border-b border-slate-100 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left flex items-start gap-3 last:border-b-0"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-slate-900 truncate">{poi.name}</p>
                                    <p className="text-xs text-slate-500 line-clamp-2">{poi.description.slice(0, 80)}{poi.description.length > 80 ? '...' : ''}</p>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 text-[18px] flex-shrink-0">
                                    {poi.category === 'food' ? 'restaurant' : 'castle'}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* No search results message */}
                {showSearchResults && filteredPOIs.length === 0 && searchQuery.length > 0 && (
                    <div className="w-full rounded-xl bg-white shadow-xl p-4 text-center">
                        <p className="text-sm text-slate-500">{t('map.noResults', { defaultValue: 'Không tìm thấy địa điểm nào' })}</p>
                    </div>
                )}
            </div>

            {/* FAB STACK */}
            <div className="relative z-20 mt-auto flex flex-col items-end gap-3 px-4 pb-2">
                {/* Filter */}
                <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-700 shadow-lg">
                    <span className="material-symbols-outlined">tune</span>
                </button>
                {/* My Location */}
                <button
                    onClick={() => { setIsRecenterRequested(true); setTimeout(() => setIsRecenterRequested(false), 1000); }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-lg"
                >
                    <span className="material-symbols-outlined">gps_fixed</span>
                </button>
                {/* QR Scan (Large) */}
                <button
                    onClick={() => setShowQR(true)}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-2xl shadow-primary/40 ring-4 ring-white"
                >
                    <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
                </button>
            </div>

            {/* BOTTOM NAV */}
            <div className="relative z-20">
                <BottomNavBar />
            </div>

            {/* NARRATION BOTTOM SHEET OVERLAY */}
            {narrationData && (
                <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/20 backdrop-blur-sm">
                    <NarrationBottomSheet
                        poi={narrationData.poi}
                        media={narrationData.media}
                        partners={narrationData.partners}
                        onClose={handleNarrationClose}
                    />
                </div>
            )}

            {/* QR SCAN OVERLAY */}
            {showQR && (
                <QRScanOverlay
                    onClose={() => setShowQR(false)}
                    onScanSuccess={handleQRSuccess}
                />
            )}

            {/* Offline indicator */}
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
                {!navigator.onLine && (
                    <div className="mt-2 px-4 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                        {t('map.offlineMode')}
                    </div>
                )}
            </div>
        </div>
    );
}
