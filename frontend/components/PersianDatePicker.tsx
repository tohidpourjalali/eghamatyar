'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js';
import { getTehranToday, toPersianDigits } from '@/lib/persian';

type JalaliMonth = { jy: number; jm: number };
type PersianDatePickerProps = {
  value: string;
  onChange: (gregorianIsoDate: string) => void;
  minDate?: string;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
};

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const SHORT_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function isoFromJalali(jy: number, jm: number, jd: number) {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

function jalaliPartsFromIso(value: string) {
  const [gy, gm, gd] = value.slice(0, 10).split('-').map(Number);
  return toJalaali(gy, gm, gd);
}

function monthFromIso(value?: string, fallback?: string): JalaliMonth {
  const { jy, jm } = jalaliPartsFromIso(value || fallback || getTehranToday());
  return { jy, jm };
}

function formatJalaliIso(value: string) {
  const { jy, jm, jd } = jalaliPartsFromIso(value);
  return `${toPersianDigits(jd)} ${MONTH_NAMES[jm - 1]} ${toPersianDigits(jy)}`;
}

export default function PersianDatePicker({
  value,
  onChange,
  minDate = getTehranToday(),
  ariaLabel,
  placeholder = 'انتخاب تاریخ',
  className = '',
}: PersianDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<JalaliMonth>(() => monthFromIso(value, minDate));
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedMonth = useMemo(() => value ? monthFromIso(value) : null, [value]);

  useEffect(() => {
    if (open) setVisibleMonth(selectedMonth || monthFromIso(minDate));
  }, [open, selectedMonth, minDate]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const daysInMonth = jalaaliMonthLength(visibleMonth.jy, visibleMonth.jm);
  const firstGregorian = toGregorian(visibleMonth.jy, visibleMonth.jm, 1);
  // Jalaali weeks start on Saturday; UTC avoids a local-timezone offset at midnight.
  const firstDayOffset = (new Date(Date.UTC(firstGregorian.gy, firstGregorian.gm - 1, firstGregorian.gd)).getUTCDay() + 1) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const todayIso = getTehranToday();

  const changeMonth = (amount: number) => {
    setVisibleMonth((current) => {
      const absoluteMonth = current.jy * 12 + current.jm - 1 + amount;
      return { jy: Math.floor(absoluteMonth / 12), jm: ((absoluteMonth % 12) + 12) % 12 + 1 };
    });
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        aria-label={value ? `${ariaLabel}: ${formatJalaliIso(value)}` : ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-right text-xs font-semibold text-ink transition hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
      >
        <span className={`truncate ${value ? 'text-ink' : 'text-muted'}`}>
          {value ? formatJalaliIso(value) : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
      </button>

      {open && (
        <section role="dialog" aria-label="انتخاب تاریخ شمسی" className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-3 shadow-warm">
          <header className="flex items-center justify-between gap-2 px-1 pb-3">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="ماه قبل" className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-brand-light hover:text-brand">
              <ChevronRight className="h-5 w-5" />
            </button>
            <p className="text-sm font-black text-ink" aria-live="polite">
              {MONTH_NAMES[visibleMonth.jm - 1]} {toPersianDigits(visibleMonth.jy)}
            </p>
            <button type="button" onClick={() => changeMonth(1)} aria-label="ماه بعد" className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-brand-light hover:text-brand">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </header>
          <div className="grid grid-cols-7 text-center" role="grid">
            {SHORT_WEEKDAYS.map((day, index) => (
              <span key={day} title={WEEKDAYS[index]} role="columnheader" className="pb-2 text-[11px] font-bold text-muted">{day}</span>
            ))}
            {cells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} aria-hidden="true" className="h-10" />;
              const iso = isoFromJalali(visibleMonth.jy, visibleMonth.jm, day);
              const disabled = iso < minDate;
              const selected = iso === value;
              const today = iso === todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-label={`${toPersianDigits(day)} ${MONTH_NAMES[visibleMonth.jm - 1]} ${toPersianDigits(visibleMonth.jy)}`}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={`mx-auto grid h-10 w-10 place-items-center rounded-xl text-sm font-semibold transition ${selected ? 'bg-brand text-white shadow-soft' : today ? 'border border-brand/50 text-brand' : 'text-ink hover:bg-brand-light'} disabled:cursor-not-allowed disabled:text-muted/35 disabled:hover:bg-transparent`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>
          <footer className="mt-2 border-t border-line pt-2 text-center text-[10px] text-muted">تاریخ‌ها شمسی هستند؛ ثبت رزرو با تاریخ استاندارد انجام می‌شود.</footer>
        </section>
      )}
    </div>
  );
}
