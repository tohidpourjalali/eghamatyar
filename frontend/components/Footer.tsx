import Link from 'next/link';
import { Instagram, Send, Phone, Mail, MapPinned, ShieldCheck, ArrowUpLeft } from 'lucide-react';
import Logo from '@/components/Logo';

const groups = [
  { title: 'برای مسافران', links: [['جستجوی اقامتگاه', '/search'], ['سفرهای من', '/profile/trips'], ['مرکز راهنما', '/help'], ['پشتیبانی سفر', '/support']] },
  { title: 'برای میزبانان', links: [['میزبان شوید', '/host/register'], ['مدیریت اقامتگاه', '/host/dashboard'], ['رزروهای دریافتی', '/host/bookings'], ['راهنمای میزبانی', '/help']] },
  { title: 'اقامت‌یار', links: [['دربارهٔ ما', '/about'], ['وبلاگ سفر', '/blog'], ['تماس با ما', '/contact'], ['شرایط و قوانین', '/terms'], ['حریم خصوصی', '/privacy']] },
];

export default function Footer() {
  return <footer className="mt-16 border-t border-line bg-surface">
    <div className="page-shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,1fr)] lg:py-16">
      <div className="max-w-sm">
        <Logo/>
        <p className="mt-5 text-sm leading-7 text-muted">از کلبه‌ای میان درخت‌های شمال تا خانه‌ای آجری در دل کویر؛ اقامت‌یار کمک می‌کند سفر را با خیال راحت، شبیه خانه تجربه کنید.</p>
        <div className="mt-5 flex items-center gap-2">
          <SocialLink href="https://instagram.com" label="اینستاگرام"><Instagram className="h-4 w-4"/></SocialLink>
          <SocialLink href="https://t.me" label="تلگرام"><Send className="h-4 w-4"/></SocialLink>
          <a href="tel:02191000000" aria-label="تماس با اقامت‌یار" className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:border-brand/40 hover:text-brand"><Phone className="h-4 w-4"/></a>
        </div>
      </div>
      {groups.map(group => <div key={group.title}>
        <h3 className="mb-4 text-sm font-black text-ink">{group.title}</h3>
        <ul className="space-y-3">{group.links.map(([label, href]) => <li key={href + label}><Link href={href} className="text-sm text-muted transition hover:text-brand">{label}</Link></li>)}</ul>
      </div>)}
    </div>
    <div className="border-y border-line bg-brand-light/40">
      <div className="page-shell flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent"><ShieldCheck className="h-5 w-5"/></span><div><p className="text-sm font-black text-ink">سفر با خیال آسوده</p><p className="mt-1 text-xs leading-5 text-muted">پرداخت امن، قوانین روشن و اقامتگاه‌هایی که پیش از انتشار بررسی شده‌اند.</p></div></div>
        <Link href="/help" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:gap-2">بیشتر دربارهٔ امنیت بدانید <ArrowUpLeft className="h-4 w-4"/></Link>
      </div>
    </div>
    <div className="page-shell flex flex-col gap-3 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>© ۱۴۰۵ اقامت‌یار. تمامی حقوق محفوظ است.</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2"><a href="mailto:support@eghamatyar.ir" className="inline-flex items-center gap-1.5 hover:text-brand"><Mail className="h-3.5 w-3.5"/> پشتیبانی</a><span className="inline-flex items-center gap-1.5"><MapPinned className="h-3.5 w-3.5"/> ایران، از خانه تا خانه</span></div>
    </div>
  </footer>;
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return <a href={href} aria-label={label} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand">{children}</a>;
}
