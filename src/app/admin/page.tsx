
"use client";

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Package, Users, ArrowRight, Tag, Ticket, Settings, ShoppingCart, CreditCard, Undo2, Star, Loader2, DollarSign, Coins, Image as ImageIcon, Zap, UserPlus } from "lucide-react";
import { cn } from '@/lib/utils';
import type { ModeratorPermissions, Order } from '@/types';
import { processWithdrawals } from '@/app/affiliate/actions';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';

const db = getFirestore(app);

const allMenuItems = [
    {
        title: "Product Management",
        description: "Add, edit, and remove products.",
        icon: Package,
        href: "/admin/products",
        permissionKey: 'canManageProducts'
    },
    {
        title: "Order Management",
        description: "View and process customer orders.",
        icon: ShoppingCart,
        href: "/admin/orders",
        permissionKey: 'canManageOrders',
        badgeKey: 'pendingOrders'
    },
    {
        title: "Quick Order Management",
        description: "Manage orders placed by guest users.",
        icon: Zap,
        href: "/admin/quick-orders",
        permissionKey: 'canManageQuickOrders',
        badgeKey: 'pendingQuickOrders'
    },
    {
        title: "Verify Payments",
        description: "Verify online payments for orders.",
        icon: CreditCard,
        href: "/admin/verify-payments",
        permissionKey: 'canVerifyPayments',
        badgeKey: 'pendingPayments'
    },
    {
        title: "Banner Management",
        description: "Add and remove homepage banners.",
        icon: ImageIcon,
        href: "/admin/banners",
        permissionKey: 'canManageBanners'
    },
    {
        title: "Return Requests",
        description: "Manage customer return requests.",
        icon: Undo2,
        href: "/admin/returns",
        permissionKey: 'canManageReturns',
        badgeKey: 'pendingReturns'
    },
    {
        title: "Review Management",
        description: "Approve or reject customer reviews.",
        icon: Star,
        href: "/admin/reviews",
        permissionKey: 'canManageReviews'
    },
    {
        title: "Offer Management",
        description: "Create and manage special offers.",
        icon: Tag,
        href: "/admin/offers",
        permissionKey: 'canManageOffers'
    },
    {
        title: "Voucher Management",
        description: "Create and distribute vouchers.",
        icon: Ticket,
        href: "/admin/vouchers",
        permissionKey: 'canManageVouchers'
    },
    {
        title: "Affiliate Requests",
        description: "Review and approve affiliate program applications.",
        icon: UserPlus,
        href: "/admin/affiliates",
        permissionKey: 'canManageAffiliates',
        badgeKey: 'pendingAffiliateRequests'
    },
    {
        title: "Withdrawal Requests",
        description: "Manage affiliate payment requests.",
        icon: DollarSign,
        href: "/admin/withdrawals",
        permissionKey: 'canManageWithdrawals',
        badgeKey: 'pendingWithdrawals'
    },
];

const AdminDashboard = () => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [loadingHref, setLoadingHref] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<ModeratorPermissions | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Counts for badges
    const [counts, setCounts] = useState({
        pendingPayments: 0,
        pendingOrders: 0,
        pendingQuickOrders: 0,
        pendingReturns: 0,
        pendingAffiliateRequests: 0,
        pendingWithdrawals: 0
    });

    useEffect(() => {
        const adminStatus = localStorage.getItem('isAdmin') === 'true';
        setIsAdmin(adminStatus);
        if (!adminStatus) {
            const storedPermissions = localStorage.getItem('moderatorPermissions');
            if (storedPermissions) {
                setPermissions(JSON.parse(storedPermissions));
            }
        }

        const triggerWithdrawals = async () => {
            try {
                await processWithdrawals(false);
            } catch (err) {
                console.error("Silent withdrawal trigger failed:", err);
            }
        };
        
        triggerWithdrawals();

        // Listen for real-time counts
        const ordersRef = collection(db, 'orders');
        const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
            const orders = snapshot.docs.map(doc => doc.data() as Order);
            setCounts(prev => ({
                ...prev,
                pendingPayments: orders.filter(o => o.paymentMethod !== 'cash-on-delivery' && o.status === 'pending').length,
                pendingOrders: orders.filter(o => !o.userId.startsWith('guest_') && o.status === 'pending').length,
                pendingQuickOrders: orders.filter(o => o.userId.startsWith('guest_') && o.status === 'pending').length,
                pendingReturns: orders.filter(o => o.status === 'return-requested').length
            }));
        });

        const reqsRef = collection(db, 'affiliateRequests');
        const unsubReqs = onSnapshot(query(reqsRef, where('status', '==', 'pending')), (snap) => {
            setCounts(prev => ({ ...prev, pendingAffiliateRequests: snap.size }));
        });

        const wdRef = collection(db, 'withdrawals');
        const unsubWd = onSnapshot(query(wdRef, where('status', '==', 'pending')), (snap) => {
            setCounts(prev => ({ ...prev, pendingWithdrawals: snap.size }));
        });

        return () => {
            unsubOrders();
            unsubReqs();
            unsubWd();
        };
    }, []);

    const menuItems = useMemo(() => {
        if (isAdmin) {
            return allMenuItems;
        }
        if (permissions) {
             return allMenuItems.filter(item => {
                return permissions[item.permissionKey as keyof ModeratorPermissions];
            });
        }
        return [];
    }, [isAdmin, permissions]);

    const handleNavigation = (href: string) => {
        setLoadingHref(href);
        startTransition(() => {
            router.push(href);
        });
    };

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <main className="mt-6">
                <h2 className="text-3xl font-bold mb-6 text-primary uppercase italic tracking-tighter">Welcome, {isAdmin ? 'Admin' : 'Moderator'}!</h2>
                <div className="space-y-4">
                    {menuItems.map((item, index) => {
                        const isLoading = isPending && loadingHref === item.href;
                        const badgeCount = item.badgeKey ? counts[item.badgeKey as keyof typeof counts] : 0;

                        return (
                            <div key={index} onClick={() => !isLoading && handleNavigation(item.href)} className="block">
                                <Card className={cn("hover:border-primary hover:shadow-lg transition-all relative overflow-hidden", isLoading ? "cursor-wait" : "cursor-pointer")}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-3 rounded-lg relative">
                                                <item.icon className="h-6 w-6 text-primary" />
                                                {badgeCount > 0 && (
                                                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white border-2 border-white shadow-md animate-in zoom-in">
                                                        {badgeCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold">{item.title}</h3>
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                                        ) : (
                                            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-30" />
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    })}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
