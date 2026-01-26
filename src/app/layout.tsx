
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/hooks/useCart';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";
import BottomNav from '@/components/BottomNav';
import { Inter } from 'next/font/google'
import { VoucherProvider } from '@/hooks/useVouchers';
import { AuthProvider } from '@/hooks/useAuth';
import { NotificationProvider } from '@/hooks/useNotifications';
import { usePathname } from 'next/navigation';
import { ProductProvider } from '@/hooks/useProducts';
import { OfferProvider } from '@/hooks/useOffers';
import { WishlistProvider } from '@/hooks/useWishlist';
import VoucherPopup from '@/components/VoucherPopup';
import FlashSalePopup from '@/components/FlashSalePopup';
import { useState, Suspense, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

const inter = Inter({ subsets: ['latin'] })

// Metadata cannot be exported from a client component.
// We can keep it here, but it won't be used unless we move it to a server component.
// For the purpose of this fix, we'll keep the layout as a client component.
// export const metadata: Metadata = {
//   title: 'PabnaMart',
//   description: 'Your one-stop shop for everything you need.',
// };

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isAffiliatePage = pathname.startsWith('/affiliate');
  const [isFlashSalePopupOpen, setIsFlashSalePopupOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
        localStorage.setItem('referrerId', ref);
    }
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <VoucherProvider>
            <OfferProvider>
              <ProductProvider>
                <CartProvider>
                  <WishlistProvider>
                    <NotificationProvider>
                        {!isAdminPage && (
                           <Suspense fallback={<div className="h-16 bg-background border-b" />}>
                             <Header />
                           </Suspense>
                        )}
                        <main className={(isAdminPage || isAffiliatePage) ? '' : "pb-16 md:pb-0"}>{children}</main>
                        <Toaster />
                        {!isAdminPage && !isAffiliatePage && <BottomNav />}
                        {!isAdminPage && <VoucherPopup isFlashSalePopupOpen={isFlashSalePopupOpen} />}
                        {!isAdminPage && <FlashSalePopup onOpenChange={setIsFlashSalePopupOpen} />}
                    </NotificationProvider>
                  </WishlistProvider>
                </CartProvider>
              </ProductProvider>
            </OfferProvider>
          </VoucherProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayoutContent>{children}</RootLayoutContent>
}
