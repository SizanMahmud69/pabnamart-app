
"use client";

import { useState, Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CartProvider } from '@/hooks/useCart';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";
import BottomNav from '@/components/BottomNav';
import { VoucherProvider } from '@/hooks/useVouchers';
import { AuthProvider } from '@/hooks/useAuth';
import { NotificationProvider } from '@/hooks/useNotifications';
import { ProductProvider } from '@/hooks/useProducts';
import { OfferProvider } from '@/hooks/useOffers';
import { WishlistProvider } from '@/hooks/useWishlist';
import VoucherPopup from '@/components/VoucherPopup';
import FlashSalePopup from '@/components/FlashSalePopup';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPage = pathname.startsWith('/admin');
  const isAffiliatePage = pathname.startsWith('/affiliate');
  const [isFlashSalePopupOpen, setIsFlashSalePopupOpen] = useState(false);

  useEffect(() => {
    // Safely check search params on client mount to avoid hydration errors
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            localStorage.setItem('referrerId', ref);
        }
        const productId = params.get('product_id');
        if (productId) {
            if (!pathname.startsWith(`/products/${productId}`)) {
                router.push(`/products/${productId}`);
            }
        }
    }
  }, [pathname, router]);

  return (
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
                  <main className={(isAdminPage || isAffiliatePage) ? '' : "pb-16 md:pb-0"}>
                    {children}
                  </main>
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
  );
}
