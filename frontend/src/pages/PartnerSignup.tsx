import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, isPartnerAuthenticated, signupPartner } from '../services/api';

const resolveNextPath = (nextParam: string | null): string => {
    if (!nextParam || !nextParam.startsWith('/')) return '/partner';
    return nextParam;
};

const guessUsernameFromEmail = (email: string): string => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) return normalized;
    return normalized.split('@')[0];
};

export default function PartnerSignup() {
    const navigate = useNavigate();
    const location = useLocation();

    const nextPath = useMemo(() => {
        const search = new URLSearchParams(location.search);
        return resolveNextPath(search.get('next'));
    }, [location.search]);

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    if (isPartnerAuthenticated()) {
        return <Navigate to={nextPath} replace />;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');

        if (password !== confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không khớp.');
            return;
        }

        setSubmitting(true);
        try {
            await signupPartner({
                email: email.trim(),
                username: username.trim(),
                password,
                password_confirm: confirmPassword,
            });
            navigate(nextPath, { replace: true });
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 px-5 py-8">
            <div className="pointer-events-none absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-[-80px] h-64 w-64 rounded-full bg-amber-400/30 blur-3xl" />

            <section className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/95 p-6 shadow-2xl backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Góc đối tác</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Tạo tài khoản Partner</h1>
                <p className="mt-2 text-sm text-slate-600">Đăng ký bằng email và mật khẩu để truy cập trang quản lý dành cho đối tác.</p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                const value = e.target.value;
                                setEmail(value);
                                if (!username.trim()) setUsername(guessUsernameFromEmail(value));
                            }}
                            required
                            autoComplete="email"
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                            placeholder="partner@example.com"
                        />
                    </label>

                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Tên tài khoản</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                            placeholder="partner_vinhkhanh"
                        />
                    </label>

                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Mật khẩu</span>
                        <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50 pr-2 focus-within:border-emerald-500">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
                                placeholder="Tối thiểu 8 ký tự"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-200"
                            >
                                {showPassword ? 'Ẩn' : 'Hiện'}
                            </button>
                        </div>
                    </label>

                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Xác nhận mật khẩu</span>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                            placeholder="Nhập lại mật khẩu"
                        />
                    </label>

                    {errorMessage && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-600">
                    Đã có tài khoản?{' '}
                    <Link
                        to={`/partner/login?next=${encodeURIComponent(nextPath)}`}
                        className="font-bold text-emerald-700 hover:text-emerald-600"
                    >
                        Đăng nhập
                    </Link>
                </p>

                <button
                    onClick={() => navigate('/settings')}
                    className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100"
                >
                    Quay lại cài đặt
                </button>
            </section>
        </div>
    );
}
