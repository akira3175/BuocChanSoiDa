import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { scanQRCode, getPOIById } from '../services/api';
import type { POI } from '../types';

interface QRScanOverlayProps {
    onClose: () => void;
    onScanSuccess: (poi: POI) => void;
}

export default function QRScanOverlay({ onClose, onScanSuccess }: QRScanOverlayProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [scanOk, setScanOk] = useState(false);
    const [cameraError, setCameraError] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const processedRef = useRef(false);
    const html5QrRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
    // Guard chống StrictMode double-invoke
    const startedRef = useRef(false);

    const handlePOI = useCallback(async (poi: POI) => {
        navigate('/map', { state: { qrPOI: poi } });
        onScanSuccess(poi);
    }, [navigate, onScanSuccess]);

    const handleQRResult = useCallback(async (decodedText: string) => {
        if (processedRef.current) return;
        processedRef.current = true;
        setScanOk(true);

        if (html5QrRef.current) {
            html5QrRef.current.stop().catch(() => {});
        }

        try {
            let poi;
            let poiId: string | null = null;

            // Try to extract ID from URL (e.g. ?poi=8 or ?id=8)
            try {
                const url = new URL(decodedText);
                poiId = url.searchParams.get('poi') || url.searchParams.get('id');
            } catch {
                // Try to extract from JSON (e.g. {"id": 8})
                try {
                    const parsed = JSON.parse(decodedText);
                    if (parsed && parsed.id) poiId = parsed.id.toString();
                } catch {
                    // Fallback to raw text
                }
            }

            if (poiId) {
                poi = await getPOIById(poiId);
            } else {
                poi = await scanQRCode(decodedText);
            }

            await handlePOI(poi);
        } catch {
            const mockPoi: POI = {
                id: 'demo-001',
                name: 'Phố Ẩm Thực Vĩnh Khánh',
                description: 'Vĩnh Khánh là con phố ẩm thực nổi tiếng tại Quận 4, TP. Hồ Chí Minh.',
                latitude: 10.755,
                longitude: 106.703,
                geofence_radius: 50,
                category: 'food',
                qr_code_data: decodedText,
            };
            await handlePOI(mockPoi);
        }
    }, [handlePOI]);

    useEffect(() => {
        // Guard chống StrictMode double-invoke
        if (startedRef.current) return;
        startedRef.current = true;

        const containerId = 'bcsd-qr-reader';

        const startCamera = async () => {
            try {
                // Lazy import để tránh crash nếu thư viện không load được
                const { Html5Qrcode } = await import('html5-qrcode');
                const html5Qr = new Html5Qrcode(containerId);
                html5QrRef.current = html5Qr;

                await html5Qr.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 240, height: 240 } },
                    (decodedText) => handleQRResult(decodedText),
                    () => { /* ignore frame failures */ }
                );
            } catch {
                setCameraError(true);
            }
        };

        startCamera();

        return () => {
            if (html5QrRef.current) {
                html5QrRef.current.stop().catch(() => {});
                html5QrRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTestScan = useCallback(async () => {
        await handleQRResult('BCSD-POI-001');
    }, [handleQRResult]);

    const toggleFlash = async () => {
        if (!html5QrRef.current) return;
        try {
            // @ts-expect-error: applyVideoConstraints is not typed
            await html5QrRef.current.applyVideoConstraints({ advanced: [{ torch: !flashOn }] });
            setFlashOn(!flashOn);
        } catch { /* Thiết bị không hỗ trợ flash */ }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between text-white overflow-hidden bg-black">
            {/* Camera container */}
            <div className="absolute inset-0">
                <div
                    id="bcsd-qr-reader"
                    className="absolute inset-0"
                    style={{ width: '100%', height: '100%' }}
                />
                {/* Overlay tối bao quanh khung scan */}
                <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            </div>

            {/* Top nav */}
            <div className="relative z-20 w-full flex items-center justify-between p-6">
                <button onClick={onClose} className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </div>
                    <span className="text-white font-semibold text-lg drop-shadow-md">{t('common.cancel')}</span>
                </button>
                <div className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                    <span className="material-symbols-outlined text-white">help</span>
                </div>
            </div>

            {/* Scan frame */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
                <div className="relative size-64 sm:size-72">
                    {/* Corner decorations */}
                    <div className="absolute -top-1 -left-1 size-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                    <div className="absolute -top-1 -right-1 size-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                    <div className="absolute -bottom-1 -left-1 size-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                    <div className="absolute -bottom-1 -right-1 size-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />

                    {/* Scan line animation */}
                    {!scanOk && !cameraError && (
                        <div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(255,106,0,.8)] animate-scan-line" />
                    )}

                    {scanOk && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-400 text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                    )}
                </div>

                <div className="mt-8 px-8 text-center max-w-xs">
                    <h3 className="text-white text-lg font-bold drop-shadow-lg">
                        {scanOk ? 'Đang xử lý...' : t('qr.scanTitle')}
                    </h3>
                    <p className="text-white/70 text-sm mt-2 leading-relaxed">{t('qr.scanDescription')}</p>

                    {/* Demo button — always visible (camera requires HTTPS on mobile) */}
                    {!scanOk && (
                        <div className="mt-4 flex flex-col items-center gap-3">
                            {cameraError && (
                                <p className="text-amber-300 text-xs font-medium bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-2">
                                    📵 Camera không khả dụng (cần HTTPS)
                                </p>
                            )}
                            <button
                                onClick={handleTestScan}
                                className="px-8 py-3 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/40 active:scale-95 transition-transform"
                            >
                                {t('qr.demoScan')} · BCSD-POI-001
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom controls */}
            <div className="relative z-20 w-full flex flex-col items-center gap-4 pb-10">
                <div className="flex items-center justify-center gap-10">
                    <div className="flex flex-col items-center gap-2">
                        <button className="flex size-14 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white">
                            <span className="material-symbols-outlined text-3xl">image</span>
                        </button>
                        <span className="text-xs font-medium text-white/80 uppercase tracking-widest">{t('qr.gallery')}</span>
                    </div>

                    <div className="flex size-20 items-center justify-center rounded-full border-4 border-primary p-1">
                        <div className="size-full rounded-full bg-white flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-4xl">qr_code_scanner</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={toggleFlash}
                            className={`flex size-14 items-center justify-center rounded-full backdrop-blur-xl border border-white/10 text-white transition-colors ${flashOn ? 'bg-primary' : 'bg-black/40'}`}
                        >
                            <span className="material-symbols-outlined text-3xl">{flashOn ? 'flashlight_on' : 'flashlight_off'}</span>
                        </button>
                        <span className="text-xs font-medium text-white/80 uppercase tracking-widest">
                            {flashOn ? t('qr.flashOn') : t('qr.flashOff')}
                        </span>
                    </div>
                </div>
                <div className="w-32 h-1.5 bg-white/20 rounded-full" />
            </div>
        </div>
    );
}
