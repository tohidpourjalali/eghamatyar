'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BadgeCheck, CheckCircle, Circle, Clock3, Landmark, LoaderCircle, ShieldCheck, Upload } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/PageStates';

const requiredDocs = [
  { key: 'national_card', label: 'کارت ملی' },
  { key: 'birth_certificate', label: 'شناسنامه' },
  { key: 'bank_card', label: 'کارت بانکی' },
];

export default function HostRegister() {
  const queryClient = useQueryClient();
  const [docType, setDocType] = useState('national_card');
  const [fileUrl, setFileUrl] = useState('');
  const [bank, setBank] = useState({ bank_name: '', sheba_number: '', owner_name: '' });
  const [msg, setMsg] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const userQuery = useQuery({ queryKey: ['current-user'], queryFn: async () => (await api.get('/auth/me')).data });
  const docsQuery = useQuery({ queryKey: ['host-documents'], queryFn: async () => (await api.get('/host/documents')).data });
  const accountsQuery = useQuery({ queryKey: ['host-bank-accounts'], queryFn: async () => (await api.get('/host/bank-accounts')).data });
  const refreshStatus = async () => { await Promise.all([userQuery.refetch(),docsQuery.refetch(),accountsQuery.refetch()]); };
  const invalidateStatus = async () => { await Promise.all([queryClient.invalidateQueries({queryKey:['current-user']}),queryClient.invalidateQueries({queryKey:['host-documents']}),queryClient.invalidateQueries({queryKey:['host-bank-accounts']})]); };
  const isApproved = Boolean(userQuery.data?.is_host_approved || userQuery.data?.role === 'host');
  const docs = docsQuery.data || [];
  const docsReady = requiredDocs.every(({key}) => docs.some((d:any) => d.document_type === key && d.status !== 'rejected'));
  const bankReady = (accountsQuery.data || []).length > 0;
  const stateLoading = userQuery.isLoading || docsQuery.isLoading || accountsQuery.isLoading;
  const stateError = userQuery.isError || docsQuery.isError || accountsQuery.isError;

  const uploadDoc = async () => {
    if (!fileUrl.trim()) { setError('پیوند فایل مدرک را وارد کن.'); return; }
    setSaving(true); setError(''); setMsg('');
    try {
      await api.post('/host/documents', { document_type: docType, file_url: fileUrl.trim() });
      setMsg('مدرک ثبت شد و برای بررسی ارسال شد.'); setFileUrl(''); await invalidateStatus();
    } catch (e: any) { setError(e.response?.data?.detail || 'ثبت مدرک انجام نشد؛ دوباره تلاش کن.'); }
    finally { setSaving(false); }
  };

  const addBank = async () => {
    setSaving(true); setError(''); setMsg('');
    try {
      await api.post('/host/bank-accounts', { ...bank, is_default: true });
      setMsg('حساب بانکی ثبت شد.'); await invalidateStatus();
    } catch (e: any) { setError(e.response?.data?.detail || 'ثبت حساب انجام نشد؛ نام بانک، صاحب حساب و شمارهٔ شبا را بررسی کن.'); }
    finally { setSaving(false); }
  };

  if (stateLoading) return <LoadingState label="در حال بررسی وضعیت ثبت‌نام میزبان…"/>;
  if (stateError) return <main className="page-shell py-12"><ErrorState title="وضعیت ثبت‌نام بارگذاری نشد" onRetry={refreshStatus} href="/profile"/></main>;

  return <main className="page-shell max-w-5xl py-8 sm:py-12">
    <header className="relative overflow-hidden rounded-[32px] bg-[#382319] px-6 py-8 text-white shadow-warm sm:px-10 sm:py-10"><div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-brand/40 blur-3xl"/><div className="relative flex flex-wrap items-center justify-between gap-5"><div><p className="text-sm font-bold text-[#FFD0AC]">میزبانی در اقامت‌یار</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{isApproved ? 'پنل میزبانت آماده است' : 'خانه‌ات را با مسافران شریک شو'}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">{isApproved ? 'احراز هویت کامل شده؛ اقامتگاه‌ها، تقویم، رزروها و درآمدت را از پنل میزبان مدیریت کن.' : 'ثبت‌نام، بارگذاری مدارک و بررسی وضعیتت را همین‌جا پیگیری کن. تا زمان تأیید مدارک، اقامتگاه جدید قابل انتشار نیست.'}</p></div><span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#FFE0C5]">{isApproved?<BadgeCheck className="h-7 w-7"/>:<HouseIcon/>}</span></div></header>

    {isApproved ? <section className="mt-6 rounded-3xl border border-accent/25 bg-accent/10 p-6"><p className="flex items-center gap-2 font-black text-ink"><CheckCircle className="h-5 w-5 text-accent"/> میزبان تأییدشده‌ای؛ پنلت فعال است.</p><p className="mt-2 text-sm leading-7 text-muted">اکنون می‌توانی اقامتگاه بسازی و درخواست‌های رزرو را پیگیری کنی.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/host/dashboard" className="button-primary"><Landmark className="h-4 w-4"/> ورود به پنل میزبان</Link><Link href="/host/accommodations/new" className="button-outline">ثبت اقامتگاه جدید</Link></div></section> : <>
      <section className="mt-6 rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="section-eyebrow">پیشرفت ثبت‌نام</p><h2 className="mt-1 text-lg font-black text-ink">سه مرحله تا فعال‌شدن پنل میزبان</h2></div><button onClick={refreshStatus} className="text-xs font-bold text-brand hover:underline">به‌روزرسانی وضعیت</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{[
          {title:'مدارک هویتی',done:docsReady, detail:`${docs.filter((d:any)=>d.status==='approved').length} از ۳ تأییدشده`},
          {title:'حساب بانکی',done:bankReady, detail:bankReady?'ثبت‌شده':'ثبت نشده'},
          {title:'تأیید نهایی',done:false, detail:docsReady&&bankReady?'در انتظار بررسی ادمین':'پس از تکمیل مدارک'},
        ].map(step=><div key={step.title} className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-4"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${step.done?'bg-accent/10 text-accent':'bg-brand-light text-brand'}`}>{step.done?<CheckCircle className="h-4 w-4"/>:<Clock3 className="h-4 w-4"/>}</span><div><p className="text-sm font-black text-ink">{step.title}</p><p className="mt-1 text-xs text-muted">{step.detail}</p></div></div>)}</div>
        <div className="mt-5 space-y-2">{requiredDocs.map(({key,label})=>{const docsForType=docs.filter((d:any)=>d.document_type===key);const latest=docsForType[docsForType.length-1];const status=latest?.status||'missing';return <div key={key} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm"><span className="flex items-center gap-2 text-ink">{status==='approved'?<CheckCircle className="h-4 w-4 text-accent"/>:status==='pending'?<Clock3 className="h-4 w-4 text-warning"/>:<Circle className="h-4 w-4 text-muted"/>}{label}</span><span className={`text-xs font-bold ${status==='approved'?'text-accent':status==='pending'?'text-muted':status==='rejected'?'text-error':'text-muted'}`}>{status==='approved'?'تأیید شد':status==='pending'?'در انتظار بررسی':status==='rejected'?'نیازمند ارسال دوباره':'ثبت نشده'}</span></div>})}</div>
      </section>

      {msg && <p role="status" className="mt-5 flex items-center gap-2 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent"><CheckCircle className="h-5 w-5"/>{msg}</p>}
      {error && <p role="alert" className="mt-5 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6"><h2 className="flex items-center gap-2 font-black text-ink"><Upload className="h-5 w-5 text-brand"/> بارگذاری مدرک</h2><p className="mt-2 text-xs leading-6 text-muted">برای بررسی هویت هر سه مدرک لازم است. مدارک را از مسیر امنی که پشتیبانی یا مدیر در اختیارت می‌گذارد ثبت کن.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">{requiredDocs.map(({key,label})=><button type="button" key={key} onClick={()=>setDocType(key)} className={`rounded-xl border px-2 py-3 text-xs font-bold transition ${docType===key?'border-brand bg-brand-light text-brand':'border-line text-muted hover:border-brand/40'}`}>{label}</button>)}</div>
          <label className="mt-4 block text-xs font-bold text-ink">پیوند فایل مدرک</label><input value={fileUrl} onChange={e=>setFileUrl(e.target.value)} placeholder="https://…" className="input-warm mt-2 text-left" dir="ltr"/>
          <button onClick={uploadDoc} disabled={saving} className="button-primary mt-4 w-full">{saving?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Upload className="h-4 w-4"/>}ثبت مدرک</button>
        </section>
        <section className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6"><h2 className="flex items-center gap-2 font-black text-ink"><Landmark className="h-5 w-5 text-brand"/> حساب بانکی تسویه</h2><p className="mt-2 text-xs leading-6 text-muted">حساب باید به نام خودت باشد؛ شبا با IR و ۲۴ رقم پس از آن وارد می‌شود.</p>
          <label className="mt-4 block text-xs font-bold text-ink">نام بانک</label><input value={bank.bank_name} onChange={e=>setBank({...bank,bank_name:e.target.value})} placeholder="مثلاً بانک ملی" className="input-warm mt-2"/>
          <label className="mt-3 block text-xs font-bold text-ink">شمارهٔ شبا</label><input value={bank.sheba_number} onChange={e=>setBank({...bank,sheba_number:e.target.value.toUpperCase()})} placeholder="IR000000000000000000000000" className="input-warm mt-2 text-left" dir="ltr"/>
          <label className="mt-3 block text-xs font-bold text-ink">نام صاحب حساب</label><input value={bank.owner_name} onChange={e=>setBank({...bank,owner_name:e.target.value})} placeholder="مطابق کارت ملی" className="input-warm mt-2"/>
          <button onClick={addBank} disabled={saving} className="button-primary mt-4 w-full"><Landmark className="h-4 w-4"/>ثبت حساب بانکی</button>
        </section>
      </div>
      <div className="mt-6 rounded-2xl border border-line bg-brand-light/35 p-4 text-sm leading-7 text-muted"><ShieldCheck className="mb-1 inline h-4 w-4 text-brand"/> بعد از تأیید هر سه مدرک، نقش میزبان فعال می‌شود و دکمهٔ ورود به پنل در هدر و همین صفحه نمایش داده خواهد شد. وضعیت را پس از بررسی با «به‌روزرسانی وضعیت» تازه کن.</div>
    </>}
    <div className="mt-5"><Link href="/profile" className="text-sm font-bold text-brand hover:underline">بازگشت به پنل کاربری</Link></div>
  </main>;
}

function HouseIcon(){return <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/><path d="M18 4h2"/></svg>}
