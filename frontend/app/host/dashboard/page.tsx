'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Home, Calendar, Wallet, Star, Plus, Clock } from 'lucide-react';
import { formatToman, toPersianDigits } from '@/lib/persian';
import { ErrorState, LoadingState } from '@/components/PageStates';

export default function HostDashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({ queryKey: ['host-stats'], queryFn: async () => (await api.get('/host/dashboard/stats')).data });
  const { data: accs, isLoading: accsLoading, isError: accsError, refetch: refetchAccs } = useQuery({ queryKey: ['host-accs'], queryFn: async () => (await api.get('/host/accommodations')).data });
  if (statsError || accsError) return <main className="page-shell py-12"><ErrorState title="داشبورد میزبان بارگذاری نشد" description="اطلاعات درآمد یا اقامتگاه‌ها دریافت نشد." onRetry={() => {refetchStats();refetchAccs();}}/></main>;
  if (statsLoading || accsLoading) return <LoadingState label="در حال آماده‌سازی داشبورد میزبان…"/>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">داشبورد میزبان</h1>
        <Link href="/host/accommodations/new" className="bg-brand text-white px-5 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-brand-dark"><Plus className="w-4 h-4" /> اقامتگاه جدید</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          { icon: Home, label: 'اقامتگاه‌ها', value: stats?.total_accommodations || 0 },
          { icon: Calendar, label: 'رزروهای تأییدشده', value: stats?.confirmed_bookings || 0 },
          { icon: Clock, label: 'در انتظار تأیید', value: stats?.pending_approvals || 0 },
          { icon: Wallet, label: 'درآمد تقریبی', value: formatToman(stats?.total_earned_estimate || 0) },
        ].map((s) => (
          <div key={s.label} className="border rounded-2xl p-5">
            <s.icon className="w-8 h-8 text-brand mb-3" />
            <p className="text-2xl font-black">{typeof s.value === 'number' ? toPersianDigits(s.value) : s.value}</p>
            <p className="text-gray-500 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-black mt-10 mb-4">اقامتگاه‌های من</h2>
      <div className="space-y-3">
        {(accs?.items || []).map((a: any) => (
          <div key={a.id} className="border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition">
            <img src={a.cover_image} alt="" className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{a.title}</p>
              <p className="text-gray-500 text-sm">{a.city?.name} • {formatToman(a.base_price)} / شب • وضعیت: {a.status}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/host/calendar/${a.id}`} className="border rounded-full px-4 py-2 text-sm font-bold hover:bg-gray-50">تقویم و قیمت</Link>
              <Link href={`/accommodations/${a.id}`} className="bg-gray-900 text-white rounded-full px-4 py-2 text-sm font-bold">مشاهده</Link>
            </div>
          </div>
        ))}
        {(!accs?.items || accs.items.length === 0) && <p className="text-gray-400 text-center py-10">هنوز اقامتگاهی نساخته‌اید. اولین اقامتگاه را بسازید!</p>}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        <Link href="/host/bookings" className="border rounded-2xl p-5 hover:shadow-md transition"><Calendar className="w-6 h-6 text-brand mb-2" /><p className="font-bold">رزروهای دریافتی</p><p className="text-gray-500 text-sm">تأیید یا رد درخواست‌ها</p></Link>
        <Link href="/host/finance" className="border rounded-2xl p-5 hover:shadow-md transition"><Wallet className="w-6 h-6 text-brand mb-2" /><p className="font-bold">مالی و برداشت</p><p className="text-gray-500 text-sm">موجودی و درخواست تسویه</p></Link>
        <Link href="/host/register" className="border rounded-2xl p-5 hover:shadow-md transition"><Star className="w-6 h-6 text-brand mb-2" /><p className="font-bold">احراز هویت میزبان</p><p className="text-gray-500 text-sm">مدارک و حساب بانکی</p></Link>
      </div>
    </div>
  );
}
