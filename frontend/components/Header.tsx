'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Menu, UserRound, LogOut, Sun, Moon, ChevronDown, Heart, CalendarDays, HousePlus, ShieldCheck } from 'lucide-react';
import { clearTokens, getStoredValue, removeStoredValue, setStoredValue } from '@/lib/api';
import Logo from '@/components/Logo';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      try { const value = getStoredValue('user'); setUser(value ? JSON.parse(value) : null); }
      catch { setUser(null); }
    };
    try {
      const saved = getStoredValue('theme');
      const initial = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(initial);
      document.documentElement.classList.toggle('dark', initial);
    } catch { /* retain accessible light defaults if local storage is blocked */ }
    syncUser();
    window.addEventListener('auth-changed', syncUser);
    return () => window.removeEventListener('auth-changed', syncUser);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    setStoredValue('theme', next ? 'dark' : 'light');
  };

  const logout = () => {
    clearTokens();
    removeStoredValue('user');
    setUser(null);
    setOpen(false);
    window.location.assign('/');
  };

  return <header className="sticky top-0 z-50 border-b border-line/80 bg-surface/85 backdrop-blur-xl">
    <div className="page-shell flex h-[72px] items-center justify-between gap-3">
      <Logo />
      <Link href="/search" className="hidden min-w-[260px] items-center justify-between gap-4 rounded-full border border-line bg-surface px-5 py-2.5 shadow-card transition hover:border-brand/40 hover:shadow-soft md:flex">
        <span className="text-sm font-bold text-ink">اقامتگاهت رو پیدا کن</span><span className="h-5 w-px bg-line"/><span className="text-xs text-muted">هرجا · هرزمان</span><span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white"><Search className="h-4 w-4"/></span>
      </Link>
      <nav className="hidden items-center gap-1 lg:flex">
        <Link href="/search" className={`rounded-full px-4 py-2 text-sm font-bold transition hover:bg-brand-light/60 ${pathname === '/search' ? 'text-brand' : 'text-muted'}`}>اقامتگاه‌ها</Link>
        <Link href="/blog" className="rounded-full px-4 py-2 text-sm font-bold text-muted transition hover:bg-brand-light/60 hover:text-ink">راهنمای سفر</Link>
      </nav>
      <div className="flex items-center gap-2">
        {user ? <Link href={user.role === 'admin' || user.role === 'super_admin' ? '/admin' : user.role === 'host' || user.is_host_approved ? '/host/dashboard' : '/profile'} className="hidden items-center rounded-full px-3 py-2 text-sm font-bold text-ink transition hover:bg-brand-light/60 sm:inline-flex">{user.role === 'admin' || user.role === 'super_admin' ? 'پنل مدیریت' : user.role === 'host' || user.is_host_approved ? 'پنل میزبان' : 'پنل کاربری'}</Link> : <Link href="/host/register" className="hidden rounded-full px-3 py-2 text-sm font-bold text-ink transition hover:bg-brand-light/60 sm:inline-flex">میزبان شوید</Link>}
        <button onClick={toggleTheme} aria-label={dark ? 'فعال‌کردن تم روشن' : 'فعال‌کردن تم تاریک'} title={dark ? 'تم روشن' : 'تم تاریک'} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted transition hover:border-brand/40 hover:text-brand">
          {dark ? <Sun className="h-[18px] w-[18px]"/> : <Moon className="h-[18px] w-[18px]"/>}
        </button>
        <div className="relative">
          <button aria-expanded={open} aria-label="باز کردن منوی حساب" onClick={() => setOpen(!open)} className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 shadow-card transition hover:shadow-soft">
            <Menu className="h-4 w-4 text-muted"/><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-light text-brand">{user?.first_name ? <b className="text-sm">{user.first_name[0]}</b> : <UserRound className="h-4 w-4"/>}</span><ChevronDown className={`hidden h-3.5 w-3.5 text-muted transition sm:block ${open ? 'rotate-180' : ''}`}/>
          </button>
          {open && <>
            <button aria-label="بستن منو" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)}/>
            <div className="absolute left-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-warm animate-fade-up">
              {user ? <>
                <div className="border-b border-line px-3 py-3"><p className="font-black text-ink">{user.first_name || 'مسافر عزیز'} {user.last_name || ''}</p><p className="mt-1 text-xs text-muted" dir="ltr">{user.mobile}</p></div>
                <MenuLink href="/profile/trips" icon={<CalendarDays className="h-4 w-4"/>}>سفرهای من</MenuLink>
                <MenuLink href="/profile" icon={<UserRound className="h-4 w-4"/>}>حساب کاربری</MenuLink>
                {user.role === 'host' || user.is_host_approved ? <MenuLink href="/host/dashboard" icon={<HousePlus className="h-4 w-4"/>}>پنل میزبان</MenuLink> : <MenuLink href="/host/register" icon={<HousePlus className="h-4 w-4"/>}>میزبان شوید</MenuLink>}
                {(user.role === 'admin' || user.role === 'super_admin') && <MenuLink href="/admin" icon={<ShieldCheck className="h-4 w-4"/>}>مدیریت اقامت‌یار</MenuLink>}
                <button onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-danger transition hover:bg-danger/10"><LogOut className="h-4 w-4"/> خروج از حساب</button>
              </> : <>
                <Link href="/login" className="block rounded-xl bg-brand px-3 py-3 text-sm font-black text-white transition hover:bg-brand-dark">ورود / ثبت‌نام</Link>
                <MenuLink href="/host/register" icon={<HousePlus className="h-4 w-4"/>}>میزبان شوید</MenuLink>
                <MenuLink href="/help" icon={<Heart className="h-4 w-4"/>}>راهنمای رزرو</MenuLink>
              </>}
            </div>
          </>}
        </div>
      </div>
    </div>
  </header>;
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-brand-light/60 hover:text-brand">{icon}{children}</Link>;
}
