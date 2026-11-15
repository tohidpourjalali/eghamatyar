'use client';
import Link from 'next/link';
import { Heart, Star, Zap, BadgeCheck, Users, ArrowUpLeft } from 'lucide-react';
import { useState } from 'react';
import { Accommodation } from '@/lib/types';
import { formatToman, toPersianDigits } from '@/lib/persian';
import { api } from '@/lib/api';

const IRAN_PHOTOS = {
  forest: '/images/mazandaran-villa.jpg',
  village: '/images/gilan-eco-lodge.jpg',
  desert: '/images/yazd-courtyard.jpg',
  coast: '/images/kish-villa.jpg',
};

function getPropertyPhoto(acc: Accommodation) {
  // Prefer the actual cover image from the accommodation record (including seeded demo images).
  // Previously picsum cover URLs were discarded, forcing many different listings onto the same
  // four local fallback photos.
  const supplied = acc.cover_image || acc.images?.find((image) => image.is_cover)?.url || acc.images?.[0]?.url || '';
  if (supplied) return supplied;
  const keywords = `${acc.title || ''} ${acc.city?.name || ''} ${acc.type?.name || ''}`;
  if (/کیش|قشم|ساحل|دریا|بندر|جنوب/.test(keywords)) return IRAN_PHOTOS.coast;
  if (/یزد|کاشان|کویر|بوم|سنتی/.test(keywords)) return IRAN_PHOTOS.desert;
  if (/ماسوله|جنگل|گیلان|رشت|کلبه|شمال|مازندران/.test(keywords)) return /ماسوله|گیلان|کلبه/.test(keywords) ? IRAN_PHOTOS.village : IRAN_PHOTOS.forest;
  return [IRAN_PHOTOS.forest, IRAN_PHOTOS.desert, IRAN_PHOTOS.coast][(acc.title || '').length % 3];
}

export default function AccommodationCard({ acc, index = 0 }: { acc: Accommodation; index?: number }) {
  const [fav, setFav] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const photo = getPropertyPhoto(acc);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try { const res = await api.post(`/accommodations/${acc.id}/favorite`); setFav(res.data.is_favorite); }
    catch { window.location.assign('/login'); }
  };

  return <Link href={`/accommodations/${acc.id}`} className="group block animate-fade-up" style={{ animationDelay: `${Math.min(index, 7) * 55}ms` }}>
    <article className="overflow-hidden rounded-[24px] border border-line/80 bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-warm">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-light">
        {!imageReady && <div className="skeleton absolute inset-0"/>}
        <img src={photo} alt={acc.title} loading="lazy" decoding="async" onLoad={() => setImageReady(true)} onError={() => setImageReady(true)} className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.055] ${imageReady ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5 opacity-70"/>
        <button aria-label={fav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'} onClick={toggleFav} className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 text-[#735d4c] shadow-card backdrop-blur transition hover:scale-110 hover:text-brand">
          <Heart className={`h-[18px] w-[18px] transition ${fav ? 'fill-brand text-brand' : ''}`}/>
        </button>
        {acc.is_instant_booking && <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-[11px] font-black text-brand shadow-card backdrop-blur"><Zap className="h-3.5 w-3.5 fill-current"/> رزرو آنی</span>}
        {Number(acc.discount_percent) > 0 && <span className="absolute right-3 top-14 rounded-full bg-accent px-3 py-1 text-[11px] font-black text-white">{toPersianDigits(acc.discount_percent || 0)}٪ تخفیف</span>}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/35 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-md"><BadgeCheck className="h-3.5 w-3.5 text-[#9BE4D6]"/> تأییدشده</span>
      </div>
      <div className="p-4 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><h3 className="truncate font-black text-ink">{acc.title}</h3><p className="mt-1 truncate text-xs text-muted">{acc.city?.name || 'ایران'}{acc.type?.name ? ` · ${acc.type.name}` : ''}</p></div>
          {Number(acc.reviews_count) > 0 && <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-ink"><Star className="h-3.5 w-3.5 fill-warning text-warning"/>{toPersianDigits(acc.rating_avg || 0)}</span>}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Users className="h-3.5 w-3.5"/><span>تا {toPersianDigits(acc.max_capacity)} مهمان</span><span className="mx-0.5">·</span><span>{toPersianDigits(acc.bedrooms_count)} اتاق</span></div>
        <div className="mt-3 flex items-end justify-between border-t border-line/80 pt-3">
          <p><span className="text-base font-black text-ink">{formatToman(acc.base_price)}</span><span className="mr-1 text-xs text-muted">/ شب</span></p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand opacity-0 transition group-hover:opacity-100">جزئیات <ArrowUpLeft className="h-3.5 w-3.5"/></span>
        </div>
      </div>
    </article>
  </Link>;
}
