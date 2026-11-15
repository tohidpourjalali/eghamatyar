'use client';
import InfoPage from '@/components/InfoPage';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Headset, Mail, Phone, ShieldAlert, Send, CheckCircle2 } from 'lucide-react';

export default function SupportPage() {
  const [topic,setTopic] = useState('booking');
  const [code,setCode] = useState('');
  useEffect(() => { setCode(new URLSearchParams(window.location.search).get('booking') || ''); }, []);
  const [message,setMessage] = useState('');
  const [sent,setSent] = useState(false);
  const submit = (e:React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`پشتیبانی اقامت‌یار | ${topic}${code ? ` | ${code}` : ''}`);
    const body = encodeURIComponent(`کد رزرو: ${code || 'ندارم'}\nموضوع: ${topic}\n\nشرح درخواست:\n${message}`);
    window.location.href = `mailto:support@eghamatyar.ir?subject=${subject}&body=${body}`;
    setSent(true);
  };
  return <InfoPage eyebrow="همراهِ سفر" title="چطور می‌توانیم کمکت کنیم؟" Icon={Headset} intro="برای موضوع‌های مربوط به رزرو، پرداخت یا میزبانی پیام بفرست. اگر سفر نزدیک است، کد رزرو را در پیام ذکر کن تا اطلاعات مرتبط را سریع‌تر پیدا کنیم.">
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <form onSubmit={submit} className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
        {sent&&<p className="mb-5 flex items-center gap-2 rounded-xl bg-accent/10 p-3 text-sm font-bold text-accent"><CheckCircle2 className="h-5 w-5"/> برنامهٔ ایمیل باز می‌شود؛ پیام را برای ارسال نهایی تأیید کن.</p>}
        <label className="mb-2 block text-sm font-black text-ink">موضوع درخواست</label><select value={topic} onChange={e=>setTopic(e.target.value)} className="input-warm mb-5"><option value="booking">رزرو و تغییرات سفر</option><option value="payment">پرداخت یا بازپرداخت</option><option value="host">میزبانی و اقامتگاه</option><option value="account">حساب کاربری</option><option value="other">موضوع دیگر</option></select>
        <label className="mb-2 block text-sm font-black text-ink">کد رزرو (در صورت وجود)</label><input value={code} onChange={e=>setCode(e.target.value)} placeholder="مثلاً EY-AB12CD34" className="input-warm mb-5" dir="ltr"/>
        <label className="mb-2 block text-sm font-black text-ink">شرح درخواست</label><textarea required minLength={12} rows={6} value={message} onChange={e=>setMessage(e.target.value)} placeholder="چه اتفاقی افتاده و چه کمکی نیاز داری؟ اطلاعات محرمانهٔ پرداخت را وارد نکن." className="input-warm resize-y"/>
        <button className="button-primary mt-5 w-full sm:w-auto"><Send className="h-4 w-4"/> آماده‌کردن پیام</button>
        <p className="mt-4 text-xs leading-6 text-muted">این فرم، متن ایمیل را آماده می‌کند؛ ارسال نهایی در برنامهٔ ایمیل خودت انجام می‌شود. اگر برنامهٔ ایمیل نداری، مستقیم به <a className="font-bold text-brand" href="mailto:support@eghamatyar.ir">support@eghamatyar.ir</a> پیام بده.</p>
      </form>
      <aside className="space-y-4">
        <div className="rounded-3xl border border-line bg-brand-light/40 p-5"><ShieldAlert className="h-6 w-6 text-brand"/><h2 className="!mt-3 !text-base">امنیت اطلاعاتت</h2><p className="!mt-2 !text-xs">رمز پویا، شمارهٔ کامل کارت یا رمز ورود را برای هیچ‌کس نفرست. پشتیبانی برای بررسی رزرو به کد رزرو نیاز دارد، نه اطلاعات ورود بانکی.</p></div>
        <a href="mailto:support@eghamatyar.ir" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/40"><Mail className="h-5 w-5 text-brand"/><div><p className="text-xs font-bold text-muted">ایمیل</p><p className="text-sm font-black text-ink">support@eghamatyar.ir</p></div></a>
        <a href="tel:02191000000" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/40"><Phone className="h-5 w-5 text-brand"/><div><p className="text-xs font-bold text-muted">تلفن</p><p className="text-sm font-black text-ink" dir="ltr">۰۲۱-۹۱۰۰۰۰۰۰</p></div></a>
        <p className="px-1 text-xs leading-6 text-muted">پیش از تماس، <Link href="/help" className="font-bold text-brand hover:underline">سؤالات پرتکرار</Link> را ببین؛ شاید پاسخ فوری همان‌جا باشد.</p>
      </aside>
    </div>
  </InfoPage>;
}
