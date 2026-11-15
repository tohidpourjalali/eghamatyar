'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { BadgeCheck, CalendarDays, HousePlus, ShieldCheck, UserRound } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/PageStates';

type Profile = { id:string; first_name?:string; last_name?:string; mobile:string; role:string; is_host_approved?:boolean; national_code?:string; bio?:string };

export default function ProfilePage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', national_code: '', bio: '' });
  const [msg, setMsg] = useState(''); const [error, setError] = useState('');
  const [saving, setSaving] = useState(false); const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api.get('/auth/me').then(({data}) => {
      if(!active) return;
      setUser(data);
      setForm({ first_name:data.first_name||'', last_name:data.last_name||'', national_code:data.national_code||'', bio:data.bio||'' });
    }).catch((e) => { if(active) setError(e.response?.data?.detail || 'اطلاعات حساب بارگذاری نشد.'); })
      .finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  const save = async () => {
    setSaving(true); setMsg(''); setError('');
    try { await api.put('/auth/me/profile', form); setMsg('اطلاعات حساب با موفقیت ذخیره شد.'); setUser(user ? {...user,...form} : user); }
    catch (e: any) { setError(e.response?.data?.detail || 'ذخیرهٔ اطلاعات انجام نشد؛ دوباره تلاش کن.'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState label="در حال آماده‌سازی پنل کاربری…"/>;
  if (error && !user) return <main className="page-shell py-12"><ErrorState title="پنل کاربری باز نشد" description={error} onRetry={() => setRetry(v=>v+1)} href="/"/></main>;
  if (!user) return null;
  const isHost = user.role === 'host' || user.is_host_approved;
  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  const firstName = user.first_name || 'مسافر عزیز';

  return <main className="page-shell py-8 sm:py-12">
    <header className="relative overflow-hidden rounded-[30px] bg-[#382319] px-6 py-7 text-white shadow-warm sm:rounded-[36px] sm:px-10 sm:py-9"><div className="absolute -left-10 -top-14 h-56 w-56 rounded-full bg-brand/35 blur-3xl"/><div className="relative flex flex-wrap items-center justify-between gap-5"><div><p className="text-sm font-bold text-[#FFD0AC]">پنل کاربری اقامت‌یار</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">خوش آمدی، {firstName}</h1><p className="mt-2 text-sm text-white/75" dir="ltr">{user.mobile}</p></div><span className="grid h-16 w-16 place-items-center rounded-3xl border border-white/15 bg-white/10 text-[#FFE1C9]"><UserRound className="h-8 w-8"/></span></div></header>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <QuickAction href="/profile/trips" Icon={CalendarDays} title="سفرها و رزروها" body="وضعیت رزرو، پرداخت‌ها و جزئیات سفر را ببین."/>
      {isHost ? <QuickAction href="/host/dashboard" Icon={HousePlus} title="پنل میزبان" body="اقامتگاه‌ها، تقویم، رزروها و درآمدت را مدیریت کن."/> : <QuickAction href="/host/register" Icon={HousePlus} title="شروع میزبانی" body="مدارک و حساب بانکی را ثبت کن تا اقامتگاهت را معرفی کنی."/>}
      {isAdmin && <QuickAction href="/admin" Icon={ShieldCheck} title="پنل مدیریت" body="صف بررسی اقامتگاه‌ها و گزارش‌های پلتفرم."/>}
    </div>

    {error && <p role="alert" className="mt-5 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p>}
    {msg && <p role="status" className="mt-5 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">{msg}</p>}

    <section className="mt-7 rounded-[28px] border border-line bg-surface p-5 shadow-card sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-3"><div><p className="section-eyebrow">حساب تو</p><h2 className="mt-1 text-xl font-black text-ink">اطلاعات پروفایل</h2></div><span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent"><BadgeCheck className="h-4 w-4"/>{isHost?'میزبان تأییدشده':isAdmin?'مدیر':'مسافر اقامت‌یار'}</span></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileField label="نام" value={form.first_name} onChange={v=>setForm({...form,first_name:v})}/>
        <ProfileField label="نام خانوادگی" value={form.last_name} onChange={v=>setForm({...form,last_name:v})}/>
        <ProfileField label="کد ملی" value={form.national_code} onChange={v=>setForm({...form,national_code:v})} dir="ltr"/>
        <div className="sm:col-span-2"><label className="mb-2 block text-sm font-bold text-ink">دربارهٔ من</label><textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} rows={3} className="input-warm resize-y" placeholder="چند کلمه دربارهٔ خودت…"/></div>
      </div>
      <button onClick={save} disabled={saving} className="button-primary mt-5 w-full sm:w-auto">{saving?'در حال ذخیره…':'ذخیرهٔ تغییرات'}</button>
    </section>
    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-accent"/> اطلاعات رزرو و پرداخت فقط در حساب تو نمایش داده می‌شوند.</div>
  </main>;
}

function QuickAction({href,Icon,title,body}:{href:string;Icon:typeof CalendarDays;title:string;body:string}) { return <Link href={href} className="group rounded-3xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-warm"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-light text-brand"><Icon className="h-5 w-5"/></span><h2 className="mt-4 font-black text-ink">{title}</h2><p className="mt-1 text-sm leading-6 text-muted">{body}</p><span className="mt-3 inline-block text-xs font-black text-brand transition group-hover:translate-x-[-2px]">ورود به بخش ←</span></Link>; }
function ProfileField({label,value,onChange,dir}:{label:string;value:string;onChange:(value:string)=>void;dir?:'ltr'|'rtl'}) { return <div><label className="mb-2 block text-sm font-bold text-ink">{label}</label><input value={value} onChange={e=>onChange(e.target.value)} className="input-warm" dir={dir}/></div>; }
