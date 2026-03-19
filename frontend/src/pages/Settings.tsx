import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AppLayout from '../components/AppLayout';
import { SettingsSkeleton, staggerStyle } from '../components/Skeleton';
import { setPartnerAuthSession } from '../services/api';
import type { Language, VoiceRegion } from '../types';

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
    { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'zh', label: '中文', flag: '🇨🇳' },
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
    { value: 'ko', label: '한국어', flag: '🇰🇷' },
];

export default function Settings() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, dispatch } = useApp();
    const [language, setLanguage] = useState<Language>(user?.preferred_language || 'vi');
    const [voiceRegion, setVoiceRegion] = useState<VoiceRegion>(user?.preferred_voice_region || 'mien_nam');
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    const VOICE_REGIONS: { value: VoiceRegion; label: string; subtitle: string; icon: string }[] = [
        { value: 'mien_nam', label: t('settings.voiceSouth'), subtitle: t('settings.voiceSouthDesc'), icon: '🌴' },
        { value: 'mien_bac', label: t('settings.voiceNorth'), subtitle: t('settings.voiceNorthDesc'), icon: '🏔️' },
        { value: 'mien_trung', label: t('settings.voiceCentral'), subtitle: t('settings.voiceCentralDesc'), icon: '🏖️' },
    ];

    // Simulate load
    useState(() => {
        setTimeout(() => setLoading(false), 400);
    });

    const handleSave = () => {
        if (user) {
            dispatch({ type: 'SET_USER', payload: { ...user, preferred_language: language, preferred_voice_region: voiceRegion } });
        }
        localStorage.setItem('bcsd_language', language);
        localStorage.setItem('bcsd_voice_region', voiceRegion);
        // Change i18n language to reflect immediately
        i18n.changeLanguage(language);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleOpenPartnerPortal = () => {
        // Luôn hiển thị màn login/signup partner khi đi từ mục GÓC ĐỐI TÁC.
        setPartnerAuthSession(null);
        navigate('/partner/login?next=%2Fpartner');
    };

    const handleUserLogout = () => {
        localStorage.removeItem('bcsd_user_auth');
        dispatch({ type: 'CLEAR_USER' });
        navigate('/', { replace: true });
    };

    if (loading) {
        return (
            <AppLayout title={t('settings.title')}>
                <SettingsSkeleton />
            </AppLayout>
        );
    }

    return (
        <AppLayout title={t('settings.title')}>
            {/* User Card */}
            <div className="mx-4 mt-4 animate-fade-slide-up">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="size-14 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary\/20">
                        <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{t('settings.tourist')}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{user?.device_id?.slice(0, 20)}...</p>
                    </div>
                </div>
            </div>

            {/* Language Section */}
            <div className="mx-4 mt-5 animate-stagger-item" style={staggerStyle(0)}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{t('settings.language')}</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    {LANGUAGES.map((lang, i) => (
                        <button
                            key={lang.value}
                            onClick={() => setLanguage(lang.value)}
                            className={`w-full flex items-center justify-between p-4 tap-scale transition-all hover:bg-slate-50 ${i > 0 ? 'border-t border-slate-50' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{lang.flag}</span>
                                <span className={`text-sm font-semibold transition-colors ${language === lang.value ? 'text-primary' : 'text-slate-700'}`}>
                                    {lang.label}
                                </span>
                            </div>
                            {language === lang.value && (
                                <span className="material-symbols-outlined text-primary text-lg animate-pop-in" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Voice Region Section */}
            <div className="mx-4 mt-5 animate-stagger-item" style={staggerStyle(1)}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{t('settings.voiceRegion')}</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    {VOICE_REGIONS.map((vr, i) => (
                        <button
                            key={vr.value}
                            onClick={() => setVoiceRegion(vr.value)}
                            className={`w-full flex items-center justify-between p-4 tap-scale transition-all hover:bg-slate-50 ${i > 0 ? 'border-t border-slate-50' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{vr.icon}</span>
                                <div>
                                    <p className={`text-sm font-semibold text-left transition-colors ${voiceRegion === vr.value ? 'text-primary' : 'text-slate-700'}`}>
                                        {vr.label}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5 text-left">{vr.subtitle}</p>
                                </div>
                            </div>
                            {voiceRegion === vr.value && (
                                <span className="material-symbols-outlined text-primary text-lg animate-pop-in" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* App Info */}
            <div className="mx-4 mt-5 animate-stagger-item" style={staggerStyle(2)}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{t('settings.appInfo')}</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between p-4">
                        <span className="text-sm text-slate-600">{t('common.version')}</span>
                        <span className="text-sm text-slate-400 font-mono">1.0.0</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t border-slate-50">
                        <span className="text-sm text-slate-600">{t('settings.appName')}</span>
                        <span className="text-[10px] bg-primary\/10 text-primary px-2.5 py-0.5 rounded-full font-bold">Beta</span>
                    </div>
                </div>
            </div>

            {/* Partner Portal Entry */}
            <div className="mx-4 mt-5 animate-stagger-item" style={staggerStyle(3)}>
                <button
                    onClick={handleOpenPartnerPortal}
                    className="w-full overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-orange-50 via-amber-50 to-white p-4 text-left shadow-sm transition hover:shadow-md"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-primary/80">{t('partner.program')}</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">{t('partner.portalTitle')}</h3>
                            <p className="mt-1 text-xs text-slate-500">{t('partner.entryDescription')}</p>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Save Button */}
            <div className="mx-4 mt-6 mb-4 animate-stagger-item" style={staggerStyle(4)}>
                <button
                    onClick={handleSave}
                    className={`w-full py-4 rounded-2xl font-bold text-base tap-scale transition-all shadow-lg ${saved ? 'bg-green-500 text-white shadow-green-200 animate-bounce-in' : 'bg-primary text-white shadow-primary\/20 hover:shadow-xl'
                        }`}
                >
                    {saved ? t('common.saved') : t('common.save')}
                </button>

                <button
                    onClick={handleUserLogout}
                    className="mt-3 w-full rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                >
                    Đăng xuất tài khoản người dùng
                </button>
            </div>
        </AppLayout>
    );
}
