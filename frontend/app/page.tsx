'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import AccommodationCard from '@/components/AccommodationCard';
import Hero from '@/components/Hero';
import Reveal from '@/components/Reveal';
import { ErrorState } from '@/components/PageStates';
import Link from 'next/link';
import { BadgeCheck, Headset, ShieldCheck, ArrowLeft, Star, MapPin, HousePlus, Clock3, CreditCard } from 'lucide-react';

const destinations = [
  { name: 'رامسر', province: 'مازندران', slug: 'ramsar', photo: '/images/mazandaran-villa.jpg', note: 'جنگل و دریا' },
  { name: 'ماسوله', province: 'گیلان', slug: 'masuleh', photo: '/images/gilan-eco-lodge.jpg', note: 'خانه‌های پلکانی' },
  { name: 'یزد', province: 'یزد', slug: 'yazd', photo: '/images/yazd-courtyard.jpg', note: 'حیاط‌های آجری' },
  { name: 'کیش', province: 'هرمزگان', slug: 'kish', photo: '/images/kish-villa.jpg', note: 'ساحل و آفتاب' },
  { name: 'کاشان', province: 'اصفهان', slug: 'kashan', photo: '/images/yazd-courtyard.jpg', note: 'معماری قاجاری' },
  { name: 'رشت', province: 'گیلان', slug: 'rasht', photo: '/images/gilan-eco-lodge.jpg', note: 'طعم شمال' },
];
const trusts = [
  { Icon: ShieldCheck, title: 'پرداخت امن', body: 'پرداخت از درگاه‌های معتبر، با جزئیات روشن پیش از تأیید.' },
  { Icon: BadgeCheck, title: 'اقامتگاه بررسی‌شده', body: 'هر اقامتگاه پیش از انتشار از نظر اطلاعات و میزبانی بررسی می‌شود.' },
  { Icon: Headset, title: 'همراهِ سفر', body: 'پشتیبانی اقامت‌یار از زمان انتخاب تا پایان اقامت کنار شماست.' },
  { Icon: CreditCard, title: 'قیمت شفاف', body: 'هزینهٔ اقامت، نظافت و پرداخت‌ها را پیش از رزرو می‌بینید.' },
];
const stories = [
  { title: 'آخر هفته‌ای سبز در رامسر', meta: 'راهنمای سفر · ۶ دقیقه', slug: 'weekend-in-ramsar', image: '/images/mazandaran-villa.jpg' },
  { title: 'یک شب زیر آسمان کویر یزد', meta: 'فرهنگ و اقامت · ۵ دقیقه', slug: 'yazd-desert-stay', image: '/images/yazd-courtyard.jpg' },
  { title: 'از بازار رشت تا خانه‌های ماسوله', meta: 'شمال ایران · ۷ دقیقه', slug: 'masuleh-and-rasht', image: '/images/gilan-eco-lodge.jpg' },
];

