'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatToman, toJalali } from '@/lib/persian';
import { ErrorState, LoadingState } from '@/components/PageStates';

export default function HostCalendar() {
  const params = useParams();
  const id = params.id as string;
  const [updates, setUpdates] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState('');

  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: ['calendar', id],
    queryFn: async () => (await api.get(`/host/accommodations/${id}/calendar`)).data,
  });
  if (isLoading) return <LoadingState label="در حال بارگذاری تقویم اقامتگاه…"/>;
  if (isError) return <main className="page-shell py-12"><ErrorState title="تقویم اقامتگاه بارگذاری نشد" onRetry={() => refetch()} href="/host/dashboard"/></main>;

  const save = async () => {
    const list = Object.values(updates);
    if (!list.length) return;
    await api.put(`/host/accommodations/${id}/calendar`, { updates: list });
    setMsg(`${list.length} روز به‌روزرسانی شد`);
    setUpdates({});
    refetch();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">تقویم و قیمت‌گذاری</h1>
      <p className="text-gray-500 mt-1">قیمت هر شب و در دسترس بودن را تنظیم کنید. روزهای مسدود (is_available=false) قابل رزرو نیستند.</p>
      {msg && <p className="bg-green-50 text-green-700 rounded-xl px-4 py-3 mt-6">{msg}</p>}

      <div className="border rounded-2xl mt-8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-3 text-right">تاریخ</th><th className="p-3 text-right">قیمت (تومان)</th><th className="p-3 text-right">در دسترس</th><th className="p-3 text-right">یادداشت</th></tr></thead>
          <tbody>
            {(data?.items || []).slice(0, 30).map((item: any) => (
              <tr key={item.date} className="border-t">
                <td className="p-3">{toJalali(item.date)}</td>
                <td className="p-3"><input type="number" defaultValue={item.price} onChange={(e) => setUpdates({ ...updates, [item.date]: { date: item.date, price: Number(e.target.value), is_available: item.is_available } })} className="border rounded-lg px-2 py-1.5 w-32" /></td>
                <td className="p-3"><input type="checkbox" defaultChecked={item.is_available} onChange={(e) => setUpdates({ ...updates, [item.date]: { date: item.date, price: item.price, is_available: e.target.checked } })} /></td>
                <td className="p-3 text-gray-400 text-xs">{item.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data?.items || data.items.length === 0) && <p className="p-8 text-center text-gray-400">قیمت روزانه‌ای ثبت نشده است — قیمت پایه ({formatToman(data?.base_price || 0)}) ملاک است.</p>}
      </div>
      <button onClick={save} className="w-full bg-brand text-white font-bold rounded-xl py-4 mt-6 hover:bg-brand-dark">ذخیره تغییرات</button>
    </div>
  );
}
