import InfoPage from '@/components/InfoPage';
import Link from 'next/link';
import { Mail, Phone, Headset, MessageCircle, ArrowLeft } from 'lucide-react';

const channels = [
  { Icon: Mail, title: 'ایمیل پشتیبانی', value: 'support@eghamatyar.ir', href: 'mailto:support@eghamatyar.ir', note: 'برای پیگیری رزرو، پرداخت یا پیشنهادها' },
  { Icon: Phone, title: 'تماس تلفنی', value: '۰۲۱-۹۱۰۰۰۰۰۰', href: 'tel:02191000000', note: 'برای گفت‌وگوی مستقیم با پشتیبانی' },
  { Icon: MessageCircle, title: 'درخواست پشتیبانی', value: 'ثبت پیام', href: '/support', note: 'موضوع و کد رزرو را برای رسیدگی سریع‌تر آماده کنید' },
];

export default function ContactPage() { return <InfoPage eyebrow="همیشه در دسترسِ گفت‌وگو" title="با ما در تماس باش" Icon={Headset} intro="سؤالی دربارهٔ سفر یا رزرو داری؟ پیام بده؛ برای کمک سریع‌تر، کد رزرو و شمارهٔ موبایلی که با آن وارد شده‌ای را همراه داشته باش.">
  <div className="grid gap-4 md:grid-cols-3">{channels.map(({Icon,title,value,href,note})=><a key={title} href={href} className="group rounded-3xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-1 hover:shadow-warm"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-light text-brand"><Icon className="h-5 w-5"/></span><h2 className="!mt-4 !text-base">{title}</h2><p className="!text-sm !font-black !text-brand" dir={title==='تماس تلفنی'?'ltr':undefined}>{value}</p><p className="mt-2 !text-xs">{note}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-muted transition group-hover:gap-2 group-hover:text-brand">رفتن به مسیر تماس <ArrowLeft className="h-3.5 w-3.5"/></span></a>)}</div>
  <h2>برای پیگیری یک رزرو</h2><p>در پیام خود کد رزرو، تاریخ سفر و توضیح کوتاهی از موضوع را بنویس. برای موضوع پرداخت، رسید یا شمارهٔ پیگیری درگاه را نیز نگه دار. اطلاعات کارت بانکی کامل، رمز پویا یا کد یک‌بارمصرف را در پیام نفرست.</p>
  <h2>موضوع‌های همکاری</h2><p>برای پیشنهاد همکاری، معرفی مقصد یا ارتباط رسانه‌ای می‌توانی از ایمیل پشتیبانی استفاده کنی و عنوان پیام را با موضوع درخواستت شروع کنی. برای شروع میزبانی هم به صفحهٔ <Link href="/host/register" className="font-bold text-brand hover:underline">ثبت‌نام میزبان</Link> سر بزن.</p>
</InfoPage>; }
