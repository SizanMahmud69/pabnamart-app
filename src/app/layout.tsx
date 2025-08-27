import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";
import BottomNav from '@/components/BottomNav';

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <CartProvider>
          <Header />
          <main className="pb-16 md:pb-0">{children}</main>
          <Toaster />
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
