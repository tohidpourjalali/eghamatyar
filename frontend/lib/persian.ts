const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toEnglishDigits(input: string): string {
  return String(input)
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

export function normalizeIranianMobile(input: string): string {
  let digits = toEnglishDigits(input).replace(/[^0-9]/g, '');
  if (digits.startsWith('0098')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('98') && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.length === 10 && digits.startsWith('9')) digits = `0${digits}`;
  return digits;
}

export function toPersianDigits(input: string | number): string {
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/\d/g, (d) => fa[Number(d)]);
}

export function formatToman(amount: number | string): string {
  const n = Number(amount) || 0;
  return toPersianDigits(n.toLocaleString('en-US')) + ' تومان';
}

export function formatNumber(n: number): string {
  return toPersianDigits(n.toLocaleString('en-US'));
}

export function toJalali(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, 12));
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' }).format(d);
  } catch {
    return dateStr;
  }
}

export function getTehranToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export const CANCELLATION_LABELS: Record<string, string> = {
  flexible: 'انعطاف‌پذیر',
  moderate: 'متوسط',
  strict: 'سخت‌گیرانه',
  non_refundable: 'غیرقابل استرداد',
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_host_approval: 'در انتظار تأیید میزبان',
  pending_payment: 'در انتظار پرداخت',
  confirmed: 'تأییدشده',
  cancelled: 'کنسل‌شده',
  completed: 'تکمیل‌شده',
  expired: 'منقضی‌شده',
  refunded: 'استردادشده',
};
