'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatToman, toPersianDigits, BOOKING_STATUS_LABELS, toJalali } from '@/lib/persian';
import { ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/PageStates';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.booking_id as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [gateway, setGateway] = useState('mock');

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then((r) => setBooking(r.data)).catch(() => setError('رزرو یافت نشد')).finally(() => setLoading(false));
  }, [bookingId]);

  const pay = async (type: string) => {
    setPaying(true); setError('');
    try {
      const res = await api.post('/payments/initiate', {
        booking_id: bookingId, payment_type: type, gateway,
        idempotency_key: `${bookingId}-${type}-${Date.now()}`,
      });
      // در حالت Mock مستقیم به نتیجه پرداخت می‌رویم
      router.push(`/payment/result?authority=${res.data.authority}&gateway=${gateway}&booking_id=${bookingId}`);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'خطا در شروع پرداخت');
      setPaying(false);
    }
  };

  const cancel = async () => {
    if (!confirm('مطمئنید می‌خواهید رزرو را کنسل کنید؟')) return;
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`, { reason: 'کنسلیشن توسط مهمان' });
      alert(`رزرو کنسل شد.\nمبلغ استرداد: ${formatToman(res.data.refund_amount)} (${toPersianDigits(res.data.refund_percent)}٪)`);
      router.push('/profile/trips');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'خطا در کنسلیشن');
    }
  };

  if (loading) return <LoadingState label="در حال دریافت جزئیات رزرو…"/>;
  if (!booking) return <main className="page-shell py-12"><ErrorState title="جزئیات رزرو در دسترس نیست" description={error || 'رزرو پیدا نشد یا دسترسی به آن وجود ندارد.'} href="/profile/trips"/></main>;

  const status = booking.status;
  const isPendingApproval = status === 'pending_host_approval';
  const isPendingPayment = status === 'pending_payment';
  const isConfirmed = status === 'confirmed';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">تکمیل رزرو</h1>
      <p className="text-gray-500 mt-1">کد رزرو: <b dir="ltr">{booking.booking_code}</b></p>

      <div className={`rounded-2xl p-5 mt-6 flex items-start gap-3 ${isConfirmed ? 'bg-green-50 border border-green-200' : isPendingApproval ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
        {isConfirmed ? <CheckCircle className="w-8 h-8 text-green-600 shrink-0" /> : isPendingApproval ? <Clock className="w-8 h-8 text-yellow-600 shrink-0" /> : <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />}
        <div>
          <p className="font-black text-lg">{BOOKING_STATUS_LABELS[status] || status}</p>
          <p className="text-sm text-gray-600 mt-1 leading-7">
            {isPendingApproval && 'درخواست شما ثبت شد. میزبان حداکثر تا ۲۴ ساعت پاسخ می‌دهد. پس از تأیید، بیعانه را پرداخت کنید.'}
            {isPendingPayment && 'میزبان رزرو را تأیید کرد. حالا بیعانه را پرداخت کنید تا رزرو قطعی شود. تقویم به مدت ۲۰ دقیقه برای شما قفل شده است.'}
            {isConfirmed && 'رزرو شما قطعی شد! واچر صادر شد. باقیمانده حداکثر ۳ روز قبل از ورود پرداخت شود.'}
          </p>
        </div>
      </div>

      <div className="border rounded-2xl p-6 mt-6">
        <h2 className="font-black text-lg mb-4">جزئیات سفر</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">ورود</p><p className="font-bold">{toJalali(booking.check_in)}</p></div>
          <div><p className="text-gray-500">خروج</p><p className="font-bold">{toJalali(booking.check_out)}</p></div>
          <div><p className="text-gray-500">مدت اقامت</p><p className="font-bold">{toPersianDigits(booking.nights)} شب</p></div>
          <div><p className="text-gray-500">مهمانان</p><p className="font-bold">{toPersianDigits(booking.adults + booking.children)} نفر</p></div>
        </div>
      </div>

      <div className="border rounded-2xl p-6 mt-4">
        <h2 className="font-black text-lg mb-4">تفکیک قیمت (تومان)</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>مبلغ پایه ({toPersianDigits(booking.nights)} شب)</span><span>{formatToman(booking.base_amount)}</span></div>
          <div className="flex justify-between"><span>هزینه نظافت</span><span>{formatToman(booking.cleaning_fee)}</span></div>
          {booking.extra_guest_amount > 0 && <div className="flex justify-between"><span>مهمان اضافه</span><span>{formatToman(booking.extra_guest_amount)}</span></div>}
          {booking.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>تخفیف</span><span>-{formatToman(booking.discount_amount)}</span></div>}
          <div className="flex justify-between font-black border-t pt-2 text-base"><span>جمع کل</span><span>{formatToman(booking.total_amount)}</span></div>
          <div className="flex justify-between text-brand font-bold"><span>بیعانه ({toPersianDigits(booking.prepayment_percent)}٪)</span><span>{formatToman(booking.prepayment_amount)}</span></div>
          <div className="flex justify-between text-gray-500"><span>باقیمانده</span><span>{formatToman(booking.remaining_amount)}</span></div>
          <div className="flex justify-between text-gray-500"><span>پرداخت‌شده</span><span>{formatToman(booking.paid_amount)}</span></div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2 mt-4">{error}</p>}

      <div className="mt-6 space-y-3">
        {isPendingPayment && (
          <>
            <div className="flex gap-2">
              {['mock', 'zarinpal', 'idpay'].map((g) => (
                <button key={g} onClick={() => setGateway(g)} className={`flex-1 border rounded-xl py-3 text-sm font-bold ${gateway === g ? 'border-brand bg-brand-light text-brand' : ''}`}>
                  {g === 'mock' ? 'پرداخت آزمایشی' : g === 'zarinpal' ? 'زرین‌پال' : 'آیدی‌پی'}
                </button>
              ))}
            </div>
            <button onClick={() => pay('prepayment')} disabled={paying} className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-4 transition disabled:opacity-50">
              {paying ? 'در حال اتصال به درگاه...' : `پرداخت بیعانه — ${formatToman(booking.prepayment_amount)}`}
            </button>
          </>
        )}
        {isConfirmed && booking.remaining_amount > 0 && (
          <button onClick={() => pay('remaining')} disabled={paying} className="w-full bg-gray-900 hover:bg-black text-white font-bold rounded-xl py-4 transition disabled:opacity-50">
            پرداخت باقیمانده — {formatToman(booking.remaining_amount)}
          </button>
        )}
        {(isPendingApproval || isPendingPayment || isConfirmed) && (
          <button onClick={cancel} className="w-full border border-red-200 text-red-600 font-bold rounded-xl py-3 hover:bg-red-50 transition flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4" /> کنسلیشن رزرو
          </button>
        )}
        <p className="text-xs text-gray-400 text-center">با پرداخت، قوانین کنسلیشن ({booking.cancellation_policy}) را می‌پذیرید. مبلغ استرداد بر اساس همان قوانین محاسبه می‌شود.</p>
      </div>
    </div>
  );
}
