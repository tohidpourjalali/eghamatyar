import '@fontsource-variable/vazirmatn';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import Providers from './providers';

export const metadata = {
  title: 'اقامت‌یار | سفر، به سبک خانه',
  description: 'اقامتگاه‌های ایرانی؛ از کلبه‌های شمال تا خانه‌های سنتی کویر. جستجو، مقایسه و رزرو امن با اقامت‌یار.',
  applicationName: 'اقامت‌یار',
  icons: { icon: '/brand-mark.svg' },
};

export const viewport = { themeColor: '#FDF8F3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl" suppressHydrationWarning data-scroll-behavior="smooth">
    <head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}` }}/></head>
    <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <Providers><Header/><main className="min-h-[70vh] pb-24 md:pb-0">{children}</main><Footer/><BottomNav/></Providers>
    </body>
  </html>;
}
