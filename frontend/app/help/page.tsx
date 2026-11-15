import InfoPage from '@/components/InfoPage';
import FaqAccordion from '@/components/FaqAccordion';
import Link from 'next/link';
import { CircleHelp, Search, CalendarCheck, CreditCard, ShieldCheck, Headset } from 'lucide-react';

const faqs = [
  { question: 'چطور اقامتگاه رزرو کنم؟', answer: 'مقصد و تاریخ سفر را جستجو کنید، اقامتگاه را باز کنید و ظرفیت، امکانات و قوانین را بخوانید. پس از انتخاب تاریخ، برآورد کامل هزینه نمایش داده می‌شود. سپس می‌توانید درخواست رزرو بفرستید یا در اقامتگاه‌های دارای رزرو آنی، مستقیم به مرحلهٔ پرداخت بروید.' },
  { question: 'تفاوت رزرو آنی با درخواست رزرو چیست؟', answer: 'در رزرو آنی، میزبان از پیش امکان تأیید خودکار را فعال کرده و پس از پرداخت بیعانه رزرو قطعی می‌شود. در درخواست رزرو، میزبان باید درخواست را بپذیرد؛ پس از پذیرش، مهلت پرداخت بیعانه در جزئیات رزرو نمایش داده می‌شود.' },
  { question: 'چه زمانی باید پرداخت کنم؟', answer: 'در حالت پیش‌فرض ۳۰٪ مبلغ به‌عنوان بیعانه پرداخت می‌شود. باقیمانده باید حداکثر تا ۳ روز پیش از ورود تسویه شود. اگر درصد بیعانهٔ اقامتگاه متفاوت باشد، مقدار دقیق پیش از ثبت رزرو نشان داده می‌شود.' },
  { question: 'قیمت نهایی شامل چه چیزهایی است؟', answer: 'قیمت شب‌ها، هزینهٔ نظافت، هزینهٔ مهمان اضافه در صورت وجود، و تخفیف احتمالی در برآورد دیده می‌شوند. کارمزد پلتفرم از سهم میزبان محاسبه می‌شود و به‌صورت هزینهٔ جداگانه به مهمان اضافه نمی‌شود.' },
  { question: 'اگر رزرو را لغو کنم چقدر بازپرداخت می‌گیرم؟', answer: 'میزان بازپرداخت با توجه به سیاست کنسلیشن همان اقامتگاه و زمانی که لغو می‌کنید محاسبه می‌شود. نسخهٔ سیاست در لحظهٔ رزرو ذخیره می‌شود و همان نسخه برای همان رزرو ملاک است. پیش از تأیید لغو، مبلغ محاسبه‌شده نمایش داده می‌شود.' },
  { question: 'چه زمانی نشانی دقیق را می‌بینم؟', answer: 'محدوده و شهر اقامتگاه را پیش از رزرو می‌بینید. اطلاعات دقیق ورود و نشانی کامل پس از قطعی‌شدن رزرو، مطابق جزئیاتی که میزبان ثبت کرده، در صفحهٔ رزرو در دسترس قرار می‌گیرد.' },
  { question: 'چطور میزبان شوم؟', answer: 'از بخش «میزبان شوید» وارد پنل شوید، اطلاعات هویتی لازم و حساب بانکی را ثبت کنید و مدارک را برای بررسی بفرستید. پس از تأیید هویت، می‌توانید اقامتگاه بسازید و برای انتشار ارسال کنید.' },
  { question: 'اگر پرداخت ناموفق شد چه کنم؟', answer: 'ابتدا وضعیت رزرو و پرداخت را در «سفرهای من» بررسی کنید. اگر مبلغ از حساب کم شده ولی وضعیت به‌روز نشده، دوباره پرداخت نکنید؛ کد رزرو و رسید را برای پشتیبانی ارسال کنید تا تراکنش بررسی شود.' },
];
const topics = [{Icon:Search,title:'جستجو و انتخاب'},{Icon:CalendarCheck,title:'رزرو و تغییر برنامه'},{Icon:CreditCard,title:'پرداخت و بازپرداخت'},{Icon:ShieldCheck,title:'امنیت و احراز هویت'}];

export default function HelpPage() { return <InfoPage eyebrow="مرکز راهنمای اقامت‌یار" title="پاسخ سفر را اینجا پیدا کن" Icon={CircleHelp} intro="راهنمای روشن برای جستجو، رزرو، پرداخت و میزبانی؛ اگر جواب سؤالت را پیدا نکردی، تیم پشتیبانی در دسترس است.">
  <div className="mb-9 grid grid-cols-2 gap-3 sm:grid-cols-4">{topics.map(({Icon,title})=><div key={title} className="rounded-2xl border border-line bg-surface p-4 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-brand-light text-brand"><Icon className="h-5 w-5"/></span><p className="mt-3 text-xs font-bold text-ink">{title}</p></div>)}</div>
  <h2 className="!mt-0">سؤالات پرتکرار</h2><FaqAccordion items={faqs}/>
  <div className="mt-10 flex flex-col gap-4 rounded-3xl bg-brand-light/45 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><Headset className="mt-1 h-5 w-5 shrink-0 text-brand"/><div><h3 className="!mt-0">هنوز کمکی لازم داری؟</h3><p>جزئیات رزرو را آماده کن و با تیم پشتیبانی در ارتباط باش.</p></div></div><Link href="/support" className="button-primary shrink-0">رفتن به پشتیبانی</Link></div>
</InfoPage>; }
