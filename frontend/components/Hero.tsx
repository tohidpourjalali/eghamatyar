import SearchBar from '@/components/SearchBar';
import { ArrowLeft, BadgeCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return <section className="page-shell relative pb-20 pt-4 sm:pb-[4.75rem] sm:pt-6">
    <div className="relative isolate min-h-[500px] overflow-hidden rounded-[30px] bg-[#4b3b2f] shadow-warm sm:min-h-[560px] sm:rounded-[38px]">
      <div className="hero-image absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/mazandaran-villa.jpg')" }} role="img" aria-label="اقامتگاه بوم‌گردی در طبیعت شمال ایران" />
      <div className="absolute inset-0 bg-gradient-to-l from-[#1f1a15]/75 via-[#271d16]/35 to-transparent"/>
      <div className="absolute inset-0 bg-gradient-to-t from-[#1f1712]/65 via-transparent to-[#1f1712]/10"/>
      <div className="relative flex min-h-[500px] flex-col justify-between p-6 text-white sm:min-h-[560px] sm:p-12 lg:p-16">
        <div className="flex items-center justify-between gap-4">
          <span className="eyebrow-pill"><Sparkles className="h-4 w-4 text-[#F9D28B]"/> از جنگل تا کویر، همین نزدیکی</span>
          <span className="hidden items-center gap-1.5 rounded-full bg-black/20 px-3 py-2 text-xs font-bold backdrop-blur sm:flex"><BadgeCheck className="h-4 w-4 text-[#80dbc6]"/> اقامتگاه‌های بررسی‌شده</span>
        </div>
        <div className="max-w-2xl animate-fade-up pb-10 pt-12 sm:pb-14">
          <p className="mb-4 text-sm font-bold text-[#FFE0C5] sm:text-base">یک ایران، هزار جور حسِ خوب</p>
          <h1 className="text-4xl font-black leading-[1.35] tracking-tight sm:text-5xl lg:text-[64px]">اقامتگاهی مثل <span className="text-[#FFD3AE]">خانهٔ خودت</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-lg sm:leading-8">برای یک آخر هفتهٔ سبز، یک حیاط آجری در یزد یا صدای موج‌های جنوب؛ جای بعدیِ خاطره‌هات را پیدا کن.</p>
          <Link href="/search" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-white transition hover:gap-3">دیدن اقامتگاه‌ها <ArrowLeft className="h-4 w-4"/></Link>
        </div>
      </div>
    </div>
    <div className="relative z-20 -mt-8 px-2 sm:-mt-9 sm:px-8 lg:px-12"><SearchBar/></div>
    <div className="pointer-events-none absolute -bottom-1 right-[12%] hidden h-14 w-14 rounded-full bg-secondary/25 blur-2xl sm:block"/>
  </section>;
}
