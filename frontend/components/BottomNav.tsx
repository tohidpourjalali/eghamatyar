'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, UserRound } from 'lucide-react';

const items = [
  { href: '/', label: 'خانه', Icon: Home },
  { href: '/search', label: 'جستجو', Icon: Search },
  { href: '/profile/trips', label: 'سفرها', Icon: Heart },
  { href: '/profile', label: 'پروفایل', Icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();
  return <nav aria-label="ناوبری اصلی موبایل" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-8px_24px_rgba(70,40,20,.08)] backdrop-blur-xl md:hidden">
    <div className="mx-auto flex max-w-md items-center justify-around">
      {items.map(({ href, label, Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return <Link key={href} href={href} className={`flex min-w-[68px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-bold transition ${active ? 'text-brand' : 'text-muted hover:text-ink'}`}>
          <Icon className={`h-5 w-5 ${active ? 'stroke-[2.6]' : ''}`} />{label}
        </Link>;
      })}
    </div>
  </nav>;
}
