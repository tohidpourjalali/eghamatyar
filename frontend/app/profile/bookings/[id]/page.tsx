'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BOOKING_STATUS_LABELS, formatToman, toJalali, toPersianDigits } from '@/lib/persian';
import { CalendarDays, MapPin, ShieldCheck, ArrowLeft, ReceiptText } from 'lucide-react';

export default function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get(`/bookings/${id}`).then(r => setBooking(r.data)).catch(e => setError(e.response?.data?.detail || 'دریافت جزئیات رزرو ناموفق بود')); }, [id]);

  if (error) return <main className="max-w-3xl mx-auto px-4 py-14 text-center"><p className="text-red-600">{error}</p><Link href="/profile/trips" className="inline-flex items-center gap-2 mt-5 font-bold"><ArrowLeft className="w-4 h-4"/> بازگشت به سفرها</Link></main>;
  if (!booking) return <main className="p-12 text-center animate-pulse">در حال بارگذاری جزئیات رزرو…</main>;

  const units = booking.snapshot?.units || [];
  return <main className="max-w-4xl mx-auto px-4 py-10">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm text-gray-500">جزئیات رزرو</p><h1 className="text-3xl font-black mt-1">{booking.booking_code}</h1></div>
      <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold">{BOOKING_STATUS_LABELS[booking.status] || booking.status}</span>
    </div>
    <div className="grid md:grid-cols-3 gap-4 mt-7">
      <div className="md:col-span-2 space-y-4">
        <section className="border rounded-2xl p-5">
          <h2 className="font-black text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5 text-brand"/> برنامه سفر</h2>
          <div className="grid grid-cols-2 gap-4 mt-4"><div><p className="text-sm text-gray-500">ورود</p><p className="font-bold mt-1">{toJalali(booking.check_in)}</p></div><div><p className="text-sm text-gray-500">خروج</p><p className="font-bold mt-1">{toJalali(booking.check_out)}</p></div><div><p className="text-sm text-gray-500">مدت</p><p className="font-bold mt-1">{toPersianDigits(booking.nights)} شب</p></div><div><p className="text-sm text-gray-500">مهمانان</p><p className="font-bold mt-1">{toPersianDigits(booking.adults + booking.children)} نفر</p></div></div>
        </section>
        {units.map((u: any) => <section key={u.accommodation_id} className="border rounded-2xl overflow-hidden">
          {u.images?.[0] && <img src={u.images[0]} alt={u.title} className="w-full h-52 object-cover"/>}
          <div className="p-5"><h2 className="font-black text-lg">{u.title}</h2><p className="text-gray-500 text-sm mt-1 flex items-center gap-1"><MapPin className="w-4 h-4"/>{u.city || u.address}</p><p className="text-gray-600 text-sm mt-3">ورود {u.check_in_time} · خروج {u.check_out_time}</p><div className="flex flex-wrap gap-2 mt-3">{(u.amenities || []).slice(0, 8).map((x: string) => <span key={x} className="bg-gray-50 border rounded-full px-3 py-1 text-xs">{x}</span>)}</div></div>
        </section>)}
        <section className="border rounded-2xl p-5"><h2 className="font-black text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-brand"/> قوانین ثبت‌شده هنگام رزرو</h2><p className="text-gray-600 mt-3">سیاست کنسلیشن: <b>{booking.cancellation_policy}</b></p><p className="text-xs text-gray-400 mt-2">جزئیات قیمت و قوانین از زمان ثبت رزرو به‌صورت اسنپ‌شات ذخیره شده‌اند.</p></section>
      </div>
      <aside className="h-fit border rounded-2xl p-5">
        <h2 className="font-black flex items-center gap-2"><ReceiptText className="w-5 h-5 text-brand"/> خلاصه مالی</h2>
        <div className="space-y-3 mt-5 text-sm">
          <div className="flex justify-between"><span>مبلغ اقامت</span><span>{formatToman(booking.base_amount)}</span></div><div className="flex justify-between"><span>نظافت و هزینه اضافه</span><span>{formatToman(booking.cleaning_fee + booking.extra_guest_amount)}</span></div>{booking.discount_amount > 0 && <div className="flex justify-between text-green-700"><span>تخفیف</span><span>−{formatToman(booking.discount_amount)}</span></div>}
          <div className="border-t pt-3 flex justify-between font-black"><span>جمع کل</span><span>{formatToman(booking.total_amount)}</span></div><div className="flex justify-between"><span>پرداخت‌شده</span><span>{formatToman(booking.paid_amount)}</span></div><div className="flex justify-between"><span>مانده</span><span>{formatToman(booking.remaining_amount)}</span></div>
        </div>
        <Link href={`/checkout/${booking.id}`} className="block text-center bg-brand text-white font-bold rounded-xl py-3 mt-5">مدیریت رزرو / پرداخت</Link>
        <p className="text-[11px] text-gray-400 mt-3 text-center">ثبت‌شده در {booking.created_at ? new Date(booking.created_at).toLocaleDateString('fa-IR') : '—'}</p>
      </aside>
    </div>
  </main>;
}
