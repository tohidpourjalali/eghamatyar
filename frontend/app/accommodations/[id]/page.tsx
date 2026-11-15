'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import PersianDatePicker from '@/components/PersianDatePicker';
import { Star, Users, BedDouble, Bath, Wifi, Zap, ShieldCheck, CalendarDays, Share2, Heart, BadgeCheck, MapPin, Car, Waves, Check, ChevronLeft, Sparkles } from 'lucide-react';
import { formatToman, getTehranToday, toPersianDigits, CANCELLATION_LABELS } from '@/lib/persian';
import Link from 'next/link';
import { ErrorState } from '@/components/PageStates';

const iranPhoto = (acc: any) => {
  const text = `${acc?.title||''} ${acc?.city?.name||''} ${acc?.type?.name||''}`;
  if (/کیش|قشم|ساحل|دریا|جنوب/.test(text)) return ['/images/kish-villa.jpg','/images/mazandaran-villa.jpg','/images/yazd-courtyard.jpg','/images/gilan-eco-lodge.jpg'];
  if (/یزد|کویر|کاشان|سنتی|بوم/.test(text)) return ['/images/yazd-courtyard.jpg','/images/gilan-eco-lodge.jpg','/images/mazandaran-villa.jpg','/images/kish-villa.jpg'];
  if (/ماسوله|گیلان|رشت|کلبه/.test(text)) return ['/images/gilan-eco-lodge.jpg','/images/mazandaran-villa.jpg','/images/yazd-courtyard.jpg','/images/kish-villa.jpg'];
  return ['/images/mazandaran-villa.jpg','/images/gilan-eco-lodge.jpg','/images/yazd-courtyard.jpg','/images/kish-villa.jpg'];
};

