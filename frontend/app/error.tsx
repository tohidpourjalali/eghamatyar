'use client';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="page-shell flex min-h-[65vh] items-center justify-center py-14"><section role="alert" className="w-full max-w-lg rounded-[30px] border border-error/20 bg-surface p-8 text-center shadow-card"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-error/10 text-error"><AlertTriangle className="h-7 w-7"/></span><h1 className="mt-5 text-2xl font-black text-ink">یک مشکلی پیش آمد</h1><p className="mt-2 text-sm leading-7 text-muted">صفحه نتوانست کامل باز شود. یک بار دیگر تلاش کن یا به صفحهٔ اصلی برگرد.</p><div className="mt-6 flex justify-center gap-3"><button onClick={reset} className="button-primary"><RefreshCw className="h-4 w-4"/> بارگذاری دوباره</button><Link href="/" className="button-outline">صفحهٔ اصلی</Link></div></section></main>;
}
