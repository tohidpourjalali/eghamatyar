'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, Home, Calendar, FileCheck, Check, X } from 'lucide-react';
import { formatToman, toPersianDigits } from '@/lib/persian';
import { ErrorState, LoadingState } from '@/components/PageStates';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({ queryKey: ['admin-stats'], queryFn: async () => (await api.get('/admin/dashboard/stats')).data });
  const { data: docs, isLoading: docsLoading, isError: docsError, refetch: refetchDocs } = useQuery({ queryKey: ['admin-docs'], queryFn: async () => (await api.get('/admin/documents/pending')).data });
  const { data: pendingAccs, isLoading: accsLoading, isError: accsError, refetch: refetchAccs } = useQuery({ queryKey: ['admin-accs'], queryFn: async () => (await api.get('/admin/accommodations/pending')).data });
  const { data: payouts, isLoading: payoutsLoading, isError: payoutsError, refetch: refetchPayouts } = useQuery({ queryKey: ['admin-payouts'], queryFn: async () => (await api.get('/admin/payouts/pending')).data });
  if (statsError || docsError || accsError || payoutsError) return <main className="page-shell py-12"><ErrorState title="پنل مدیریت بارگذاری نشد" description="برخی از گزارش‌ها یا صف‌های بررسی در دسترس نیستند." onRetry={() => {refetchStats();refetchDocs();refetchAccs();refetchPayouts();}}/></main>;
  if (statsLoading || docsLoading || accsLoading || payoutsLoading) return <LoadingState label="در حال دریافت اطلاعات پنل مدیریت…"/>;

  const reviewDoc = async (id: string, action: string) => {
    await api.post(`/admin/documents/${id}/review`, { action });
    window.location.reload();
  };
  const reviewAcc = async (id: string, action: string) => {
    await api.post(`/admin/accommodations/${id}/${action}`, {});
    window.location.reload();
  };
  const reviewPayout = async (id: string, action: 'paid' | 'reject') => {
    const entered = action === 'paid' ? window.prompt('کد پیگیری حواله را وارد کنید') : undefined;
    if (action === 'paid' && entered === null) return;
    const tracking_code = entered || undefined;
    await api.post(`/admin/payouts/${id}/review`, { action, tracking_code });
    window.location.reload();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">پنل ادمین</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          { icon: Users, label: 'کاربران', value: stats?.total_users },
          { icon: Home, label: 'اقامتگاه منتشرشده', value: stats?.published_accommodations },
          { icon: Calendar, label: 'رزروها', value: stats?.total_bookings },
          { icon: FileCheck, label: 'مدارک در انتظار', value: stats?.pending_documents },
        ].map((s) => (
          <div key={s.label} className="border rounded-2xl p-5"><s.icon className="w-8 h-8 text-brand mb-3" /><p className="text-2xl font-black">{toPersianDigits(s.value || 0)}</p><p className="text-gray-500 text-sm">{s.label}</p></div>
        ))}
      </div>

      <h2 className="text-xl font-black mt-10 mb-4">مدارک در انتظار بررسی ({toPersianDigits(docs?.length || 0)})</h2>
      <div className="space-y-3">
        {(docs || []).map((d: any) => (
          <div key={d.id} className="border rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1"><p className="font-bold">{d.document_type}</p><p className="text-gray-500 text-xs" dir="ltr">{d.file_url}</p></div>
            <button onClick={() => reviewDoc(d.id, 'approve')} className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1"><Check className="w-4 h-4" /> تأیید</button>
            <button onClick={() => reviewDoc(d.id, 'reject')} className="border border-red-200 text-red-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1"><X className="w-4 h-4" /> رد</button>
          </div>
        ))}
        {(!docs || docs.length === 0) && <p className="text-gray-400">مدرک در انتظاری نیست.</p>}
      </div>

      <h2 className="text-xl font-black mt-10 mb-4">اقامتگاه‌های در انتظار انتشار ({toPersianDigits(pendingAccs?.length || 0)})</h2>
      <div className="space-y-3">
        {(pendingAccs || []).map((a: any) => (
          <div key={a.id} className="border rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1"><p className="font-bold">{a.title}</p><p className="text-gray-500 text-sm">{a.city}</p></div>
            <button onClick={() => reviewAcc(a.id, 'approve')} className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">انتشار</button>
            <button onClick={() => reviewAcc(a.id, 'reject')} className="border border-red-200 text-red-600 px-4 py-2 rounded-full text-sm font-bold">رد</button>
          </div>
        ))}
        {(!pendingAccs || pendingAccs.length === 0) && <p className="text-gray-400">اقامتگاه در انتظاری نیست.</p>}
      </div>

      <h2 className="text-xl font-black mt-10 mb-4">درخواست‌های برداشت میزبان ({toPersianDigits(payouts?.length || 0)})</h2>
      <div className="space-y-3">
        {(payouts || []).map((p: any) => (
          <div key={p.id} className="border rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48"><p className="font-bold">{formatToman(p.amount)}</p><p className="text-gray-500 text-xs">میزبان: {p.host_id}</p><p className="text-gray-500 text-xs" dir="ltr">{p.sheba_number}</p></div>
            <button onClick={() => reviewPayout(p.id, 'paid')} className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">ثبت حواله پرداخت‌شده</button>
            <button onClick={() => reviewPayout(p.id, 'reject')} className="border border-red-200 text-red-600 px-4 py-2 rounded-full text-sm font-bold">رد درخواست</button>
          </div>
        ))}
        {(!payouts || payouts.length === 0) && <p className="text-gray-400">درخواست برداشتی در انتظار نیست.</p>}
      </div>
    </div>
  );
}
