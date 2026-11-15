import Link from 'next/link';
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react';

export function LoadingState({ label = 'در حال بارگذاری…' }: { label?: string }) {
  return <div role="status" className="page-shell flex min-h-[45vh] items-center justify-center py-12"><div className="w-full max-w-md rounded-3xl border border-line bg-surface p-7 text-center shadow-card"><LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand"/><p className="mt-4 font-bold text-ink">{label}</p><div className="mx-auto mt-5 h-1.5 max-w-48 overflow-hidden rounded-full bg-brand-light"><div className="h-full w-2/3 animate-pulse rounded-full bg-brand"/></div></div></div>;
}

export function ErrorState({ title = 'بارگذاری انجام نشد', description = 'اتصال را بررسی کن و دوباره تلاش کن.', onRetry, href = '/' }: { title?: string; description?: string; onRetry?: () => void; href?: string }) {
  return <section role="alert" className="rounded-3xl border border-error/20 bg-error/5 px-6 py-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-error/10 text-error"><AlertCircle className="h-6 w-6"/></span><h2 className="mt-4 font-black text-ink">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">{description}</p><div className="mt-5 flex flex-wrap justify-center gap-3">{onRetry && <button onClick={onRetry} className="button-primary"><RefreshCw className="h-4 w-4"/> تلاش دوباره</button>}<Link href={href} className="button-outline">بازگشت</Link></div></section>;
}
