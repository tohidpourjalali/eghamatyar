import InfoPage from '@/components/InfoPage';
import { Compass, ShieldCheck, HeartHandshake, MapPinned, BadgeCheck, Sparkles } from 'lucide-react';

const values = [
  { Icon: HeartHandshake, title: 'مهمان‌نوازی ایرانی', text: 'ما باور داریم یک سفر خوب با یک خوشامدگویی گرم شروع می‌شود. تجربهٔ میزبان و مهمان باید برای هر دو طرف محترمانه و روشن باشد.' },
  { Icon: ShieldCheck, title: 'اعتماد در هر قدم', text: 'اطلاعات اقامتگاه‌ها پیش از انتشار بررسی می‌شود. قیمت، زمان پرداخت و شرایط لغو هم پیش از ثبت درخواست در دسترس شماست.' },
  { Icon: MapPinned, title: 'ایرانِ رنگارنگ', text: 'از خانه‌های حیاط‌دار شهرهای کویری تا کلبه‌های سبز شمال و اقامتگاه‌های ساحلی جنوب؛ سفر نزدیک‌تر از چیزی است که فکر می‌کنیم.' },
];

export default function AboutPage() {
  return <InfoPage eyebrow="قصهٔ اقامت‌یار" title="سفر، به سبک خانه" Icon={Compass} intro="اقامت‌یار پلی است میان آدم‌هایی که دوست دارند ایران را کشف کنند و میزبان‌هایی که دلشان می‌خواهد گوشه‌ای از خانه و فرهنگشان را با دیگران شریک شوند.">
    <p>اقامت‌یار برای ساده‌کردن یک سؤال آشنا ساخته شد: «کجا بمانیم که سفرمان حسِ خانه داشته باشد؟» ما امکان می‌دهیم اقامتگاه‌های متنوع را ببینید، جزئیات و هزینه را شفاف مقایسه کنید و با اطمینان درخواست رزرو بدهید.</p>
    <div className="my-8 grid gap-4 md:grid-cols-3">{values.map(({Icon:ValueIcon,title,text})=><section key={title} className="rounded-3xl border border-line bg-surface p-5 shadow-card"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-light text-brand"><ValueIcon className="h-5 w-5"/></span><h2 className="!mt-4 !text-base">{title}</h2><p className="!text-xs !leading-7">{text}</p></section>)}</div>
    <h2>چطور کار می‌کنیم؟</h2><p>میزبان مشخصات اقامتگاه، عکس‌ها، قیمت‌ها و تقویم را ثبت می‌کند. پس از بررسی اطلاعات، اقامتگاه برای جستجو در دسترس قرار می‌گیرد. مسافر می‌تواند گزینه‌های مناسب را پیدا کند، قیمت نهایی را ببیند و رزرو فوری یا درخواست رزرو ثبت کند.</p>
    <h2>تعهد ما به شفافیت</h2><p>پیش از پرداخت، مبلغ اقامت، هزینهٔ نظافت، هزینهٔ مهمان اضافه در صورت وجود، تخفیف و برنامهٔ پرداخت نمایش داده می‌شود. سیاست کنسلیشن و جزئیات رزرو در زمان ثبت، ذخیره می‌شوند تا مبنای همان سفر باقی بمانند.</p>
    <h2>برای میزبان‌ها</h2><p>اقامت‌یار ابزارهایی برای مدیریت تقویم، قیمت شبانه، درخواست‌های رزرو، گزارش مالی و درخواست تسویه فراهم می‌کند. احراز هویت و بررسی اقامتگاه بخشی از تعهد ما به میزبانی مسئولانه است.</p>
    <div className="mt-8 flex flex-wrap gap-3"><a href="/search" className="button-primary"><Sparkles className="h-4 w-4"/> پیدا کردن اقامتگاه</a><a href="/host/register" className="button-outline"><BadgeCheck className="h-4 w-4"/> آشنایی با میزبانی</a></div>
  </InfoPage>;
}