export default function HomePage() {
  const { data: featured, isLoading, isError: featuredError, refetch: refetchFeatured } = useQuery({ queryKey: ['featured'], queryFn: async () => (await api.get('/accommodations?size=12&sort=recommended')).data });
  const { data: reviews = [], isError: reviewsError, refetch: refetchReviews } = useQuery({ queryKey: ['featured-reviews'], queryFn: async () => (await api.get('/accommodations/reviews/featured')).data, staleTime: 60_000 });

  return <div className="overflow-hidden">
    <Hero/>
    <section className="page-shell pt-2 sm:pt-0">
      <Reveal className="mb-6 flex items-end justify-between gap-4"><div><p className="section-eyebrow">هر شهر، یک حال‌وهوا</p><h2 className="section-title">کجا دلت می‌خواهد بمانی؟</h2></div><Link href="/search" className="hidden items-center gap-1 text-sm font-bold text-brand transition hover:gap-2 sm:inline-flex">همهٔ مقصدها <ArrowLeft className="h-4 w-4"/></Link></Reveal>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-5 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {destinations.map((city, i) => <Reveal key={city.slug} delay={i * 55} className="min-w-[146px] snap-start sm:min-w-0"><Link href={`/search?city_slug=${city.slug}`} className="group block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-brand-light shadow-card transition duration-300 group-hover:-translate-y-1 group-hover:shadow-warm sm:aspect-[4/5]">
            <img src={city.photo} alt={`اقامتگاه در ${city.name}، ${city.province}`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110"/><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"/>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-lg font-black">{city.name}</p><p className="mt-0.5 text-xs text-white/80">{city.note} · {city.province}</p></div>
            <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-brand shadow-card transition group-hover:rotate-[-35deg]"><ArrowLeft className="h-4 w-4"/></span>
          </div>
        </Link></Reveal>)}
      </div>
    </section>

    <section className="page-shell py-12 sm:py-16">
      <Reveal className="mb-7 flex items-end justify-between gap-4"><div><p className="section-eyebrow">برای شروعِ سفر بعدی</p><h2 className="section-title">اقامتگاه‌هایی که دوستشان داریم</h2><p className="mt-2 text-sm text-muted">از میان گزینه‌های تأییدشده، چیزی برای حال‌وهوای این روزها پیدا کن.</p></div><Link href="/search" className="hidden items-center gap-1 text-sm font-bold text-brand transition hover:gap-2 sm:inline-flex">مشاهدهٔ همه <ArrowLeft className="h-4 w-4"/></Link></Reveal>
      {isLoading ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="rounded-3xl border border-line bg-surface p-3"><div className="skeleton aspect-[4/3] rounded-2xl"/><div className="skeleton mt-4 h-4 w-3/4 rounded"/><div className="skeleton mt-2 h-3 w-1/2 rounded"/></div>)}</div> : featuredError ? <ErrorState title="اقامتگاه‌ها بارگذاری نشدند" description="دریافت فهرست اقامتگاه‌ها با مشکل روبه‌رو شد؛ دوباره تلاش کن." onRetry={() => refetchFeatured()}/> : featured?.items?.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.items.slice(0,12).map((acc: any, i: number) => <AccommodationCard key={acc.id} acc={acc} index={i}/>)}</div> : <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-14 text-center"><MapPin className="mx-auto h-9 w-9 text-brand"/><p className="mt-3 font-black text-ink">اقامتگاه‌های تازه در راه‌اند</p><p className="mt-1 text-sm text-muted">از جستجو مقصدت را انتخاب کن یا کمی بعد برگرد.</p><Link href="/search" className="button-outline mt-5">جستجوی اقامتگاه‌ها</Link></div>}
    </section>

    <section className="border-y border-line bg-surface py-12 sm:py-16">
      <div className="page-shell"><Reveal><p className="section-eyebrow">با خیال راحت، از اول تا آخر</p><h2 className="section-title">جزئیاتی که سفر را دل‌نشین می‌کند</h2></Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{trusts.map(({Icon,title,body},i) => <Reveal key={title} delay={i*70}><div className="h-full rounded-3xl border border-line bg-canvas p-5 transition hover:-translate-y-1 hover:shadow-soft"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-light text-brand"><Icon className="h-6 w-6"/></span><h3 className="mt-4 font-black text-ink">{title}</h3><p className="mt-2 text-sm leading-7 text-muted">{body}</p></div></Reveal>)}</div>
      </div>
    </section>

    <section className="page-shell py-12 sm:py-16">
      <Reveal className="mb-7 flex items-end justify-between gap-4"><div><p className="section-eyebrow">از دلِ تجربه‌ها</p><h2 className="section-title">روایت مسافران</h2><p className="mt-2 text-sm text-muted">فقط نظرهایی که پس از یک رزرو واقعی ثبت شده‌اند.</p></div></Reveal>
      {reviewsError ? <ErrorState title="نظرها بارگذاری نشدند" description="در دریافت تجربه‌های سفر مشکلی پیش آمده." onRetry={() => refetchReviews()}/> : reviews.length > 0 ? <div className="grid gap-4 md:grid-cols-3">{reviews.slice(0,3).map((r:any,i:number)=><Reveal key={r.id} delay={i*70}><article className="h-full rounded-3xl border border-line bg-surface p-6 shadow-card"><div className="flex gap-1 text-warning">{Array.from({length:r.rating},(_,n)=><Star key={n} className="h-4 w-4 fill-current"/>)}</div><p className="mt-4 leading-8 text-ink">«{r.comment}»</p><div className="mt-5 flex items-center justify-between border-t border-line pt-4"><div><p className="font-bold text-ink">{r.guest_name}</p><p className="mt-1 text-xs text-muted">اقامت در {r.accommodation_title}</p></div><BadgeCheck className="h-5 w-5 text-accent"/></div></article></Reveal>)}</div> : <div className="flex flex-col items-start gap-4 rounded-3xl border border-line bg-brand-light/45 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-brand shadow-card"><Star className="h-5 w-5"/></span><div><h3 className="font-black text-ink">اولین روایت‌های سفر در راه‌اند</h3><p className="mt-1 max-w-2xl text-sm leading-7 text-muted">نظرها پس از پایان اقامت و ثبت تجربهٔ واقعی مسافر نمایش داده می‌شوند. تو می‌توانی جزو اولین‌ها باشی.</p></div></div><Link href="/search" className="button-outline shrink-0">پیدا کردن اقامتگاه</Link></div>}
    </section>

    <section className="page-shell pb-12 sm:pb-16">
      <Reveal className="mb-7 flex items-end justify-between gap-4"><div><p className="section-eyebrow">الهام برای راه افتادن</p><h2 className="section-title">قصه‌ها و راه‌های سفر</h2></div><Link href="/blog" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:gap-2">همهٔ مقاله‌ها <ArrowLeft className="h-4 w-4"/></Link></Reveal>
      <div className="grid gap-5 md:grid-cols-3">{stories.map((story,i)=><Reveal key={story.slug} delay={i*70}><Link href={`/blog/${story.slug}`} className="group block overflow-hidden rounded-3xl border border-line bg-surface transition hover:-translate-y-1 hover:shadow-warm"><div className="aspect-[16/10] overflow-hidden"><img src={story.image} alt={story.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/></div><div className="p-5"><p className="text-xs font-bold text-brand">{story.meta}</p><h3 className="mt-2 font-black text-ink">{story.title}</h3><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-muted transition group-hover:gap-2 group-hover:text-brand">خواندن مقاله <ArrowLeft className="h-3.5 w-3.5"/></span></div></Link></Reveal>)}</div>
    </section>

    <section className="page-shell pb-14 sm:pb-20"><div className="relative overflow-hidden rounded-[32px] bg-[#3D281B] px-6 py-9 text-white sm:px-10 sm:py-12"><div className="absolute -left-8 -top-14 h-64 w-64 rounded-full bg-secondary/25 blur-3xl"/><div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div className="max-w-xl"><span className="inline-flex items-center gap-2 text-sm font-bold text-[#F8C29F]"><HousePlus className="h-4 w-4"/> خانهٔ دنجت را با مسافرها شریک شو</span><h2 className="mt-3 text-2xl font-black leading-relaxed sm:text-3xl">میزبانیِ خوب، از یک سلام گرم شروع می‌شود.</h2><p className="mt-2 text-sm leading-7 text-white/75">اقامتگاهت را معرفی کن، تقویم و قیمت‌ها را خودت مدیریت کن و با پشتیبانی اقامت‌یار همراه باش.</p></div><Link href="/host/register" className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3.5 font-black text-[#3D281B] transition hover:-translate-y-0.5 hover:bg-[#FFF0E2]">شروع میزبانی <ArrowLeft className="h-4 w-4"/></Link></div><div className="absolute bottom-5 left-1/3 hidden items-center gap-2 text-xs text-white/50 lg:flex"><Clock3 className="h-4 w-4"/> ثبت رایگان · مدیریت ساده</div></div></section>
  </div>;
}
