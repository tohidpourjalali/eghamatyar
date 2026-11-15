'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, saveTokens, setStoredValue } from '@/lib/api';
import { normalizeIranianMobile, toEnglishDigits } from '@/lib/persian';
import Logo from '@/components/Logo';
import { ArrowRight, ArrowLeft, BadgeCheck, KeyRound, LoaderCircle, Phone, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  const requestOtp = async (event?: FormEvent) => {
    event?.preventDefault();
    const normalized = normalizeIranianMobile(mobile);
    if (!/^09\d{9}$/.test(normalized)) { setError('شمارهٔ موبایل معتبر وارد کن؛ مثل 09123456789.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/otp/request', { mobile: normalized });
      setMobile(normalized);
      if (res.data.dev_code) setDevCode(String(res.data.dev_code));
      setStep('code');
    } catch (e: any) { setError(e.response?.data?.detail || 'ارسال کد انجام نشد؛ اتصال اینترنت را بررسی و دوباره تلاش کن.'); }
    finally { setLoading(false); }
  };

  const verify = async (event?: FormEvent) => {
    event?.preventDefault();
    const normalizedCode = toEnglishDigits(code).replace(/\D/g, '');
    if (!/^\d{5}$/.test(normalizedCode)) { setError('کد تأیید باید ۵ رقم باشد.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/otp/verify', { mobile, code: normalizedCode });
      saveTokens(res.data.access_token, res.data.refresh_token);
      setStoredValue('user', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('auth-changed'));
      const next = new URLSearchParams(window.location.search).get('next');
      const role = res.data.user?.role;
      const isAdmin = role === 'admin' || role === 'super_admin';
      const isHost = role === 'host' || res.data.user?.is_host_approved === true;
      const home = isAdmin ? '/admin' : isHost ? '/host/dashboard' : '/profile';
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') && next !== '/login' ? next : null;
      const nextPath = safeNext?.split('?')[0] || '';
      // A guest who started at the host-onboarding page must land in their user dashboard
      // after signup; otherwise that page's host-only requests send them straight back to login.
      const requiresHost = nextPath === '/host' || nextPath.startsWith('/host/');
      const requiresAdmin = nextPath === '/admin' || nextPath.startsWith('/admin/');
      const destination = !safeNext || (requiresHost && !isHost) || (requiresAdmin && !isAdmin) ? home : safeNext;
      // Keep navigation in the same app session. The token store has local, session and
      // in-memory fallbacks so the protected layout can read it immediately on mobile.
      router.replace(destination);
    } catch (e: any) {
      if (e?.response) setError(e.response?.data?.detail || 'کد واردشده معتبر نیست یا منقضی شده است.');
      else setError('ارتباط با سرویس ورود قطع شد؛ اتصال اینترنت را بررسی و دوباره تلاش کن.');
    }
    finally { setLoading(false); }
  };

  return <main className="page-shell grid min-h-[76vh] items-center py-10 sm:py-16">
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-line bg-surface shadow-warm md:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-[570px] flex-col justify-between overflow-hidden bg-[#382319] p-10 text-white md:flex">
        <div className="absolute -left-16 -top-16 h-80 w-80 rounded-full bg-brand/40 blur-3xl"/><div className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-secondary/25 blur-3xl"/>
        <div className="relative"><Logo/><div className="mt-16 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur"><BadgeCheck className="h-4 w-4 text-[#80dbc6]"/> سفر با خیال آسوده</div><h1 className="mt-6 text-4xl font-black leading-[1.5]">برای سفر بعدی،<br/><span className="text-[#FFD0AC]">خوش آمدی خانه.</span></h1><p className="mt-4 max-w-sm text-sm leading-8 text-white/75">با یک کد کوتاه وارد شو و سفرها، رزروها و اقامتگاه‌های دلخواهت را یک‌جا مدیریت کن.</p></div>
        <div className="relative flex items-center gap-3 text-sm text-white/70"><ShieldCheck className="h-5 w-5 text-[#80dbc6]"/> ورود امن با کد یک‌بارمصرف</div>
      </section>
      <section className="flex items-center p-5 sm:p-9 md:p-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between"><Logo/><Link href="/help" className="text-xs font-bold text-muted hover:text-brand">راهنمای ورود</Link></div>
          <p className="section-eyebrow">ورود امن و سریع</p>
          <h2 className="mt-2 text-2xl font-black text-ink">{step === 'mobile' ? 'شمارهٔ موبایلت را وارد کن' : 'کد تأیید را وارد کن'}</h2>
          <p className="mt-2 text-sm leading-7 text-muted">{step === 'mobile' ? 'برای ورود یا ساخت حساب، یک کد یک‌بارمصرف برایت می‌فرستیم.' : <>کد پنج‌رقمی ارسال‌شده به <b dir="ltr" className="text-ink">{mobile}</b> را وارد کن.</>}</p>
          {error && <p role="alert" className="mt-5 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm leading-6 text-error">{error}</p>}
          {step === 'mobile' ? <form onSubmit={requestOtp} className="mt-7">
            <label htmlFor="mobile" className="mb-2 block text-sm font-bold text-ink">شمارهٔ موبایل</label>
            <div className="relative"><Phone className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/><input id="mobile" type="tel" autoComplete="tel-national" inputMode="tel" required value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="09123456789" className="input-warm pr-11 text-left" dir="ltr"/></div>
            <button type="submit" disabled={loading} className="button-primary mt-5 w-full py-3.5">{loading ? <><LoaderCircle className="h-4 w-4 animate-spin"/> در حال ارسال کد…</> : <>دریافت کد تأیید <ArrowLeft className="h-4 w-4"/></>}</button>
          </form> : <form onSubmit={verify} className="mt-7">
            <label htmlFor="otp" className="mb-2 block text-sm font-bold text-ink">کد تأیید پنج‌رقمی</label>
            <div className="relative"><KeyRound className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/><input id="otp" autoFocus autoComplete="one-time-code" inputMode="numeric" required value={code} onChange={(e) => setCode(toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0,5))} placeholder="•••••" maxLength={5} className="input-warm pr-11 text-center text-2xl tracking-[.5em]" dir="ltr"/></div>
            {devCode && <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-center text-xs text-text-secondary">حالت توسعه — کد تست: <b dir="ltr" className="text-ink">{devCode}</b></p>}
            <button type="submit" disabled={loading} className="button-primary mt-5 w-full py-3.5">{loading ? <><LoaderCircle className="h-4 w-4 animate-spin"/> در حال بررسی…</> : <>تأیید و ورود <ArrowLeft className="h-4 w-4"/></>}</button>
            <button type="button" onClick={() => {setStep('mobile');setCode('');setError('');}} className="button-outline mt-3 w-full py-3"><ArrowRight className="h-4 w-4"/> اصلاح شمارهٔ موبایل</button>
          </form>}
          <div className="mt-7 border-t border-line pt-5"><p className="text-xs leading-6 text-muted">با ادامه، <Link href="/terms" className="font-bold text-brand hover:underline">شرایط استفاده</Link> و <Link href="/privacy" className="font-bold text-brand hover:underline">حریم خصوصی</Link> اقامت‌یار را می‌پذیری.</p></div>
        </div>
      </section>
    </div>
  </main>;
}
