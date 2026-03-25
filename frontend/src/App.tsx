import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { AppProvider } from './context/AppContext';
import PageTransition from './components/PageTransition';
import RequirePartnerAuth from './components/RequirePartnerAuth';
import SplashScreen from './pages/SplashScreen';
import './index.css';

// Lazy load các pages (code-splitting)
const MapExplore = lazy(() => import('./pages/MapExplore'));
const GuidedTour = lazy(() => import('./pages/GuidedTour'));
const OfflineDownload = lazy(() => import('./pages/OfflineDownload'));
const Settings = lazy(() => import('./pages/Settings'));
const UserAuth = lazy(() => import('./pages/UserAuth'));
const PartnerPortal = lazy(() => import('./pages/PartnerPortal'));
const PartnerLogin = lazy(() => import('./pages/PartnerLogin'));
const PartnerSignup = lazy(() => import('./pages/PartnerSignup'));
const DemoQR = lazy(() => import('./pages/DemoQR'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));

function LazyFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background-light">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="size-12 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400 font-medium">{t('common.loading')}</p>
      </div>
    </div>
  );
}

export default function App() {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
  // Use USD since PayPal sandbox often rejects VND; you can change to 'VND' if your account supports it
  const paypalCurrency = 'USD';

  return (
    <AppProvider>
      <PayPalScriptProvider options={{ 'client-id': paypalClientId, currency: paypalCurrency }}>
        <BrowserRouter>
          <div className="min-h-dvh bg-background-light">
            <Suspense fallback={<LazyFallback />}>
              <PageTransition>
                <Routes>
                  <Route path="/" element={<UserAuth />} />
                  <Route path="/splash" element={<SplashScreen />} />
                  <Route path="/map" element={<MapExplore />} />
                  <Route path="/tours" element={<GuidedTour />} />
                  <Route path="/offline" element={<OfflineDownload />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/invoice" element={<InvoiceDetail />} />
                  <Route path="/partner/login" element={<PartnerLogin />} />
                  <Route path="/partner/signup" element={<PartnerSignup />} />
                  <Route path="/partner" element={<RequirePartnerAuth><PartnerPortal /></RequirePartnerAuth>} />
                  <Route path="/demo-qr" element={<DemoQR />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </PageTransition>
            </Suspense>
          </div>
        </BrowserRouter>
      </PayPalScriptProvider>
    </AppProvider>
  );
}
