'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();
  const authority = params.get('authority');
  const gateway = params.get('gateway') || 'mock';
  const bookingId = params.get('booking_id');
  const [state, setState] = useState<'loading' | 'success' | 'failed'>('loading');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!authority) { setState('failed'); return; }
    api.post('/payments/verify', { authority, gateway, booking_id: bookingId })
      .then((r) => { setData(r.data); setState('success'); })
      .catch(() => setState('failed'));
  }, [authority, gateway, bookingId]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      {state === 'loading' && <><Loader2 className="w-16 h-16 mx-auto animate-spin text-brand" /><p className="mt-4 font-bold">در حال بررسی پرداخت...</p></>}
      {state === 'success' && (
        <>
          <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
          <h1 className="text-2xl font-black mt-4">پرداخت موفق!</h1>
          <p className="text-gray-500 mt-2">رزرو شما قطعی شد.</p>
          <div className="bg-gray-50 rounded-2xl p-5 mt-6 text-sm space-y-2">
            <div className="flex justify-between"><span>کد رزرو / واچر</span><b dir="ltr">{data?.booking_code}</b></div>
            <div className="flex justify-between"><span>کد پیگیری</span><b dir="ltr">{data?.tracking_code}</b></div>
            <div className="flex justify-between"><span>وضعیت</span><b>{data?.booking_status}</b></div>
          </div>
          <button onClick={() => router.push('/profile/trips')} className="w-full bg-brand text-white font-bold rounded-xl py-3.5 mt-6">مشاهده سفرهای من</button>
        </>
      )}
      {state === 'failed' && (
        <>
          <XCircle className="w-20 h-20 mx-auto text-red-500" />
          <h1 className="text-2xl font-black mt-4">پرداخت ناموفق بود</h1>
          <p className="text-gray-500 mt-2">لطفاً دوباره تلاش کنید. در صورت کسر وجه، مبلغ تا ۷۲ ساعت آینده برمی‌گردد.</p>
          <button onClick={() => router.push('/profile/trips')} className="w-full bg-gray-900 text-white font-bold rounded-xl py-3.5 mt-6">بازگشت به سفرها</button>
        </>
      )}
    </div>
  );
}

export default function PaymentResultPage() {
  return <Suspense fallback={<div className="p-8 text-center">در حال بارگذاری...</div>}><ResultContent /></Suspense>;
}
