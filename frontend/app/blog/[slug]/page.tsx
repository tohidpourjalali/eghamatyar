import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ARTICLES, getArticle } from '@/lib/blog';
import { ArrowLeft, BadgeCheck, Clock3, MapPin, CheckCircle2 } from 'lucide-react';

export function generateStaticParams() { return ARTICLES.map(article => ({ slug: article.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article=getArticle(slug); return { title: article ? `${article.title} | مجلهٔ اقامت‌یار` : 'راهنمای سفر | اقامت‌یار', description: article?.excerpt };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article=getArticle(slug); if(!article) notFound();
  return <article className="page-shell max-w-5xl py-8 sm:py-12">
    <div className="mb-5 flex items-center gap-2 text-xs font-bold text-muted"><Link href="/blog" className="hover:text-brand">مجلهٔ سفر</Link><ArrowLeft className="h-3.5 w-3.5"/><span>{article.category}</span></div>
    <header className="mx-auto max-w-3xl text-center"><span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-black text-brand"><MapPin className="h-3.5 w-3.5"/>{article.category}</span><h1 className="mt-4 text-3xl font-black leading-[1.6] text-ink sm:text-4xl">{article.title}</h1><p className="mt-3 text-sm leading-8 text-muted">{article.excerpt}</p><p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted"><Clock3 className="h-4 w-4 text-brand"/>{article.readingTime} مطالعه</p></header>
    <div className="mt-7 aspect-[16/8] overflow-hidden rounded-[30px] bg-brand-light"><img src={article.image} alt={article.title} className="h-full w-full object-cover"/></div>
    <div className="mx-auto grid max-w-4xl gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_270px] lg:py-12">
      <div className="text-sm leading-8 text-muted"><p className="rounded-2xl border-r-4 border-brand bg-brand-light/40 p-5 text-base font-medium leading-9 text-ink">{article.intro}</p>{article.sections.map(s=><section key={s.title}><h2 className="mb-2 mt-8 text-xl font-black text-ink">{s.title}</h2><p>{s.body}</p></section>)}<section className="mt-8 rounded-3xl border border-line bg-surface p-5"><h2 className="flex items-center gap-2 text-lg font-black text-ink"><CheckCircle2 className="h-5 w-5 text-accent"/> پیش از رفتن یادت باشد</h2><ul className="mt-3 space-y-3">{article.tips.map(t=><li key={t} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"/><span>{t}</span></li>)}</ul></section><p className="mt-7 text-xs leading-7">برنامه‌ها و شرایط مسیر ممکن است با فصل و وضعیت محلی تغییر کند؛ پیش از حرکت، شرایط روز سفر را بررسی کن.</p></div>
      <aside className="h-fit rounded-3xl border border-line bg-brand-light/45 p-5 lg:sticky lg:top-24"><BadgeCheck className="h-6 w-6 text-brand"/><h2 className="mt-3 font-black text-ink">اقامتگاه مناسب این سفر را پیدا کن</h2><p className="mt-2 text-xs leading-6 text-muted">فیلترها را تنظیم کن، امکانات و قوانین را بخوان و پیش از رزرو هزینهٔ نهایی را ببین.</p><Link href="/search" className="button-primary mt-4 w-full">جستجوی اقامتگاه‌ها</Link><Link href="/blog" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand">مقاله‌های دیگر <ArrowLeft className="h-3.5 w-3.5"/></Link></aside>
    </div>
  </article>;
}
