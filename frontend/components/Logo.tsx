import Link from 'next/link';

export default function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" aria-label="اقامت‌یار، صفحهٔ اصلی" className="group inline-flex items-center gap-2.5">
    <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-brand shadow-soft transition duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:h-12 sm:w-12" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
        <path d="M11.5 29.5 32 13l20.5 16.5M16.5 27.5V51h31V27.5" stroke="#FFF7EF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4"/>
        <path d="M25 51V38.5a7 7 0 0 1 14 0V51M21 35h2m18 0h2" stroke="#FFF7EF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.1"/>
        <path d="M46 17.5h6m-3-3v6" stroke="#F7D79A" strokeLinecap="round" strokeWidth="2.2"/>
        <circle cx="20.5" cy="42.5" r="1.25" fill="#F7D79A"/><circle cx="43.5" cy="42.5" r="1.25" fill="#F7D79A"/>
      </svg>
    </span>
    {!compact && <span className="leading-tight"><b className="block text-[19px] font-black tracking-tight text-ink">اقامت‌یار</b><small className="hidden text-[10px] font-semibold tracking-[.16em] text-muted sm:block">سفر، به سبک خانه</small></span>}
  </Link>;
}
