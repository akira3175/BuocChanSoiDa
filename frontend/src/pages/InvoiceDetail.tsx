import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PayPalButtons } from '@paypal/react-paypal-js';
import AppLayout from '../components/AppLayout';
import { getApiErrorMessage, getInvoiceById, getInvoices, isUserAuthenticated, paypalCaptureOrder, paypalCreateOrder } from '../services/api';
import type { Invoice } from '../services/api';

type StatusFilter = 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'SUCCESS', label: 'Thành công' },
    { id: 'PENDING', label: 'Đang xử lý' },
    { id: 'FAILED', label: 'Thất bại' },
    { id: 'CANCELLED', label: 'Đã huỷ' },
];

function statusBadgeClass(status?: string) {
    if (status === 'SUCCESS') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'PENDING') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'CANCELLED') return 'bg-slate-50 text-slate-500 border-slate-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
}

function statusIcon(status?: string) {
    if (status === 'SUCCESS') return 'check_circle';
    if (status === 'PENDING') return 'pending';
    if (status === 'CANCELLED') return 'cancel';
    return 'error';
}

function statusIconColor(status?: string) {
    if (status === 'SUCCESS') return 'text-emerald-500';
    if (status === 'PENDING') return 'text-amber-500';
    if (status === 'CANCELLED') return 'text-slate-400';
    return 'text-rose-500';
}

