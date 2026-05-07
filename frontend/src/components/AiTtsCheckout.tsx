import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PayPalButtons } from '@paypal/react-paypal-js';
import apiClient, { getApiErrorMessage, paypalCaptureOrder, paypalCreateOrder } from '../services/api';

interface AiTtsCheckoutProps {
    amount: number;
    quotaPerPurchase: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AiTtsCheckout({ amount, quotaPerPurchase, onClose, onSuccess }: AiTtsCheckoutProps) {
    const [invoiceId, setInvoiceId] = useState('');
    const [partnerName, setPartnerName] = useState('');
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'confirm' | 'pay' | 'done'>('confirm');

    const handleStartPurchase = async () => {
        setError('');
        setPaying(true);
        try {
            const { data } = await apiClient.post<{ invoice_id: string; amount: number; partner_name?: string }>('/payments/ai-tts/');
            setInvoiceId(data.invoice_id);
            if (data.partner_name) setPartnerName(data.partner_name);
            setStep('pay');
        } catch (e) {
            setError(getApiErrorMessage(e, 'Không thể tạo đơn hàng AI TTS. Vui lòng thử lại.'));
        } finally {
            setPaying(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/20">
                            <span className="material-symbols-outlined text-lg text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                                record_voice_over
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Gemini TTS</p>
                            <p className="text-sm font-bold text-slate-900">Nạp {quotaPerPurchase} lượt sử dụng AI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {step === 'confirm' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <p className="text-sm font-bold text-slate-900">Gói lượt AI TTS</p>
                            <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
                                <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                                    Thêm {quotaPerPurchase} lượt tạo giọng đọc AI vào tài khoản
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                                    Cho phép chọn nhiều giọng điệu phong phú
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                                    Trừ lượt trực tiếp ngay trên giao diện
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <p className="text-sm font-medium text-slate-500">Phí thanh toán</p>
                            <p className="text-2xl font-black text-slate-900">{amount.toLocaleString('vi-VN')}₫</p>
                        </div>

                        <button
                            onClick={() => void handleStartPurchase()}
                            disabled={paying}
                            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-base font-bold text-white shadow-xl shadow-violet-500/20 transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
                        >
                            {paying ? (
                                <div className="size-5 rounded-full border-[2px] border-white border-t-transparent animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart_checkout</span>
                                    Mua gói ngay
                                </>
                            )}
                        </button>
                    </div>
                )}

                {step === 'pay' && invoiceId && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                            <p className="text-sm font-bold text-slate-700 mb-1">Thanh toán qua PayPal</p>
                            <p className="text-2xl font-black text-slate-900">{amount.toLocaleString('vi-VN')}₫</p>
                            {partnerName && <p className="mt-1 text-xs text-slate-500">{partnerName}</p>}
                        </div>

                        <div className={`rounded-2xl border ${paying ? 'border-slate-200 opacity-60 pointer-events-none' : 'border-slate-100'} bg-white p-2`}>
                            <PayPalButtons
                                disabled={paying}
                                style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
                                createOrder={async () => {
                                    setError('');
                                    return paypalCreateOrder(invoiceId);
                                }}
                                onApprove={async (data: { orderID?: string }) => {
                                    try {
                                        setPaying(true);
                                        setError('');
                                        await paypalCaptureOrder(String(data.orderID || ''), invoiceId);
                                        setStep('done');
                                        onSuccess();
                                    } catch (e) {
                                        setError(getApiErrorMessage(e, 'Không thể hoàn tất thanh toán. Vui lòng thử lại.'));
                                    } finally {
                                        setPaying(false);
                                    }
                                }}
                                onError={(err: unknown) => {
                                    console.error(err);
                                    setError('Không thể khởi tạo PayPal. Vui lòng thử lại.');
                                }}
                            />
                        </div>
                    </div>
                )}

                {step === 'done' && (
                    <div className="space-y-4 py-4 text-center">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 animate-bounce-in">
                            <span className="material-symbols-outlined text-3xl text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                            </span>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-900">Nạp lượt thành công!</p>
                            <p className="mt-1 text-sm text-slate-500">Bạn đã có thể sử dụng {quotaPerPurchase} lượt AI TTS ngay lập tức.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-12 w-full rounded-2xl bg-violet-600 text-sm font-bold text-white shadow-lg tap-scale"
                        >
                            Quay lại trang quản lý
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                        {error}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
