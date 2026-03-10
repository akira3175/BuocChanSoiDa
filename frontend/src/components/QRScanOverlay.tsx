import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Html5Qrcode } from 'html5-qrcode';
import { scanQRCode } from '../services/api';
import type { POI } from '../types';

interface QRScanOverlayProps {
    onClose: () => void;
    onScanSuccess: (poi: POI) => void;
}

export default function QRScanOverlay({ onClose, onScanSuccess }: QRScanOverlayProps) {
    const { t } = useTranslation();
    const [scanning, setScanning] = useState(true);
    const [flashOn, setFlashOn] = useState(false);
    const [scanOk, setScanOk] = useState(false);
    const [cameraError, setCameraError] = useState(false);
    const html5QrRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);
    const processedRef = useRef(false);

    // Khởi động camera thật
    useEffect(() => {
        const containerId = 'bcsd-qr-reader';
        let mounted = true;

        const startCamera = async () => {
            try {
                const html5Qr = new Html5Qrcode(containerId);
                html5QrRef.current = html5Qr;

                await html5Qr.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 260, height: 260 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        if (!mounted || processedRef.current) return;
                        processedRef.current = true;
                        handleQRResult(decodedText);
                    },
                    () => { /* ignore scan failure frames */ }
                );
            } catch {
                if (mounted) {
                    setCameraError(true);
                }
            }
        };

        startCamera();

        return () => {
            mounted = false;
            if (html5QrRef.current) {
                html5QrRef.current.stop().catch(() => { /* ignore */ });
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleQRResult = async (decodedText: string) => {
        setScanning(false);
        setScanOk(true);

        // Dừng camera
        if (html5QrRef.current) {
            html5QrRef.current.stop().catch(() => { /* ignore */ });
        }

        try {
            const poi = await scanQRCode(decodedText);
            onScanSuccess(poi);
        } catch {
            // Fallback: nếu API chưa sẵn sàng, tạo POI giả
            const mockPoi: POI = {
                id: 'demo-001',
                name: 'Phố Ẩm Thực Vĩnh Khánh',
                description: 'Vĩnh Khánh là con phố ẩm thực nổi tiếng tại Quận 4, TP. Hồ Chí Minh.',
                lat: 10.755,
                lng: 106.703,
                geofence_radius: 50,
                category: 'food',
                qr_code_data: decodedText,
            };
            onScanSuccess(mockPoi);
        }
    };

    // Demo scan button (fallback khi camera không khả dụng)
    const handleTestScan = async () => {
        const mockCode = 'BCSD-POI-001';
        processedRef.current = true;
        await handleQRResult(mockCode);
    };

    const toggleFlash = async () => {
        if (html5QrRef.current) {
            try {
                const track = html5QrRef.current.getRunningTrackSettings?.();
                if (track) {
                    // @ts-expect-error: applyVideoConstraints might exist
                    await html5QrRef.current.applyVideoConstraints({ advanced: [{ torch: !flashOn }] });
                    setFlashOn(!flashOn);
                }
            } catch {
                /* Thiết bị không hỗ trợ flash */
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between text-white overflow-hidden">
            {/* Camera background - thật hoặc simulated */}
            <div className="absolute inset-0 bg-black">
                <div
                    id="bcsd-qr-reader"
                    ref={scannerContainerRef}
                    className="absolute inset-0"
                    style={{ width: '100%', height: '100%' }}
                />
                {/* Layer tối bao quanh khung scan */}
                <div className="absolute inset-0 bg-black/60 pointer-events-none" />
            </div>

            {/* Top Navigation */}
            <div className="relative z-20 w-full flex items-center justify-between p-6">
                <button onClick={onClose} className="flex items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </div>
                    <span className="text-white font-semibold text-lg drop-shadow-md">{t('common.cancel')}</span>
                </button>
                <div className="flex size-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md">
                    <span className="material-symbols-outlined text-white">help</span>
                </div>
            </div>

            {/* Scan Frame */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
                <div className="relative size-72 sm:size-80">
                    {/* Corner borders */}
                    <div className="absolute -top-1 -left-1 size-12 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
                    <div className="absolute -top-1 -right-1 size-12 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
                    <div className="absolute -bottom-1 -left-1 size-12 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
                    <div className="absolute -bottom-1 -right-1 size-12 border-b-4 border-r-4 border-primary rounded-br-3xl" />

                    {/* Scan line */}
                    {scanning && (
                        <div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 shadow-[0_0_15px_rgba(255,106,0,0.8)] animate-scan-line" />
                    )}

                    {scanOk && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-green-400 text-5xl block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                <p className="text-white font-semibold">{t('qr.codeReceived')}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-10 px-8 text-center max-w-xs">
                    <h3 className="text-white text-lg font-bold leading-tight drop-shadow-lg">{t('qr.scanTitle')}</h3>
                    <p className="text-white/80 text-sm mt-2 leading-relaxed">{t('qr.scanDescription')}</p>
                    {cameraError && (
                        <div className="mt-3 px-4 py-2 bg-amber-500/20 border border-amber-400/30 rounded-xl">
                            <p className="text-amber-300 text-xs font-medium mb-2">Camera không khả dụng</p>
                            <button onClick={handleTestScan} className="px-6 py-2 rounded-full bg-primary text-white text-sm font-bold shadow-lg">
                                {t('qr.demoScan')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="relative z-20 w-full flex flex-col items-center gap-6 pb-10">
                <div className="flex items-center justify-center gap-10">
                    <div className="flex flex-col items-center gap-2">
                        <button className="flex size-14 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white">
                            <span className="material-symbols-outlined text-3xl">image</span>
                        </button>
                        <span className="text-xs font-medium text-white/90 uppercase tracking-widest">{t('qr.gallery')}</span>
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
                        <span className="text-xs font-medium text-white/90 uppercase tracking-widest">
                            {flashOn ? t('qr.flashOn') : t('qr.flashOff')}
                        </span>
                    </div>
                </div>
                <div className="w-32 h-1.5 bg-white/30 rounded-full" />
            </div>
        </div>
    );
}
