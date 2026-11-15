import Link from 'next/link';
import { ARTICLES } from '@/lib/blog';
import { ArrowLeft, BookOpen, Clock3, MapPin } from 'lucide-react';

export const metadata = { title: 'راهنمای سفر | اقامت‌یار', description: 'ایده‌ها و راهنمای انتخاب اقامتگاه برای سفر به گوشه‌وکنار ایران.' };

export default function BlogPage() {
  const [featured,...rest] = ARTICLES;
  return <div className="page-shell py-10 sm:py-16">
    <header className="mb-8 max-w-2xl"><p className="section-eyebrow">مجلهٔ اقامت‌یار</p><h1 className="mt-2 text-3xl font-black text-ink sm:text-4xl">ایده‌ای برای سفر بعدی</h1><p className="mt-3 text-sm leading-8 text-muted">راهنماهای کوتاه برای انتخاب مقصد، اقامتگاه و ریتمی که به سفر تو می‌آید.</p></header>
    <Link href={`/blog/${featured.slug}`} className="group grid overflow-hidden rounded-[30px] border border-line bg-surface shadow-card transition hover:shadow-warm md:grid-cols-2"><div className="aspect-[16/10] overflow-hidden md:aspect-auto"><img src={featured.image} alt={featured.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/></div><div className="flex flex-col justify-center p-6 sm:p-9"><span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-black text-brand"><MapPin className="h-3.5 w-3.5"/>{featured.category}</span><h2 className="mt-4 text-2xl font-black leading-relaxed text-ink sm:text-3xl">{featured.title}</h2><p className="mt-3 text-sm leading-7 text-muted">{featured.excerpt}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand">خواندن راهنما <ArrowLeft className="h-4 w-4"/></span></div></Link>
    <div className="mt-12 flex items-center gap-2"><BookOpen className="h-5 w-5 text-brand"/><h2 className="text-xl font-black text-ink">بیشتر برای الهام گرفتن</h2></div>
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map(article=><Link key={article.slug} href={`/blog/${article.slug}`} className="group overflow-hidden rounded-3xl border border-line bg-surface shadow-card transition hover:-translate-y-1 hover:shadow-warm"><div className="aspect-[16/10] overflow-hidden"><img src={article.image} alt={article.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/></div><div className="p-5"><div className="flex items-center justify-between text-xs font-bold text-brand"><span>{article.category}</span><span className="inline-flex items-center gap-1 text-muted"><Clock3 className="h-3.5 w-3.5"/>{article.readingTime}</span></div><h3 className="mt-3 font-black leading-7 text-ink">{article.title}</h3><p className="mt-2 text-sm leading-7 text-muted">{article.excerpt}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand">ادامهٔ مطلب <ArrowLeft className="h-3.5 w-3.5"/></span></div></Link>)}</div>
  </div>;
}
