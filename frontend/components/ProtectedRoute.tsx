'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, clearTokens, getToken, removeStoredValue, setStoredValue } from '@/lib/api';
import { BadgeCheck, LoaderCircle, LockKeyhole, RefreshCw, ShieldAlert } from 'lucide-react';

type AuthUser = { role?: string; is_host_approved?: boolean; first_name?: string };
type Access = 'signed-in' | 'host' | 'admin';

export default function ProtectedRoute({ children, access = 'signed-in' }: { children: ReactNode; access?: Access }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const nextPath = `${pathname}${typeof window !== 'undefined' ? window.location.search : ''}`;
    const login = () => router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    if (!getToken()) { login(); return () => { active = false; }; }

    api.get('/auth/me').then(({ data }: { data: AuthUser }) => {
      if (!active) return;
      const role = data?.role;
      setStoredValue('user', JSON.stringify(data));
      window.dispatchEvent(new Event('auth-changed'));
      const isAdmin = role === 'admin' || role === 'super_admin';
      const isHost = role === 'host' || data?.is_host_approved === true;
      if (access === 'admin' && !isAdmin) {
        setMessage('این بخش فقط برای مدیران اقامت‌یار در دسترس است.'); setStatus('denied'); return;
      }
      if (access === 'host' && pathname !== '/host/register' && !isHost && !isAdmin) {
        setMessage('برای دسترسی به پنل میزبان، ابتدا فرایند ثبت‌نام و تأیید میزبانی را کامل کن.'); setStatus('denied'); return;
      }
      setStatus('allowed');
    }).catch((error: any) => {
      if (!active) return;
      if (error?.response?.status === 401) {
        clearTokens();
        removeStoredValue('user');
        login();
        return;
      }
      // Keep a valid mobile session when the network is temporarily unavailable;
      // allow a retry instead of silently clearing tokens and hiding the user's panel.
      setMessage('برای بررسی حساب اتصال برقرار نشد. اینترنت را بررسی کن و دوباره تلاش کن.');
      setStatus('error');
    });
    return () => { active = false; };
  }, [access, pathname, router, retry]);

  if (status === 'allowed') return <>{children}</>;
  if (status === 'denied') return <main className="page-shell flex min-h-[55vh] items-center justify-center py-14"><section className="w-full max-w-lg rounded-[28px] border border-line bg-surface p-7 text-center shadow-card sm:p-9"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-warning/15 text-brand"><ShieldAlert className="h-7 w-7"/></span><h1 className="mt-5 text-xl font-black text-ink">دسترسی محدود است</h1><p className="mt-2 text-sm leading-7 text-muted">{message}</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href={access === 'host' ? '/host/register' : '/'} className="button-primary"><BadgeCheck className="h-4 w-4"/>{access === 'host' ? 'تکمیل ثبت‌نام میزبان' : 'بازگشت به صفحهٔ اصلی'}</Link><Link href="/help" className="button-outline">راهنمای دسترسی</Link></div></section></main>;
  if (status === 'error') return <main className="page-shell flex min-h-[55vh] items-center justify-center py-14"><section role="alert" className="w-full max-w-lg rounded-[28px] border border-line bg-surface p-7 text-center shadow-card sm:p-9"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-light text-brand"><RefreshCw className="h-7 w-7"/></span><h1 className="mt-5 text-xl font-black text-ink">پنل موقتاً در دسترس نیست</h1><p className="mt-2 text-sm leading-7 text-muted">{message}</p><button onClick={() => { setStatus('checking'); setRetry((value) => value + 1); }} className="button-primary mt-6 w-full sm:w-auto"><RefreshCw className="h-4 w-4"/> تلاش دوباره</button></section></main>;
  return <main className="page-shell flex min-h-[55vh] items-center justify-center py-14"><div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-7 text-center shadow-card"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-light text-brand"><LockKeyhole className="h-6 w-6"/></span><LoaderCircle className="mx-auto mt-5 h-5 w-5 animate-spin text-brand"/><p className="mt-3 text-sm font-bold text-ink">در حال بررسی دسترسی امن…</p><p className="mt-1 text-xs text-muted">اگر وارد نشده باشی، به صفحهٔ ورود هدایت می‌شوی.</p></div></main>;
}
