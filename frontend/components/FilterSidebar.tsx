'use client';
import { X, Zap, BedDouble, Banknote, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { formatToman } from '@/lib/persian';

const PRICE_PRESETS = [
  { label: 'تا ۲ میلیون', value: '2000000' },
  { label: 'تا ۵ میلیون', value: '5000000' },
  { label: 'تا ۱۰ میلیون', value: '10000000' },
];

export default function FilterSidebar({ maxPrice, setMaxPrice, instantOnly, setInstantOnly, bedrooms, setBedrooms, onClose, mobile = false, onReset }: {
  maxPrice: string; setMaxPrice: (v: string) => void;
  instantOnly: boolean; setInstantOnly: (v: boolean) => void;
  bedrooms: number; setBedrooms: (v: number) => void;
  onClose?: () => void; mobile?: boolean; onReset: () => void;
}) {
  return <div className={`rounded-3xl border border-line bg-surface p-5 ${mobile ? 'max-h-[82dvh] overflow-y-auto' : 'sticky top-24 shadow-card'}`}>
    <div className="flex items-center justify-between border-b border-line pb-4"><div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-brand"/><h2 className="font-black text-ink">فیلترها</h2></div>{mobile && <button onClick={onClose} aria-label="بستن فیلترها" className="grid h-9 w-9 place-items-center rounded-full hover:bg-brand-light"><X className="h-4 w-4"/></button>}</div>
    <div className="border-b border-line py-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-black"><Banknote className="h-4 w-4 text-brand"/> قیمت هر شب</div>
      <div className="flex flex-wrap gap-2">{PRICE_PRESETS.map(p => <button key={p.value} onClick={() => setMaxPrice(maxPrice === p.value ? '' : p.value)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${maxPrice === p.value ? 'border-brand bg-brand-light text-brand' : 'border-line text-muted hover:border-brand/40'}`}>{p.label}</button>)}</div>
      <label className="mt-4 block text-xs font-bold text-muted">حداکثر قیمت (تومان)</label>
      <input type="number" inputMode="numeric" min="0" placeholder="مثلاً ۵٬۰۰۰٬۰۰۰" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="input-warm mt-2 text-sm"/>
      {maxPrice && <p className="mt-2 text-xs text-muted">تا {formatToman(Number(maxPrice))} در شب</p>}
    </div>
    <div className="border-b border-line py-5">
      <label className="flex cursor-pointer items-center justify-between gap-3"><span><span className="flex items-center gap-2 text-sm font-black"><Zap className="h-4 w-4 text-brand"/> رزرو آنی</span><span className="mt-1 block text-xs text-muted">بدون انتظار برای پاسخ میزبان</span></span><span className={`relative h-6 w-11 rounded-full transition ${instantOnly ? 'bg-brand' : 'bg-line'}`}><input type="checkbox" className="sr-only" checked={instantOnly} onChange={e => setInstantOnly(e.target.checked)}/><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${instantOnly ? 'left-1' : 'right-1'}`}>{instantOnly && <Check className="h-3 w-3 p-0.5 text-brand"/>}</span></span></label>
    </div>
    <div className="py-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-black"><BedDouble className="h-4 w-4 text-brand"/> اتاق خواب</div>
      <div className="flex items-center justify-between rounded-2xl border border-line p-2">
        <span className="text-xs text-muted">حداقل</span><div className="flex items-center gap-3"><button onClick={() => setBedrooms(Math.max(0,bedrooms-1))} aria-label="کم کردن اتاق" className="grid h-8 w-8 place-items-center rounded-full border border-line font-bold text-muted hover:border-brand hover:text-brand">−</button><span className="min-w-5 text-center text-sm font-black">{bedrooms || 'همه'}</span><button onClick={() => setBedrooms(Math.min(8,bedrooms+1))} aria-label="افزایش اتاق" className="grid h-8 w-8 place-items-center rounded-full border border-line font-bold text-muted hover:border-brand hover:text-brand">+</button></div>
      </div>
    </div>
    <button onClick={onReset} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-muted transition hover:bg-brand-light/50 hover:text-brand"><RotateCcw className="h-4 w-4"/> پاک‌کردن فیلترها</button>
    {mobile && <button onClick={onClose} className="button-primary mt-3 w-full">نمایش اقامتگاه‌ها</button>}
  </div>;
}
