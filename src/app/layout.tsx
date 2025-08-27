import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";
import BottomNav from '@/components/BottomNav';
import { Inter } from 'next/font/google'
import { VoucherProvider } from '@/hooks/useVouchers';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PabnaMart',
  description: 'Your one-stop shop for everything you need.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VoucherProvider>
          <CartProvider>
            <Header />
            <main className="pb-16 md:pb-0">{children}</main>
            <Toaster />
            <BottomNav />
          </CartProvider>
        </VoucherProvider>
      </body>
    </html>
  );
}
