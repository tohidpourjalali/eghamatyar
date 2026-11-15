import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export default function InfoPage({ eyebrow, title, intro, Icon, children }: { eyebrow: string; title: string; intro: string; Icon?: LucideIcon; children: ReactNode }) {
  return <div className="page-shell py-10 sm:py-16">
    <header className="relative overflow-hidden rounded-[30px] border border-line bg-brand-light/55 px-6 py-8 sm:rounded-[38px] sm:px-12 sm:py-12">
      <div className="absolute -left-8 -top-12 h-48 w-48 rounded-full bg-secondary/20 blur-3xl"/>
      <div className="relative max-w-3xl">{Icon && <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-surface text-brand shadow-card"><Icon className="h-6 w-6"/></span>}<p className="section-eyebrow">{eyebrow}</p><h1 className="mt-2 text-3xl font-black leading-tight text-ink sm:text-4xl">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-8 text-muted sm:text-base">{intro}</p></div>
    </header>
    <article className="mx-auto max-w-4xl py-8 sm:py-12 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-black [&_h3]:text-ink [&_p]:text-sm [&_p]:leading-8 [&_p]:text-muted [&_ul]:my-4 [&_ul]:space-y-2 [&_li]:text-sm [&_li]:leading-7 [&_li]:text-muted">{children}</article>
  </div>;
}
