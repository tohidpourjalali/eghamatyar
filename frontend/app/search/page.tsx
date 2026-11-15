'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AccommodationCard from '@/components/AccommodationCard';
import FilterSidebar from '@/components/FilterSidebar';
import SearchBar from '@/components/SearchBar';
import { ErrorState } from '@/components/PageStates';
import { SlidersHorizontal, X, MapPin, ArrowUpDown } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [sort, setSort] = useState(params.get('sort') || 'recommended');
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') || '');
  const [instantOnly, setInstantOnly] = useState(params.get('is_instant_booking') === 'true');
  const [bedrooms, setBedrooms] = useState(Number(params.get('min_bedrooms') || 0));
  const [mobileFilters, setMobileFilters] = useState(false);
  const baseParams = useMemo(() => params.toString(), [params]);

  useEffect(() => { setSort(params.get('sort') || 'recommended'); }, [baseParams, params]);

  const qs = new URLSearchParams(baseParams);
  qs.set('sort', sort);
  if (maxPrice) qs.set('max_price', maxPrice); else qs.delete('max_price');
  if (instantOnly) qs.set('is_instant_booking', 'true'); else qs.delete('is_instant_booking');
  if (bedrooms) qs.set('min_bedrooms', String(bedrooms)); else qs.delete('min_bedrooms');

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['search', qs.toString()], queryFn: async () => (await api.get(`/accommodations?${qs.toString()}`)).data, staleTime: 30_000 });
  const activeCount = Number(Boolean(maxPrice)) + Number(instantOnly) + Number(bedrooms > 0);
  const location = params.get('city_slug')?.replaceAll('-', ' ');

  const resetFilters = () => { setMaxPrice(''); setInstantOnly(false); setBedrooms(0); };
  const clearAll = () => { resetFilters(); setSort('recommended'); const keep = new URLSearchParams(); if(params.get('city_slug')) keep.set('city_slug',params.get('city_slug')!); router.replace(`/search${keep.toString()?`?${keep}`:''}`); };
  const sidebarProps = { maxPrice, setMaxPrice, instantOnly, setInstantOnly, bedrooms, setBedrooms, onReset: resetFilters };

  return <div className="page-shell py-7 sm:py-10">
    <div className="mb-7"><p className="section-eyebrow">گوشه‌ای از ایران منتظر توست</p><h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">اقامتگاه مناسب سفرت را پیدا کن</h1></div>
    <div className="mb-8"><SearchBar/></div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><p className="font-black text-ink">{location ? `اقامتگاه‌ها در ${location}` : 'اقامتگاه‌های ایران'}</p><p className="mt-1 text-sm text-muted">{isLoading ? 'در حال جستجو…' : `${toPersianDigits(data?.total || 0)} اقامتگاه پیدا شد`}</p></div>
      <div className="flex items-center gap-2">
        <button onClick={() => setMobileFilters(true)} className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink shadow-card lg:hidden"><SlidersHorizontal className="h-4 w-4"/> فیلترها{activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] text-white">{toPersianDigits(activeCount)}</span>}</button>
        <label className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-muted"><ArrowUpDown className="h-4 w-4 text-brand"/><span className="hidden sm:inline">مرتب‌سازی</span><select value={sort} onChange={e=>setSort(e.target.value)} className="bg-transparent font-bold text-ink outline-none"><option value="recommended">پیشنهاد ما</option><option value="price_asc">ارزان‌ترین</option><option value="price_desc">گران‌ترین</option><option value="rating">بالاترین امتیاز</option></select></label>
      </div>
    </div>
    {activeCount > 0 && <div className="mb-5 flex flex-wrap items-center gap-2">{maxPrice && <FilterChip onRemove={()=>setMaxPrice('')}>تا {toPersianDigits(Number(maxPrice).toLocaleString('en-US'))} تومان</FilterChip>}{instantOnly && <FilterChip onRemove={()=>setInstantOnly(false)}>رزرو آنی</FilterChip>}{bedrooms > 0 && <FilterChip onRemove={()=>setBedrooms(0)}>{toPersianDigits(bedrooms)} اتاق‌خواب به بالا</FilterChip>}<button onClick={resetFilters} className="text-xs font-bold text-brand hover:underline">حذف همه</button></div>}
    <div className="grid gap-6 lg:grid-cols-[270px_1fr] xl:grid-cols-[290px_1fr]">
      <aside className="hidden lg:block"><FilterSidebar {...sidebarProps}/></aside>
      <div>
        {isError ? <ErrorState title="دریافت نتایج ممکن نشد" description="اتصال را بررسی کن و دوباره تلاش کن." onRetry={() => refetch()}/> : isLoading ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({length:6},(_,i)=><div key={i} className="rounded-3xl border border-line bg-surface p-3"><div className="skeleton aspect-[4/3] rounded-2xl"/><div className="skeleton mt-4 h-4 w-4/5 rounded"/><div className="skeleton mt-2 h-3 w-2/3 rounded"/><div className="skeleton mt-4 h-4 w-1/2 rounded"/></div>)}</div> : data?.items?.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.items.map((acc:any,i:number)=><AccommodationCard key={acc.id} acc={acc} index={i}/>)}</div> : <div className="rounded-[28px] border border-dashed border-line bg-surface px-6 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-light text-brand"><MapPin className="h-6 w-6"/></span><h2 className="mt-4 text-lg font-black text-ink">برای این فیلترها چیزی پیدا نشد</h2><p className="mt-2 text-sm leading-7 text-muted">قیمت یا تعداد اتاق را کمی تغییر بده؛ شاید خانهٔ مناسب سفرت منتظر باشد.</p><button onClick={clearAll} className="button-primary mt-5">پاک‌کردن فیلترها</button></div>}
      </div>
    </div>
    {mobileFilters && <div className="fixed inset-0 z-[60] flex items-end bg-black/45 backdrop-blur-sm lg:hidden" onClick={()=>setMobileFilters(false)}><div onClick={e=>e.stopPropagation()} className="w-full animate-fade-up rounded-t-[28px] bg-canvas p-3 pb-[max(env(safe-area-inset-bottom),12px)]"><div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-line"/><FilterSidebar {...sidebarProps} mobile onClose={()=>setMobileFilters(false)}/></div></div>}
  </div>;
}

function FilterChip({children,onRemove}:{children:React.ReactNode;onRemove:()=>void}) { return <button onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-light px-3 py-1.5 text-xs font-bold text-brand">{children}<X className="h-3.5 w-3.5"/></button>; }
export default function SearchPage() { return <Suspense fallback={<div className="page-shell py-12"><div className="skeleton h-10 w-1/3 rounded-xl"/><div className="skeleton mt-6 h-36 rounded-3xl"/></div>}><SearchContent/></Suspense>; }
