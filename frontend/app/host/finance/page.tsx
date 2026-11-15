'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatToman } from '@/lib/persian';
import { Wallet, ArrowDownToLine } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/PageStates';

export default function HostFinance() {
  const { data, refetch, isLoading, isError } = useQuery({ queryKey: ['host-finance'], queryFn: async () => (await api.get('/host/finance')).data });
  if (isLoading) return <LoadingState label="در حال دریافت گزارش مالی…"/>;
  if (isError) return <main className="page-shell py-12"><ErrorState title="اطلاعات مالی در دسترس نیست" onRetry={() => refetch()} href="/host/dashboard"/></main>;

  const requestPayout = async () => {
    try {
      await api.post('/host/payouts/request', {});
      alert('درخواست برداشت ثبت شد');
      refetch();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'خطا');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">مالی و برداشت</h1>
      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        <div className="border rounded-2xl p-5 bg-green-50"><p className="text-gray-500 text-sm">قابل برداشت</p><p className="text-2xl font-black mt-1">{formatToman(data?.available_balance || 0)}</p></div>
        <div className="border rounded-2xl p-5 bg-yellow-50"><p className="text-gray-500 text-sm">در انتظار تسویه</p><p className="text-2xl font-black mt-1">{formatToman(data?.pending_balance || 0)}</p></div>
        <div className="border rounded-2xl p-5"><p className="text-gray-500 text-sm">مجموع درآمد</p><p className="text-2xl font-black mt-1">{formatToman(data?.total_earned || 0)}</p></div>
      </div>
      <button onClick={requestPayout} className="w-full bg-brand text-white font-bold rounded-xl py-4 mt-6 flex items-center justify-center gap-2 hover:bg-brand-dark"><ArrowDownToLine className="w-5 h-5" /> درخواست برداشت به حساب بانکی</button>
      <h2 className="font-black text-lg mt-10 mb-4">تاریخچه برداشت‌ها</h2>
      <div className="space-y-3">
        {(data?.payouts || []).map((p: any) => (
          <div key={p.id} className="border rounded-xl p-4 flex justify-between text-sm">
            <span>{formatToman(p.amount)}</span><span className="font-bold">{p.status}</span>
          </div>
        ))}
        {(!data?.payouts || data.payouts.length === 0) && <p className="text-gray-400 text-center py-8">برداشتی ثبت نشده است.</p>}
      </div>
      <p className="text-xs text-gray-400 mt-6 flex items-center gap-2"><Wallet className="w-4 h-4" /> کمیسیون پلتفرم ۱۰٪ از مبلغ کل کسر می‌شود. تسویه حداکثر ۳ روز کاری پس از پایان اقامت.</p>
    </div>
  );
}
