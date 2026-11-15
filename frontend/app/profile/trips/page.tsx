'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { formatToman, toPersianDigits, BOOKING_STATUS_LABELS, toJalali } from '@/lib/persian';
import { Calendar, MapPin } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/PageStates';

const STATUS_COLORS: Record<string, string> = {
  pending_host_approval: 'bg-yellow-100 text-yellow-800',
  pending_payment: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

export default function TripsPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['my-bookings'], queryFn: async () => (await api.get('/bookings')).data });

  if (isLoading) return <LoadingState label="در حال دریافت سفرهای تو…"/>;
  if (isError) return <main className="page-shell py-12"><ErrorState title="سفرها بارگذاری نشدند" onRetry={() => refetch()} href="/profile"/></main>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">سفرهای من</h1>
      <p className="text-gray-500 mt-1">{toPersianDigits(data?.total || 0)} رزرو</p>

      <div className="space-y-4 mt-8">
        {(data?.items || []).map((b: any) => (
          <Link key={b.id} href={`/checkout/${b.id}`} className="block border rounded-2xl p-5 hover:shadow-lg transition">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black text-lg" dir="ltr">{b.booking_code}</p>
                <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" /> {toJalali(b.check_in)} تا {toJalali(b.check_out)} • {toPersianDigits(b.nights)} شب • {toPersianDigits(b.adults + b.children)} مهمان
                </p>
              </div>
              <div className="text-left">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[b.status] || 'bg-gray-100'}`}>{BOOKING_STATUS_LABELS[b.status] || b.status}</span>
                <p className="font-black mt-2">{formatToman(b.total_amount)}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span>بیعانه: {formatToman(b.prepayment_amount)}</span>
              <span>پرداخت‌شده: {formatToman(b.paid_amount)}</span>
              {b.remaining_amount > 0 && <span className="text-brand font-bold">باقیمانده: {formatToman(b.remaining_amount)}</span>}
            </div>
          </Link>
        ))}
        {(!data?.items || data.items.length === 0) && (
          <div className="text-center py-20 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-3" />
            <p className="font-bold text-gray-600">هنوز سفری ندارید</p>
            <Link href="/search" className="inline-block mt-4 bg-brand text-white px-6 py-3 rounded-full font-bold">شروع جستجو</Link>
          </div>
        )}
      </div>
    </div>
  );
}
