'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function NewAccommodation() {
  const router = useRouter();
  const { data: cities, isLoading: citiesLoading, isError: citiesError, refetch: refetchCities } = useQuery({ queryKey: ['cities'], queryFn: async () => (await api.get('/cities')).data });
  const [form, setForm] = useState({ title: '', description: '', city_id: '', base_price: '', cleaning_fee: '', extra_guest_fee: '', max_capacity: '4', bedrooms_count: '1', beds_count: '2', bathrooms_count: '1', prepayment_percent: '30', cancellation_policy: 'moderate', is_instant_booking: false, image_urls: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/host/accommodations', {
        title: form.title, description: form.description, city_id: form.city_id || undefined,
        base_price: Number(form.base_price) || 0, cleaning_fee: Number(form.cleaning_fee) || 0, extra_guest_fee: Number(form.extra_guest_fee) || 0,
        max_capacity: Number(form.max_capacity), bedrooms_count: Number(form.bedrooms_count), beds_count: Number(form.beds_count), bathrooms_count: Number(form.bathrooms_count),
        prepayment_percent: Number(form.prepayment_percent), cancellation_policy: form.cancellation_policy, is_instant_booking: form.is_instant_booking,
        image_urls: form.image_urls ? form.image_urls.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      await api.post(`/host/accommodations/${res.data.id}/submit-review`, {});
      alert('اقامتگاه ساخته و برای بررسی ارسال شد!');
      router.push('/host/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'خطا در ساخت اقامتگاه');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border rounded-xl px-4 py-3 outline-none focus:border-brand";
  const labelCls = "text-sm font-bold block mb-1.5";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black">ساخت اقامتگاه جدید</h1>
      <p className="text-gray-500 mt-1">پس از ثبت، اقامتگاه برای بررسی ادمین ارسال می‌شود.</p>
      {citiesLoading && <p role="status" className="mt-4 rounded-xl bg-brand-light/50 px-4 py-3 text-sm text-muted">در حال دریافت فهرست شهرها…</p>}
      {citiesError && <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-error/10 px-4 py-3 text-sm text-error"><span>فهرست شهرها دریافت نشد؛ امکان انتخاب مقصد موقتاً محدود است.</span><button type="button" onClick={() => refetchCities()} className="font-black underline">تلاش دوباره</button></div>}
      {error && <p className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mt-6">{error}</p>}

      <div className="space-y-5 mt-8">
        <div><label className={labelCls}>عنوان اقامتگاه *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="مثلاً ویلای ساحلی در کیش" /></div>
        <div><label className={labelCls}>توضیحات</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={4} /></div>
        <div><label className={labelCls}>شهر</label>
          <select value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })} className={inputCls}>
            <option value="">انتخاب شهر...</option>
            {(cities || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className={labelCls}>قیمت هر شب (تومان)</label><input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>هزینه نظافت</label><input type="number" value={form.cleaning_fee} onChange={(e) => setForm({ ...form, cleaning_fee: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>مهمان اضافه / شب</label><input type="number" value={form.extra_guest_fee} onChange={(e) => setForm({ ...form, extra_guest_fee: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div><label className={labelCls}>ظرفیت</label><input type="number" value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>اتاق</label><input type="number" value={form.bedrooms_count} onChange={(e) => setForm({ ...form, bedrooms_count: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>تخت</label><input type="number" value={form.beds_count} onChange={(e) => setForm({ ...form, beds_count: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>حمام</label><input type="number" value={form.bathrooms_count} onChange={(e) => setForm({ ...form, bathrooms_count: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>بیعانه (٪)</label><input type="number" value={form.prepayment_percent} onChange={(e) => setForm({ ...form, prepayment_percent: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>قانون کنسلیشن</label>
            <select value={form.cancellation_policy} onChange={(e) => setForm({ ...form, cancellation_policy: e.target.value })} className={inputCls}>
              <option value="flexible">انعطاف‌پذیر</option><option value="moderate">متوسط</option><option value="strict">سخت‌گیرانه</option><option value="non_refundable">غیرقابل استرداد</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 border rounded-xl px-4 py-3 cursor-pointer"><input type="checkbox" checked={form.is_instant_booking} onChange={(e) => setForm({ ...form, is_instant_booking: e.target.checked })} /> <span className="font-bold text-sm">رزرو فوری (بدون نیاز به تأیید میزبان)</span></label>
        <div><label className={labelCls}>لینک عکس‌ها (با کاما جدا کنید)</label><input value={form.image_urls} onChange={(e) => setForm({ ...form, image_urls: e.target.value })} className={inputCls} placeholder="https://... , https://..." dir="ltr" /></div>
        <button onClick={submit} disabled={loading} className="w-full bg-brand text-white font-bold rounded-xl py-4 hover:bg-brand-dark disabled:opacity-50">{loading ? 'در حال ثبت...' : 'ثبت و ارسال برای بررسی'}</button>
      </div>
    </div>
  );
}
