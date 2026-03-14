import { useCallback, useRef } from 'react';
import type { POI, Media, Partner, Language, VoiceRegion } from '../types';
import { startNarration, endNarration, getPOIMedia, getPOIPartners } from '../services/api';

const ANTI_SPAM_MINUTES = 10;
const LOG_KEY = 'bcsd_narration_logs';

interface NarrationLogLocal {
    poi_id: string;
    start_time: number; // timestamp ms
    trigger_type: 'AUTO' | 'QR';
    log_id?: string | number;
}

function getLocalLogs(): NarrationLogLocal[] {
    try {
        return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveLocalLog(log: NarrationLogLocal) {
    const logs = getLocalLogs();
    logs.push(log);
    // Giữ tối đa 200 records trong localStorage
    const trimmed = logs.slice(-200);
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
}

interface UseNarrationEngineOptions {
    language: Language;
    voiceRegion: VoiceRegion;
    userId?: string;
    onNarrationReady: (poi: POI, media: Media | null, partners: Partner[]) => void;
    onNarrationConflict: (newPoi: POI) => void; // Hỏi user có muốn nghe bài mới không
}

export function useNarrationEngine({
    language,
    voiceRegion,
    userId: _userId,
    onNarrationReady,
    onNarrationConflict,
}: UseNarrationEngineOptions) {
    const isPlayingRef = useRef(false);
    const currentLogIdRef = useRef<string | null>(null);
    const currentPoiRef = useRef<POI | null>(null);

    /**
     * Kiểm tra Anti-Spam: POI này đã được nghe bởi trigger Auto trong 30 phút gần đây chưa?
     */
    const checkAntiSpam = useCallback((poiId: string, triggerType: 'AUTO' | 'QR'): boolean => {
        if (triggerType === 'QR') return false; // QR override: luôn phát
        const logs = getLocalLogs();
        const now = Date.now();
        const recentLog = logs.find(
            (l) =>
                l.poi_id === poiId &&
                l.trigger_type === 'AUTO' &&
                now - l.start_time < ANTI_SPAM_MINUTES * 60 * 1000
        );
        return !!recentLog; // true = bị spam, bỏ qua
    }, []);

    /**
     * Trigger narration cho 1 POI
     */
    const triggerNarration = useCallback(
        async (poi: POI, triggerType: 'AUTO' | 'QR' = 'AUTO') => {
            // 1. Kiểm tra Anti-Spam local (nhanh, dùng khi offline)
            if (checkAntiSpam(poi.id, triggerType)) return;

            // 2. Nếu đang phát bài khác
            if (isPlayingRef.current) {
                if (triggerType === 'QR') {
                    onNarrationConflict(poi);
                } else {
                    onNarrationConflict(poi);
                }
                return;
            }

            // 3. Bắt đầu phát
            isPlayingRef.current = true;
            currentPoiRef.current = poi;

            // Log start
            const logEntry: NarrationLogLocal = {
                poi_id: poi.id,
                start_time: Date.now(),
                trigger_type: triggerType,
            };

            try {
                const response = await startNarration({
                    poi: Number(poi.id),
                    start_time: new Date().toISOString(),
                    trigger_type: triggerType,
                });

                // Server trả về should_play = false → Anti-Spam blocked phía server
                if (!response.should_play) {
                    isPlayingRef.current = false;
                    currentPoiRef.current = null;
                    return;
                }

                const logId = response.log?.id;
                logEntry.log_id = logId;
                currentLogIdRef.current = logId ?? null;
            } catch {
                // Offline: lưu local để sync sau
                currentLogIdRef.current = null;
            }
            saveLocalLog(logEntry);

            // 4. Lấy media + partners song song
            const [media, partners] = await Promise.all([
                getPOIMedia(poi.id, language, voiceRegion),
                getPOIPartners(poi.id).catch(() => [] as Partner[]),
            ]);

            // 5. Gửi lên UI để play
            onNarrationReady(poi, media, partners);
        },
        [checkAntiSpam, language, voiceRegion, onNarrationReady, onNarrationConflict]
    );

    /**
     * Gọi khi kết thúc phát (audio ended hoặc user bấm Stop)
     */
    const finishNarration = useCallback(async (duration: number) => {
        isPlayingRef.current = false;
        currentPoiRef.current = null;
        if (currentLogIdRef.current) {
            try {
                await endNarration(currentLogIdRef.current, duration);
            } catch {
                // Offline: sync sau
            }
            currentLogIdRef.current = null;
        }
    }, []);

    return { triggerNarration, finishNarration };
}
