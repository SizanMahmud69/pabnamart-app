
"use client";

import { withAuth } from '@/hooks/useAuth';
import AffiliateBottomNav from '@/components/AffiliateBottomNav';
import type { ReactNode } from 'react';

function AffiliateLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-purple-50/30 min-h-screen">
            <main className="pb-16 md:pb-0">{children}</main>
            <AffiliateBottomNav />
        </div>
    );
}

export default withAuth(AffiliateLayout);
