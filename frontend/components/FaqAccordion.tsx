'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return <div className="space-y-3">{items.map((item,i)=><section key={item.question} className={`overflow-hidden rounded-2xl border transition ${open===i?'border-brand/35 bg-brand-light/25':'border-line bg-surface'}`}>
    <button aria-expanded={open===i} onClick={()=>setOpen(open===i?null:i)} className="flex w-full items-center justify-between gap-4 p-4 text-right sm:p-5"><span className="font-black text-ink">{item.question}</span><ChevronDown className={`h-5 w-5 shrink-0 text-brand transition ${open===i?'rotate-180':''}`}/></button>
    {open===i&&<p className="px-4 pb-5 text-sm leading-8 text-muted sm:px-5">{item.answer}</p>}
  </section>)}</div>;
}
