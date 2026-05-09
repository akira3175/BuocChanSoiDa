import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useTranslation } from 'react-i18next';
import AppLayout from '../components/AppLayout';
import { getApiErrorMessage, getInvoiceById, getInvoices, isUserAuthenticated, paypalCaptureOrder, paypalCreateOrder } from '../services/api';
import type { Invoice } from '../services/api';

type StatusFilter = 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';

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

function formatDateTime(iso: string | null | undefined, lang: string): string {
    if (!iso) return '—';
    const locale = lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : lang === 'en' ? 'en-US' : 'vi-VN';
    return new Date(iso).toLocaleString(locale, {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatDateShort(iso: string, lang: string): string {
    const locale = lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : lang === 'en' ? 'en-US' : 'vi-VN';
    return new Date(iso).toLocaleDateString(locale, {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

export default function InvoiceDetail() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
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

    const STATUS_TABS: { id: StatusFilter; label: string }[] = [
        { id: 'ALL', label: t('invoice.tabAll') },
        { id: 'SUCCESS', label: t('invoice.tabSuccess') },
        { id: 'PENDING', label: t('invoice.tabPending') },
        { id: 'FAILED', label: t('invoice.tabFailed') },
        { id: 'CANCELLED', label: t('invoice.tabCancelled') },
    ];

    const statusLabel = (status?: string) => {
        if (status === 'SUCCESS') return t('invoice.statusSuccess');
        if (status === 'PENDING') return t('invoice.statusPending');
        if (status === 'CANCELLED') return t('invoice.statusCancelled');
        if (status === 'FAILED') return t('invoice.statusFailed');
        return status ?? '—';
    };

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
        <AppLayout title={t('invoice.title')} showBack backPath="/settings">
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
                            {t('invoice.goBack')}
                        </button>
                    </div>
                ) : !isUserAuthenticated() ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
                        <div className="size-24 rounded-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center mb-5 animate-float">
                            <span className="material-symbols-outlined text-5xl text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2">{t('invoice.loginRequired')}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {t('invoice.loginDesc')}
                        </p>
                    </div>
                ) : allInvoices.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
                        <div className="size-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-5 animate-float">
                            <span className="material-symbols-outlined text-5xl text-slate-300" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2">{t('invoice.emptyTitle')}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {t('invoice.emptyDesc')}
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
                                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{t('invoice.summaryTitle')}</p>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-white/60 text-xs mb-1">{t('invoice.totalPaid')}</p>
                                        <p className="text-white text-2xl font-black">{totalSpent.toLocaleString('vi-VN')}₫</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/60 text-xs mb-1">{t('invoice.invoiceCount')}</p>
                                        <p className="text-white text-2xl font-black">{allInvoices.length}</p>
                                    </div>
                                </div>
                                {pendingCount > 0 && (
                                    <div className="mt-3 flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 rounded-lg px-3 py-2">
                                        <span className="material-symbols-outlined text-amber-300 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
                                        <p className="text-amber-200 text-xs font-semibold">{t('invoice.pendingAlert', { count: pendingCount })}</p>
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
                                    {t('invoice.emptyFilter')}
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
                                                <p className="text-xs text-slate-400 mt-0.5">{formatDateShort(inv.created_at, lang)}</p>
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
                                        <p className="text-sm font-bold text-slate-800">{t('invoice.detailTitle')}</p>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusBadgeClass(selectedInvoice.status)}`}>
                                        {statusLabel(selectedInvoice.status)}
                                    </span>
                                </div>

                                {/* Fields */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">{t('invoice.reason')}</p>
                                        <p className="text-sm font-bold text-slate-900">{selectedInvoice.reason}</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">{t('invoice.amount')}</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                                            {selectedInvoice.amount.toLocaleString('vi-VN')}
                                            <span className="text-lg ml-1 text-slate-500">₫</span>
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">{t('invoice.invoiceId')}</span>
                                            <span className="text-slate-700 font-mono text-[10px] max-w-[160px] truncate">{selectedInvoice.id}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">{t('invoice.transactionCode')}</span>
                                            <span className="text-slate-700 font-mono">{selectedInvoice.transaction_code || '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">{t('invoice.createdAt')}</span>
                                            <span className="text-slate-700">{formatDateTime(selectedInvoice.created_at, lang)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">{t('invoice.paidAt')}</span>
                                            <span className="text-slate-700">{formatDateTime(selectedInvoice.paid_at, lang)}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {selectedInvoice.status === 'SUCCESS' ? (
                                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                            <span className="material-symbols-outlined text-emerald-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            <span className="text-sm font-bold text-emerald-700">{t('invoice.paidSuccessLabel')}</span>
                                        </div>
                                    ) : selectedInvoice.status === 'PENDING' ? (
                                        <>
                                            <button
                                                onClick={() => setShowPayPanel(v => !v)}
                                                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 tap-scale shadow-sm shadow-primary/30"
                                            >
                                                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>payment</span>
                                                {showPayPanel ? t('invoice.hidePayment') : t('invoice.payNow')}
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
                                                            setError(t('invoice.paypalError'));
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="material-symbols-outlined text-slate-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                            <span className="text-sm font-semibold text-slate-500">
                                                {selectedInvoice.status === 'CANCELLED' ? t('invoice.cancelledLabel') : t('invoice.failedLabel')}
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