export default function AccommodationDetail() {
  const params = useParams(); const router = useRouter(); const id = params.id as string;
  const [checkIn, setCheckIn] = useState(''); const [checkOut, setCheckOut] = useState(''); const [adults, setAdults] = useState(2);
  const [quote, setQuote] = useState<any>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [discount, setDiscount] = useState(''); const [fav, setFav] = useState(false); const [activePhoto, setActivePhoto] = useState(0);

  const { data: acc, isLoading, isError: accError, refetch: refetchAcc } = useQuery({ queryKey: ['acc', id], queryFn: async () => (await api.get(`/accommodations/${id}`)).data });
  const { data: reviews = [], isError: reviewsError, refetch: refetchReviews } = useQuery({ queryKey: ['acc-reviews', id], queryFn: async () => (await api.get(`/accommodations/${id}/reviews`)).data, enabled: !!acc });
  const photos = iranPhoto(acc);
  const availableImages: string[] = Array.from(new Set((acc?.images || [])
    .filter((image: any) => image?.url)
    .sort((a: any, b: any) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)))
    .map((image: any) => image.url)));
  const gallery = availableImages.length ? availableImages.slice(0, 5) : photos;
  const minDate = getTehranToday();

  const fetchQuote = async () => {
    if (!checkIn || !checkOut) { setError('برای دیدن قیمت نهایی، تاریخ ورود و خروج را انتخاب کن.'); return; }
    if (checkOut <= checkIn) { setError('تاریخ خروج باید بعد از ورود باشد.'); return; }
    setLoading(true); setError('');
    try { const res = await api.post(`/accommodations/${id}/price-quote`, { check_in: checkIn, check_out: checkOut, adults, discount_code: discount || undefined }); setQuote(res.data); }
    catch (e:any) { setError(e.response?.data?.detail || 'محاسبهٔ قیمت انجام نشد.'); setQuote(null); }
    finally { setLoading(false); }
  };

  const bookNow = async () => {
if (!getToken()) { const next = `${window.location.pathname}${window.location.search}`; router.push(`/login?next=${encodeURIComponent(next)}`); return; }
    try { const res = await api.post('/bookings', { accommodation_ids: [id], check_in: checkIn, check_out: checkOut, adults, discount_code: discount || undefined }); router.push(`/checkout/${res.data.id}`); }
    catch (e:any) { setError(e.response?.data?.detail || 'ثبت رزرو انجام نشد. دوباره تلاش کن.'); }
  };

  const share = async () => { try { if (navigator.share) await navigator.share({ title: acc.title, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); alert('پیوند اقامتگاه کپی شد.'); } } catch {} };
  const favorite = async () => { if (!getToken()) { const next = `${window.location.pathname}${window.location.search}`; router.push(`/login?next=${encodeURIComponent(next)}`); return; } try { const res=await api.post(`/accommodations/${id}/favorite`); setFav(res.data.is_favorite); } catch { setError('ذخیره‌کردن این اقامتگاه انجام نشد؛ دوباره وارد حساب شو.'); } };

  if (isLoading) return <div className="page-shell py-8"><div className="skeleton h-8 w-1/2 rounded-xl"/><div className="skeleton mt-6 h-[380px] rounded-3xl"/><div className="mt-6 grid gap-6 lg:grid-cols-3"><div className="skeleton h-72 rounded-3xl lg:col-span-2"/><div className="skeleton h-96 rounded-3xl"/></div></div>;
  if (accError) return <div className="page-shell py-12"><ErrorState title="اقامتگاه بارگذاری نشد" description="ممکن است اتصال موقتاً قطع شده باشد." onRetry={() => refetchAcc()} href="/search"/></div>;
  if (!acc) return <div className="page-shell py-24 text-center"><p className="text-2xl font-black">اقامتگاه پیدا نشد</p><p className="mt-2 text-sm text-muted">پیوند ممکن است قدیمی باشد یا این اقامتگاه دیگر در دسترس نباشد.</p><Link className="button-outline mt-5" href="/search">بازگشت به جستجو</Link></div>;

  return <div className="page-shell pb-28 pt-6 sm:pb-14 sm:pt-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-muted"><Link href="/search" className="hover:text-brand">اقامتگاه‌ها</Link><ChevronLeft className="h-3.5 w-3.5"/><span>{acc.city?.name || 'ایران'}</span></div><h1 className="text-2xl font-black text-ink sm:text-3xl">{acc.title}</h1><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted"><span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand"/>{acc.city?.name || 'ایران'}{acc.address ? `، ${acc.address}` : ''}</span>{Number(acc.reviews_count)>0 && <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning"/>{toPersianDigits(acc.rating_avg)} ({toPersianDigits(acc.reviews_count)} نظر)</span>}<span className="inline-flex items-center gap-1 text-accent"><BadgeCheck className="h-4 w-4"/> بررسی‌شده توسط اقامت‌یار</span></div></div>
      <div className="flex gap-2"><button onClick={share} className="button-outline !rounded-full !px-3 !py-2 text-xs"><Share2 className="h-4 w-4"/> اشتراک‌گذاری</button><button onClick={favorite} className={`button-outline !rounded-full !px-3 !py-2 text-xs ${fav?'!text-brand':''}`}><Heart className={`h-4 w-4 ${fav?'fill-brand':''}`}/> ذخیره</button></div>
    </div>

    <div className="relative mt-5 grid h-[300px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[26px] sm:h-[420px] sm:rounded-[32px]">
      {gallery.slice(0,5).map((src:string,i:number)=><button key={`${src}-${i}`} onClick={()=>setActivePhoto(i)} className={`relative overflow-hidden bg-brand-light ${i===0?'col-span-2 row-span-2':''} ${i>2?'hidden sm:block':''}`}><img src={src} alt={`${acc.title}، تصویر ${toPersianDigits(i+1)}`} className={`h-full w-full object-cover transition duration-500 hover:scale-[1.04] ${activePhoto===i?'':'brightness-[.97]'}`} loading={i===0?'eager':'lazy'}/>{i===4&&<span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-2 text-xs font-bold text-ink backdrop-blur">همهٔ عکس‌ها</span>}</button>)}
      <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-2 text-xs font-black text-ink shadow-card backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-brand"/> یک گوشهٔ دنج از ایران</span>
    </div>

    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_370px] xl:gap-12">
      <div className="min-w-0">
        <section className="flex items-center justify-between border-b border-line pb-6">
          <div><h2 className="text-xl font-black text-ink">اقامت در {acc.city?.name || 'ایران'}</h2><p className="mt-2 text-sm text-muted">{toPersianDigits(acc.max_capacity)} مهمان · {toPersianDigits(acc.bedrooms_count)} اتاق‌خواب · {toPersianDigits(acc.beds_count)} تخت · {toPersianDigits(acc.bathrooms_count)} حمام</p></div><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-light text-lg font-black text-brand">ا</span>
        </section>
        <section className="grid gap-4 border-b border-line py-6 sm:grid-cols-2">
          <Feature Icon={ShieldCheck} title="رزرو قابل اعتماد" body="جزئیات اقامت و قوانین پیش از پرداخت روشن است."/>
          <Feature Icon={CalendarDays} title="ورود و خروج" body={`ورود از ${acc.check_in_time} · خروج تا ${acc.check_out_time}`}/>
          <Feature Icon={Zap} title={acc.is_instant_booking?'رزرو آنی':'درخواست رزرو'} body={acc.is_instant_booking?'بدون انتظار برای تأیید میزبان.':'پاسخ میزبان حداکثر تا ۲۴ ساعت.'}/>
          <Feature Icon={Users} title="مناسب برای جمع شما" body={`ظرفیت استاندارد ${toPersianDigits(acc.standard_capacity)} نفر، حداکثر ${toPersianDigits(acc.max_capacity)} نفر.`}/>
        </section>
        <section className="border-b border-line py-6"><h2 className="text-lg font-black text-ink">دربارهٔ این اقامتگاه</h2><p className="mt-3 whitespace-pre-line text-sm leading-8 text-muted">{acc.description || 'جزئیات بیشتری دربارهٔ این اقامتگاه به‌زودی اضافه می‌شود.'}</p><div className="mt-4 flex flex-wrap gap-2">{acc.allow_pets&&<span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">حیوان خانگی مجاز</span>}{acc.smoking_allowed&&<span className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-bold text-brand">سیگار مجاز</span>}{acc.allow_parties&&<span className="rounded-full bg-warning/15 px-3 py-1.5 text-xs font-bold text-muted">مناسب دورهمی</span>}</div></section>
        <section className="border-b border-line py-6"><h2 className="text-lg font-black text-ink">امکانات اقامتگاه</h2><div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">{(acc.amenities||[]).map((a:string,i:number)=><span key={a} className="flex items-center gap-2 text-sm text-muted">{i%4===0?<Wifi className="h-4 w-4 text-brand"/>:i%4===1?<BedDouble className="h-4 w-4 text-brand"/>:i%4===2?<Car className="h-4 w-4 text-brand"/>:<Waves className="h-4 w-4 text-brand"/>}{a}</span>)}</div><div className="mt-5 flex flex-wrap gap-5 border-t border-line pt-4 text-xs font-semibold text-muted"><span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4"/>{toPersianDigits(acc.bedrooms_count)} اتاق‌خواب</span><span className="inline-flex items-center gap-1.5"><Bath className="h-4 w-4"/>{toPersianDigits(acc.bathrooms_count)} حمام</span><span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4"/>تا {toPersianDigits(acc.max_capacity)} مهمان</span></div></section>
        <section className="border-b border-line py-6"><h2 className="text-lg font-black text-ink">موقعیت</h2><p className="mt-2 flex items-start gap-2 text-sm leading-7 text-muted"><MapPin className="mt-1 h-4 w-4 shrink-0 text-brand"/>{acc.address || `نشانی دقیق ${acc.city?.name || 'اقامتگاه'} پس از تأیید رزرو برای مهمان نمایش داده می‌شود.`}</p>{acc.latitude&&acc.longitude&&<a href={`https://neshan.org/maps/@${acc.latitude},${acc.longitude},15z`} target="_blank" rel="noreferrer" className="mt-4 flex h-44 items-center justify-center overflow-hidden rounded-3xl border border-line bg-[radial-gradient(circle_at_25%_30%,rgb(var(--accent)/.15),transparent_35%),linear-gradient(135deg,rgb(var(--primary-soft)),rgb(var(--background)))]"><span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-ink shadow-card"><MapPin className="h-4 w-4 text-brand"/> مشاهدهٔ محدوده در نقشهٔ نشان</span></a>}</section>
        <section className="border-b border-line py-6"><h2 className="text-lg font-black text-ink">قوانین اقامت و لغو</h2><div className="mt-4 rounded-2xl bg-brand-light/45 p-4"><p className="font-bold text-ink">{CANCELLATION_LABELS[acc.cancellation_policy] || acc.cancellation_policy}</p><p className="mt-1 text-xs leading-6 text-muted">سیاست و جزئیات آن هنگام رزرو ثبت می‌شود؛ در صورت لغو، همان نسخهٔ ثبت‌شده مبنای محاسبهٔ بازپرداخت خواهد بود.</p></div></section>
        <section className="py-6"><div className="flex items-end justify-between"><div><h2 className="text-lg font-black text-ink">نظر مسافران</h2><p className="mt-1 text-xs text-muted">نظرها پس از اقامت واقعی منتشر می‌شوند.</p></div>{reviews.length>0&&<span className="inline-flex items-center gap-1 text-sm font-bold text-ink"><Star className="h-4 w-4 fill-warning text-warning"/>{toPersianDigits(acc.rating_avg)}</span>}</div>
          {reviewsError ? <div className="mt-4"><ErrorState title="نظرها در دسترس نیستند" description="می‌توانی صفحه را دوباره بارگذاری کنی." onRetry={() => refetchReviews()}/></div> : reviews.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{reviews.slice(0,4).map((r:any)=><div key={r.id} className="rounded-2xl border border-line bg-surface p-4"><div className="flex items-center justify-between"><b className="text-sm text-ink">{r.guest_name}</b><span className="flex items-center gap-1 text-xs font-bold"><Star className="h-3.5 w-3.5 fill-warning text-warning"/>{toPersianDigits(r.rating)}</span></div><p className="mt-2 text-sm leading-7 text-muted">{r.comment}</p>{r.host_reply&&<p className="mt-3 border-r-2 border-brand pr-3 text-xs leading-6 text-muted">پاسخ میزبان: {r.host_reply}</p>}</div>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-line p-5 text-sm text-muted">هنوز نظری برای این اقامتگاه ثبت نشده است. پس از سفر، تجربه‌ات را با مسافران بعدی به اشتراک بگذار.</div>}
        </section>
      </div>

      <aside className="hidden lg:block"><BookingBox acc={acc} checkIn={checkIn} setCheckIn={setCheckIn} checkOut={checkOut} setCheckOut={setCheckOut} adults={adults} setAdults={setAdults} quote={quote} discount={discount} setDiscount={setDiscount} error={error} loading={loading} minDate={minDate} fetchQuote={fetchQuote} bookNow={bookNow}/></aside>
    </div>
    <div className="fixed inset-x-0 bottom-[64px] z-30 border-t border-line bg-surface/95 p-3 shadow-warm backdrop-blur-lg lg:hidden"><div className="mx-auto flex max-w-2xl items-center justify-between gap-3"><div><p className="font-black text-ink">{formatToman(acc.base_price)} <span className="text-xs font-medium text-muted">/ شب</span></p><button onClick={()=>document.getElementById('mobile-booking')?.scrollIntoView({behavior:'smooth'})} className="text-xs font-bold text-brand">انتخاب تاریخ</button></div><button onClick={quote?bookNow:fetchQuote} disabled={loading} className="button-primary min-w-[150px]">{loading?'در حال بررسی…':quote?'ادامهٔ رزرو':'محاسبهٔ قیمت'}</button></div></div>
    <div id="mobile-booking" className="mt-6 lg:hidden"><BookingBox acc={acc} checkIn={checkIn} setCheckIn={setCheckIn} checkOut={checkOut} setCheckOut={setCheckOut} adults={adults} setAdults={setAdults} quote={quote} discount={discount} setDiscount={setDiscount} error={error} loading={loading} minDate={minDate} fetchQuote={fetchQuote} bookNow={bookNow}/></div>
  </div>;
}

function Feature({Icon,title,body}:{Icon:any;title:string;body:string}) { return <div className="flex gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand"/><div><h3 className="text-sm font-black text-ink">{title}</h3><p className="mt-1 text-xs leading-6 text-muted">{body}</p></div></div>; }

function BookingBox({acc,checkIn,setCheckIn,checkOut,setCheckOut,adults,setAdults,quote,discount,setDiscount,error,loading,minDate,fetchQuote,bookNow}:any) {
  return <div className="rounded-[28px] border border-line bg-surface p-5 shadow-warm lg:sticky lg:top-24">
    <div className="flex items-end justify-between"><p><b className="text-2xl font-black text-ink">{formatToman(acc.base_price)}</b><span className="mr-1 text-xs text-muted">/ شب</span></p>{Number(acc.reviews_count)>0&&<span className="flex items-center gap-1 text-xs font-bold"><Star className="h-3.5 w-3.5 fill-warning text-warning"/>{toPersianDigits(acc.rating_avg)}</span>}</div>
    <div className="mt-4 grid grid-cols-2 overflow-visible rounded-2xl border border-line"><div className="min-w-0 p-3"><span className="mb-2 block text-[10px] font-black text-muted">ورود</span><PersianDatePicker ariaLabel="تاریخ ورود" value={checkIn} minDate={minDate} onChange={date=>{setCheckIn(date);if(checkOut&&date>=checkOut)setCheckOut('');}} className="w-full"/></div><div className="min-w-0 border-r border-line p-3"><span className="mb-2 block text-[10px] font-black text-muted">خروج</span><PersianDatePicker ariaLabel="تاریخ خروج" value={checkOut} minDate={checkIn||minDate} onChange={setCheckOut} className="w-full"/></div><label className="col-span-2 flex items-center justify-between border-t border-line px-3 py-2.5"><span className="text-xs font-black">مهمانان</span><select value={adults} onChange={e=>setAdults(Number(e.target.value))} className="bg-transparent text-sm font-bold text-ink outline-none">{Array.from({length:Math.max(1,Math.min(10,acc.max_capacity||10))},(_,i)=>i+1).map(n=><option key={n} value={n}>{toPersianDigits(n)} نفر</option>)}</select></label></div>
    <div className="mt-3 flex gap-2"><input value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="کد تخفیف" className="input-warm min-w-0 text-xs"/><button onClick={fetchQuote} disabled={loading} className="rounded-xl border border-line px-3 text-xs font-bold text-brand hover:bg-brand-light">اعمال</button></div>
    {error&&<p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs leading-6 text-danger">{error}</p>}
    {!quote ? <button onClick={fetchQuote} disabled={loading} className="button-primary mt-4 w-full">{loading?'در حال بررسی…':acc.is_instant_booking?'بررسی قیمت و رزرو آنی':'بررسی قیمت و درخواست رزرو'}</button> : <div className="mt-4 space-y-3 text-xs">
      <div className="flex justify-between text-muted"><span>{formatToman(quote.base_amount)} · {toPersianDigits(quote.nights)} شب</span><span>اقامت</span></div><div className="flex justify-between text-muted"><span>{formatToman(quote.cleaning_fee)}</span><span>نظافت</span></div>{quote.extra_guest_amount>0&&<div className="flex justify-between text-muted"><span>{formatToman(quote.extra_guest_amount)}</span><span>مهمان اضافه</span></div>}{quote.discount_amount>0&&<div className="flex justify-between font-bold text-accent"><span>− {formatToman(quote.discount_amount)}</span><span>تخفیف</span></div>}
      <div className="flex justify-between border-t border-line pt-3 text-sm font-black text-ink"><span>جمع کل</span><span>{formatToman(quote.total_amount)}</span></div><div className="flex justify-between font-bold text-brand"><span>بیعانه ({toPersianDigits(quote.prepayment_percent)}٪)</span><span>{formatToman(quote.prepayment_amount)}</span></div><div className="flex justify-between text-muted"><span>باقیمانده تا ۳ روز قبل از ورود</span><span>{formatToman(quote.remaining_amount)}</span></div>
      <div className="flex gap-2 rounded-xl bg-accent/10 p-3 text-[10px] leading-5 text-muted"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"/><span>کارمزد پلتفرم در سهم میزبان محاسبه شده و هزینهٔ اضافه‌ای به مبلغ مهمان افزوده نمی‌شود.</span></div>
      <button onClick={bookNow} className="button-primary w-full">{acc.is_instant_booking?'ادامه به پرداخت بیعانه':'ثبت درخواست رزرو'}</button><p className="text-center text-[10px] text-muted">در این مرحله مبلغی از شما کسر نمی‌شود.</p>
    </div>}
    <div className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-[10px] leading-5 text-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent"/> پرداخت امن · قوانین لغو پیش از تأیید نمایش داده می‌شود.</div>
  </div>;
}
