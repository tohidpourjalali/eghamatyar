'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatToman, toPersianDigits, BOOKING_STATUS_LABELS, toJalali } from '@/lib/persian';
import { Check, X } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/PageStates';

export default function HostBookings() {
  const { data, refetch, isLoading, isError } = useQuery({ queryKey: ['host-bookings'], queryFn: async () => (await api.get('/bookings/host/bookings')).data });
  if (isLoading) return <LoadingState label="در حال دریافت رزروهای مهمانان…"/>;
  if (isError) return <main className="page-shell py-12"><ErrorState title="رزروهای دریافتی بارگذاری نشدند" onRetry={() => refetch()} href="/host/dashboard"/></main>;

  const act = async (id: string, action: string) => {
    try {
      await api.post(`/bookings/${id}/${action}`, {});
      refetch();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'خطا');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">رزروهای دریافتی</h1>
      <div className="space-y-4 mt-8">
        {(data?.items || []).map((b: any) => (
          <div key={b.id} className="border rounded-2xl p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-black" dir="ltr">{b.booking_code}</p>
                <p className="text-gray-500 text-sm mt-1">{toJalali(b.check_in)} تا {toJalali(b.check_out)} • {toPersianDigits(b.nights)} شب • {toPersianDigits(b.adults + b.children)} مهمان</p>
                <p className="font-bold mt-1">{formatToman(b.total_amount)} <span className="text-gray-400 text-xs font-normal">(سهم شما پس از کمیسیون: {formatToman(b.total_amount * 0.9)})</span></p>
              </div>
              <span className="h-fit px-3 py-1 rounded-full text-xs font-bold bg-gray-100">{BOOKING_STATUS_LABELS[b.status] || b.status}</span>
            </div>
            {b.status === 'pending_host_approval' && (
              <div className="flex gap-2 mt-4">
                <button onClick={() => act(b.id, 'accept')} className="flex-1 bg-green-600 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-green-700"><Check className="w-4 h-4" /> پذیرش</button>
                <button onClick={() => act(b.id, 'reject')} className="flex-1 border border-red-200 text-red-600 font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-red-50"><X className="w-4 h-4" /> رد</button>
              </div>
            )}
          </div>
        ))}
        {(!data?.items || data.items.length === 0) && <p className="text-gray-400 text-center py-16">رزروی دریافت نکرده‌اید.</p>}
      </div>
    </div>
  );
}
