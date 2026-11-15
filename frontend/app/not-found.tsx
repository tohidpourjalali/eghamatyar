import Link from 'next/link';
import { Compass, Search } from 'lucide-react';

export default function NotFound() {
  return <main className="page-shell flex min-h-[65vh] items-center justify-center py-14"><section className="w-full max-w-lg rounded-[30px] border border-line bg-surface p-8 text-center shadow-card"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-light text-brand"><Compass className="h-7 w-7"/></span><p className="mt-5 text-sm font-black text-brand">۴۰۴ · مسیر پیدا نشد</p><h1 className="mt-2 text-2xl font-black text-ink">این صفحه اینجا نیست</h1><p className="mt-2 text-sm leading-7 text-muted">ممکن است پیوند قدیمی باشد یا صفحه جابه‌جا شده باشد. از اینجا ادامهٔ سفر را پیدا کن.</p><div className="mt-6 flex justify-center gap-3"><Link href="/search" className="button-primary"><Search className="h-4 w-4"/> جستجوی اقامتگاه</Link><Link href="/" className="button-outline">صفحهٔ اصلی</Link></div></section></main>;
}