function statusLabel(status?: string) {
    if (status === 'SUCCESS') return 'Thành công';
    if (status === 'PENDING') return 'Đang xử lý';
    if (status === 'CANCELLED') return 'Đã huỷ';
    if (status === 'FAILED') return 'Thất bại';
    return status ?? '—';
}

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatDateShort(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

export default function InvoiceDetail() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const invoiceIdParam = params.get('invoiceId') || '';

    const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [showPayPanel, setShowPayPanel] = useState(false);

    // Load data
    useEffect(() => {
        let alive = true;
        async function load() {
            if (!isUserAuthenticated()) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError('');

                if (invoiceIdParam) {
                    // Direct link to specific invoice
                    const [data, allData] = await Promise.all([
                        getInvoiceById(invoiceIdParam),
                        getInvoices(),
                    ]);
                    if (!alive) return;
                    setAllInvoices(allData);
                    setSelectedInvoice(data);
                } else {
                    const allData = await getInvoices();
                    if (!alive) return;
                    setAllInvoices(allData);
                    if (allData.length > 0) {
                        setSelectedInvoice(allData[0]);
                        setParams({ invoiceId: allData[0].id }, { replace: true });
                    }
                }
            } catch (e) {
                if (!alive) return;
                setError(getApiErrorMessage(e));
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, []);

    // Filtered list
    const filteredInvoices = useMemo(() => {
        if (statusFilter === 'ALL') return allInvoices;
        return allInvoices.filter(inv => inv.status === statusFilter);
    }, [allInvoices, statusFilter]);

    // Summary stats
    const totalSpent = useMemo(() =>
        allInvoices.filter(i => i.status === 'SUCCESS').reduce((s, i) => s + i.amount, 0),
        [allInvoices]
    );
    const pendingCount = allInvoices.filter(i => i.status === 'PENDING').length;

    const handleSelectInvoice = (inv: Invoice) => {
        setSelectedInvoice(inv);
        setParams({ invoiceId: inv.id }, { replace: true });
        setShowPayPanel(false);
        setError('');
    };

    return (
        <AppLayout title="Hóa đơn" showBack backPath="/settings">
            <div className="pb-6">
                {loading ? (
                    <div className="px-4 pt-4 space-y-3 animate-fade-in">
                        <div className="h-24 rounded-2xl skeleton" />
                        <div className="h-10 rounded-xl skeleton" />
                        <div className="h-16 rounded-2xl skeleton" />
                        <div className="h-16 rounded-2xl skeleton" />
                        <div className="h-16 rounded-2xl skeleton" />
                    </div>
                ) : error && allInvoices.length === 0 ? (
                    <div className="mx-4 mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-4">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-rose-500 text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                            <p className="text-sm text-rose-700 font-semibold flex-1">{error}</p>
                        </div>
                        <button
                            onClick={() => navigate('/settings')}
                            className="mt-3 w-full py-2 rounded-xl bg-rose-100 text-rose-700 text-sm font-bold"
                        >
                            Quay lại
                        </button>
                    </div>
                ) : !isUserAuthenticated() ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
                        <div className="size-24 rounded-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center mb-5 animate-float">
                            <span className="material-symbols-outlined text-5xl text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2">Vui lòng đăng nhập</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Bạn cần đăng nhập để xem lịch sử thanh toán.
                        </p>
                    </div>
                ) : allInvoices.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
                        <div className="size-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-5 animate-float">
                            <span className="material-symbols-outlined text-5xl text-slate-300" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2">Chưa có hóa đơn</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Hóa đơn của bạn sẽ xuất hiện ở đây sau khi thanh toán.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Summary Header ── */}
                        <div className="px-4 pt-4 animate-fade-slide-up">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 shadow-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="size-8 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                                    </div>
                                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Tổng quan hóa đơn</p>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-white/60 text-xs mb-1">Tổng đã thanh toán</p>
                                        <p className="text-white text-2xl font-black">{totalSpent.toLocaleString('vi-VN')}₫</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/60 text-xs mb-1">Số hóa đơn</p>
                                        <p className="text-white text-2xl font-black">{allInvoices.length}</p>
                                    </div>
                                </div>
                                {pendingCount > 0 && (
                                    <div className="mt-3 flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 rounded-lg px-3 py-2">
                                        <span className="material-symbols-outlined text-amber-300 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
                                        <p className="text-amber-200 text-xs font-semibold">{pendingCount} hóa đơn đang chờ thanh toán</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Status Filter Tabs ── */}
                        <div className="px-4 mt-4 animate-fade-slide-up">
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {STATUS_TABS.map(tab => {
                                    const count = tab.id === 'ALL'
                                        ? allInvoices.length
                                        : allInvoices.filter(i => i.status === tab.id).length;
                                    if (tab.id !== 'ALL' && count === 0) return null;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setStatusFilter(tab.id)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === tab.id
                                                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {tab.label} {count > 0 && `(${count})`}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Invoice List ── */}
                        <div className="px-4 mt-3 space-y-2 animate-fade-slide-up">
                            {filteredInvoices.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-sm">
                                    Không có hóa đơn nào trong trạng thái này.
                                </div>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <button
                                        key={inv.id}
                                        onClick={() => handleSelectInvoice(inv)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all tap-scale ${selectedInvoice?.id === inv.id
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Status Icon */}
                                            <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${inv.status === 'SUCCESS' ? 'bg-emerald-50'
                                                : inv.status === 'PENDING' ? 'bg-amber-50'
                                                    : inv.status === 'CANCELLED' ? 'bg-slate-50'
                                                        : 'bg-rose-50'
                                                }`}>
                                                <span
                                                    className={`material-symbols-outlined text-xl ${statusIconColor(inv.status)}`}
                                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                                >
                                                    {statusIcon(inv.status)}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{inv.reason}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{formatDateShort(inv.created_at)}</p>
                                            </div>

                                            {/* Amount + Badge */}
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-black text-slate-900">{inv.amount.toLocaleString('vi-VN')}₫</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass(inv.status)}`}>
                                                    {statusLabel(inv.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* ── Invoice Detail Panel ── */}
                        {selectedInvoice && (
                            <div className="mx-4 mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-slide-up">
                                {/* Panel Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`material-symbols-outlined text-xl ${statusIconColor(selectedInvoice.status)}`}
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            {statusIcon(selectedInvoice.status)}
                                        </span>
                                        <p className="text-sm font-bold text-slate-800">Chi tiết hóa đơn</p>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusBadgeClass(selectedInvoice.status)}`}>
                                        {statusLabel(selectedInvoice.status)}
                                    </span>
                                </div>

                                {/* Fields */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Lý do thanh toán</p>
                                        <p className="text-sm font-bold text-slate-900">{selectedInvoice.reason}</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Số tiền</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                                            {selectedInvoice.amount.toLocaleString('vi-VN')}
                                            <span className="text-lg ml-1 text-slate-500">₫</span>
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Mã hóa đơn</span>
                                            <span className="text-slate-700 font-mono text-[10px] max-w-[160px] truncate">{selectedInvoice.id}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Mã giao dịch</span>
                                            <span className="text-slate-700 font-mono">{selectedInvoice.transaction_code || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Ngày tạo</span>
                                            <span className="text-slate-700">{formatDateTime(selectedInvoice.created_at)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Thanh toán lúc</span>
                                            <span className="text-slate-700">{formatDateTime(selectedInvoice.paid_at)}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {selectedInvoice.status === 'SUCCESS' ? (
                                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                            <span className="material-symbols-outlined text-emerald-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            <span className="text-sm font-bold text-emerald-700">Đã thanh toán thành công</span>
                                        </div>
                                    ) : selectedInvoice.status === 'PENDING' ? (
                                        <>
                                            <button
                                                onClick={() => setShowPayPanel(v => !v)}
                                                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 tap-scale shadow-sm shadow-primary/30"
                                            >
                                                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>payment</span>
                                                {showPayPanel ? 'Ẩn thanh toán' : 'Thanh toán ngay'}
                                            </button>

                                            {showPayPanel && (
                                                <div className={`rounded-xl border ${paying ? 'border-slate-200 opacity-60 pointer-events-none' : 'border-slate-100'} p-2 bg-white animate-fade-slide-up`}>
                                                    <PayPalButtons
                                                        disabled={paying}
                                                        style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
                                                        createOrder={async () => {
                                                            if (!selectedInvoice) throw new Error('Missing invoice');
                                                            setError('');
                                                            const orderId = await paypalCreateOrder(selectedInvoice.id);
                                                            return orderId;
                                                        }}
                                                        onApprove={async (data: { orderID?: string }) => {
                                                            if (!selectedInvoice) return;
                                                            try {
                                                                setPaying(true);
                                                                setError('');
                                                                await paypalCaptureOrder(String(data.orderID || ''), selectedInvoice.id);
                                                                const refreshed = await getInvoiceById(selectedInvoice.id);
                                                                setSelectedInvoice(refreshed);
                                                                // Update in list
                                                                setAllInvoices(prev =>
                                                                    prev.map(inv => inv.id === refreshed.id ? refreshed : inv)
                                                                );
                                                                setShowPayPanel(false);
                                                            } catch (e) {
                                                                setError(getApiErrorMessage(e));
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
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="material-symbols-outlined text-slate-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                            <span className="text-sm font-semibold text-slate-500">
                                                {selectedInvoice.status === 'CANCELLED' ? 'Hóa đơn đã bị huỷ' : 'Thanh toán thất bại'}
                                            </span>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-start gap-2">
                                            <span className="material-symbols-outlined text-rose-500 text-base mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                            <p className="text-xs text-rose-700 font-semibold flex-1">{error}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
