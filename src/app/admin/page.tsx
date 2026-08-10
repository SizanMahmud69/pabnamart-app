
"use client";

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Package, ArrowRight, Tag, Ticket, ShoppingCart, CreditCard, Undo2, 
    Star, Loader2, DollarSign, Coins, Image as ImageIcon, Zap, UserPlus,
    TrendingUp, TrendingDown, Clock, XCircle, CheckCircle2, BarChart3
} from "lucide-react";
import { cn, formatMoney } from '@/lib/utils';
import type { ModeratorPermissions, Order, Withdrawal } from '@/types';
import { processWithdrawals } from '@/app/affiliate/actions';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

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
    
    // Data States
    const [orders, setOrders] = useState<Order[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
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

        // Real-time Orders
        const ordersRef = collection(db, 'orders');
        const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(ordersData);
            setCounts(prev => ({
                ...prev,
                pendingPayments: ordersData.filter(o => o.paymentMethod !== 'cash-on-delivery' && o.status === 'pending').length,
                pendingOrders: ordersData.filter(o => !o.userId.startsWith('guest_') && o.status === 'pending').length,
                pendingQuickOrders: ordersData.filter(o => o.userId.startsWith('guest_') && o.status === 'pending').length,
                pendingReturns: ordersData.filter(o => o.status === 'return-requested').length
            }));
        });

        // Real-time Withdrawals
        const wdRef = collection(db, 'withdrawals');
        const unsubWd = onSnapshot(wdRef, (snapshot) => {
            const wdData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
            setWithdrawals(wdData);
            setCounts(prev => ({ ...prev, pendingWithdrawals: wdData.filter(w => w.status === 'pending').length }));
        });

        const reqsRef = collection(db, 'affiliateRequests');
        const unsubReqs = onSnapshot(query(reqsRef, where('status', '==', 'pending')), (snap) => {
            setCounts(prev => ({ ...prev, pendingAffiliateRequests: snap.size }));
        });

        return () => {
            unsubOrders();
            unsubReqs();
            unsubWd();
        };
    }, []);

    // Statistics Calculations
    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const todayOrders = orders.filter(o => o.date.startsWith(todayStr) && o.status !== 'cancelled');
        const todaySales = todayOrders.reduce((acc, o) => acc + o.total, 0);
        const pendingAmount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).reduce((acc, o) => acc + o.total, 0);
        const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
        const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((acc, w) => acc + w.amount, 0);

        return {
            todaySales,
            totalOrders: orders.length,
            cancelledCount,
            pendingAmount,
            totalWithdrawn
        };
    }, [orders, withdrawals]);

    const chartData = useMemo(() => {
        const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        return statuses.map(status => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            count: orders.filter(o => o.status === status).length,
            color: status === 'delivered' ? '#10b981' : 
                   status === 'cancelled' ? '#ef4444' : 
                   status === 'processing' ? '#3b82f6' : 
                   status === 'shipped' ? '#8b5cf6' : '#94a3b8'
        }));
    }, [orders]);

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
        <div className="container mx-auto max-w-5xl p-4 space-y-8">
            <header className="mt-4">
                <h2 className="text-3xl font-black text-primary uppercase italic tracking-tighter flex items-center gap-2">
                    <BarChart3 className="h-8 w-8" />
                    Admin Dashboard
                </h2>
                <p className="text-muted-foreground text-sm font-medium">Hello, {isAdmin ? 'Admin' : 'Moderator'}! Here's what's happening today.</p>
            </header>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-primary text-white border-0 shadow-lg">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <TrendingUp className="h-5 w-5 mb-2 opacity-80" />
                        <span className="text-[10px] font-bold uppercase opacity-80">Today's Sales</span>
                        <h3 className="text-xl font-black">৳{formatMoney(stats.todaySales)}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-white border-primary/10 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <ShoppingCart className="h-5 w-5 mb-2 text-primary" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Orders</span>
                        <h3 className="text-xl font-black text-foreground">{stats.totalOrders}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-white border-primary/10 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <XCircle className="h-5 w-5 mb-2 text-destructive" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Cancelled</span>
                        <h3 className="text-xl font-black text-foreground">{stats.cancelledCount}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-white border-primary/10 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <Clock className="h-5 w-5 mb-2 text-orange-500" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Pending Amount</span>
                        <h3 className="text-xl font-black text-foreground">৳{formatMoney(stats.pendingAmount)}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-white border-primary/10 shadow-sm col-span-2 md:col-span-1">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <DollarSign className="h-5 w-5 mb-2 text-green-600" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Withdrawn</span>
                        <h3 className="text-xl font-black text-foreground">৳{formatMoney(stats.totalWithdrawn)}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <Card className="border-primary/10 shadow-xl overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Order Status Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(139, 92, 246, 0.05)'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Management Menu Grid */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 px-1">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    Quick Actions & Management
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {menuItems.map((item, index) => {
                        const isLoading = isPending && loadingHref === item.href;
                        const badgeCount = item.badgeKey ? counts[item.badgeKey as keyof typeof counts] : 0;

                        return (
                            <div key={index} onClick={() => !isLoading && handleNavigation(item.href)} className="block">
                                <Card className={cn("hover:border-primary hover:shadow-lg transition-all relative overflow-hidden group", isLoading ? "cursor-wait" : "cursor-pointer")}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-3 rounded-lg relative group-hover:bg-primary group-hover:text-white transition-colors">
                                                <item.icon className="h-6 w-6" />
                                                {badgeCount > 0 && (
                                                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white border-2 border-white shadow-md animate-in zoom-in">
                                                        {badgeCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-md font-bold group-hover:text-primary transition-colors">{item.title}</h3>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.description}</p>
                                            </div>
                                        </div>
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                                        ) : (
                                            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
