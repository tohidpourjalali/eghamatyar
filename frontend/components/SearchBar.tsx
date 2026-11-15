'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, MapPin, CalendarDays, Users, ChevronDown } from 'lucide-react';
import { getTehranToday, toPersianDigits } from '@/lib/persian';
import PersianDatePicker from '@/components/PersianDatePicker';

export default function SearchBar() {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const { data: cities = [], isLoading: citiesLoading, isError: citiesError } = useQuery({ queryKey: ['cities'], queryFn: async () => (await api.get('/cities')).data });
  const canSubmit = useMemo(() => !checkIn || !checkOut || checkOut > checkIn, [checkIn, checkOut]);

  const submit = () => {
    const params = new URLSearchParams();
    if (citySlug) params.set('city_slug', citySlug);
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);
    params.set('adults', String(adults));
    router.push(`/search?${params.toString()}`);
  };

  return <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-1 rounded-[26px] border border-line bg-surface p-2 shadow-warm md:grid-cols-[1.35fr_1fr_1fr_1fr_auto] md:items-center md:rounded-full md:p-2">
    <Field icon={<MapPin className="h-[18px] w-[18px]"/>} label="مقصد" className="col-span-2 md:col-span-1">
      <div className="relative"><select aria-label="انتخاب مقصد" value={citySlug} onChange={e => setCitySlug(e.target.value)} className="w-full appearance-none bg-transparent pl-6 text-sm font-bold text-ink outline-none">
        <option value="">همهٔ ایران</option>{cities.map((c: any) => <option key={c.id} value={c.slug}>{c.name}، {c.province}</option>)}
      </select><ChevronDown className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/></div>
      {(citiesLoading || citiesError) && <p role={citiesError ? 'alert' : 'status'} className={`mt-1 text-[10px] ${citiesError ? 'text-error' : 'text-muted'}`}>{citiesError ? 'فهرست شهرها در دسترس نیست؛ جستجوی همهٔ ایران همچنان فعال است.' : 'در حال دریافت شهرها…'}</p>}
    </Field>
    <Field icon={<CalendarDays className="h-[18px] w-[18px]"/>} label="تاریخ ورود">
      <PersianDatePicker ariaLabel="تاریخ ورود" value={checkIn} minDate={getTehranToday()} onChange={date => {setCheckIn(date); if (checkOut && date >= checkOut) setCheckOut('');}} className="w-full" />
    </Field>
    <Field icon={<CalendarDays className="h-[18px] w-[18px]"/>} label="تاریخ خروج">
      <PersianDatePicker ariaLabel="تاریخ خروج" value={checkOut} minDate={checkIn || getTehranToday()} onChange={setCheckOut} className="w-full" />
    </Field>
    <Field icon={<Users className="h-[18px] w-[18px]"/>} label="مهمانان">
      <select aria-label="تعداد مهمانان" value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-ink outline-none">
        {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{toPersianDigits(n)} نفر</option>)}
      </select>
    </Field>
    <button disabled={!canSubmit} onClick={submit} className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:opacity-60 md:col-span-1 md:rounded-full">
      <Search className="h-[18px] w-[18px]"/><span>جستجو</span>
    </button>
  </div>;
}

function Field({ icon, label, children, className = '' }: { icon: React.ReactNode; label: string; children: React.ReactNode; className?: string }) {
  return <div className={`flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2.5 transition hover:bg-brand-light/40 md:px-4 ${className}`}>
    <span className="hidden text-brand sm:block">{icon}</span><div className="min-w-0 flex-1"><label className="mb-1 block text-[10px] font-black tracking-wide text-muted">{label}</label>{children}</div>
  </div>;
}
