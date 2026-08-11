
"use client";

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Package, ArrowRight, Tag, Ticket, ShoppingCart, CreditCard, Undo2, 
    Star, Loader2, DollarSign, Coins, Image as ImageIcon, Zap, UserPlus,
    TrendingUp, TrendingDown, Clock, XCircle, CheckCircle2, BarChart3,
    MoreVertical, Calendar, Filter, Users
} from "lucide-react";
import { cn, formatMoney } from '@/lib/utils';
import type { ModeratorPermissions, Order, Withdrawal } from '@/types';
import { processWithdrawals } from '@/app/affiliate/actions';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { startOfDay, startOfMonth, subDays, isAfter, isBefore, parseISO } from 'date-fns';

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
        title: "User Management",
        description: "View and manage user accounts.",
        icon: Users,
        href: "/admin/users",
        permissionKey: 'canManageUsers'
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
    
    // Filter State
    const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('30days');
    
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

        // Real-time Orders & Counts
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

        // Real-time Withdrawals & Counts
        const wdRef = collection(db, 'withdrawals');
        const unsubWd = onSnapshot(wdRef, (snapshot) => {
            const wdData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
            setWithdrawals(wdData);
            setCounts(prev => ({ ...prev, pendingWithdrawals: wdData.filter(w => w.status === 'pending').length }));
        });

        // Real-time Affiliate Requests Count
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
        const todayStart = startOfDay(now);
        const yesterdayStart = startOfDay(subDays(now, 1));
        const monthStart = startOfMonth(now);

        // All non-cancelled orders
        const validOrders = orders.filter(o => o.status !== 'cancelled');

        // Today's Stats
        const todayOrders = validOrders.filter(o => isAfter(parseISO(o.date), todayStart));
        const todaySales = todayOrders.reduce((acc, o) => acc + o.total, 0);

        // This Month's Stats
        const monthOrders = validOrders.filter(o => isAfter(parseISO(o.date), monthStart));
        const monthSales = monthOrders.reduce((acc, o) => acc + o.total, 0);

        // Filtered Stats
        let filterStart = todayStart;
        if (dateFilter === 'yesterday') filterStart = yesterdayStart;
        if (dateFilter === '7days') filterStart = startOfDay(subDays(now, 7));
        if (dateFilter === '30days') filterStart = startOfDay(subDays(now, 30));
        if (dateFilter === 'all') filterStart = new Date(0);

        const filteredOrders = validOrders.filter(o => {
            const orderDate = parseISO(o.date);
            if (dateFilter === 'yesterday') {
                return isAfter(orderDate, yesterdayStart) && isBefore(orderDate, todayStart);
            }
            return isAfter(orderDate, filterStart);
        });
        const filteredSales = filteredOrders.reduce((acc, o) => acc + o.total, 0);

        const pendingAmount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).reduce((acc, o) => acc + o.total, 0);
        const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
        const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((acc, w) => acc + w.amount, 0);

        return {
            todaySales,
            todayOrdersCount: todayOrders.length,
            monthSales,
            monthOrdersCount: monthOrders.length,
            filteredSales,
            filteredOrdersCount: filteredOrders.length,
            totalOrders: orders.length,
            cancelledCount,
            pendingAmount,
            totalWithdrawn
        };
    }, [orders, withdrawals, dateFilter]);

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

    const getFilterLabel = () => {
        switch(dateFilter) {
            case 'today': return 'Today';
            case 'yesterday': return 'Yesterday';
            case '7days': return 'Last 7 Days';
            case '30days': return 'Last 30 Days';
            case 'all': return 'Lifetime';
            default: return 'Custom';
        }
    };

    return (
        <div className="container mx-auto max-w-5xl p-4 space-y-8">
            <header className="mt-4">
                <h2 className="text-3xl font-black text-primary uppercase italic tracking-tighter flex items-center gap-2">
                    <BarChart3 className="h-8 w-8" />
                    Admin Dashboard
                </h2>
                <p className="text-muted-foreground text-sm font-medium">Hello, {isAdmin ? 'Admin' : 'Moderator'}! Here's what's happening.</p>
            </header>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Today's Sales */}
                <Card className="bg-primary text-white border-0 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-12 w-12" />
                    </div>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold uppercase opacity-80 mb-1">Today's Sales</span>
                        <h3 className="text-2xl font-black">৳{formatMoney(stats.todaySales)}</h3>
                        <p className="text-[10px] opacity-70 mt-1">{stats.todayOrdersCount} orders placed</p>
                    </CardContent>
                </Card>

                {/* This Month's Sales */}
                <Card className="bg-white border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-2 right-2 z-20">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filter Range</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDateFilter('today')}>Today</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDateFilter('yesterday')}>Yesterday</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDateFilter('7days')}>Last 7 Days</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDateFilter('30days')}>Last 30 Days</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDateFilter('all')}>Lifetime</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{getFilterLabel()}</span>
                        <h3 className="text-2xl font-black text-primary">৳{formatMoney(stats.filteredSales)}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">{stats.filteredOrdersCount} orders processed</p>
                    </CardContent>
                </Card>

                {/* Pending Amount */}
                <Card className="bg-white border-primary/10 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Pending Revenue</span>
                        <h3 className="text-2xl font-black text-orange-600">৳{formatMoney(stats.pendingAmount)}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">From active orders</p>
                    </CardContent>
                </Card>

                {/* Withdrawn */}
                <Card className="bg-white border-primary/10 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Total Payouts</span>
                        <h3 className="text-2xl font-black text-green-600">৳{formatMoney(stats.totalWithdrawn)}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">To affiliate partners</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-indigo-500 p-2 rounded-lg text-white">
                        <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase">This Month</p>
                        <p className="font-black text-lg">৳{formatMoney(stats.monthSales)}</p>
                    </div>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-purple-500 p-2 rounded-lg text-white">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-purple-600 uppercase">Monthly Orders</p>
                        <p className="font-black text-lg">{stats.monthOrdersCount}</p>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-red-500 p-2 rounded-lg text-white">
                        <XCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-red-600 uppercase">Cancelled</p>
                        <p className="font-black text-lg">{stats.cancelledCount}</p>
                    </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
                    <div className="bg-slate-500 p-2 rounded-lg text-white">
                        <Package className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase">Total Items</p>
                        <p className="font-black text-lg">{stats.totalOrders}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <Card className="border-primary/10 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Live Order Status
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

            {/* Management Menu Grid */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 px-1">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    Quick Actions & Management
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
                    {menuItems.map((item, index) => {
                        const isLoading = isPending && loadingHref === item.href;
                        const badgeCount = item.badgeKey ? counts[item.badgeKey as keyof typeof counts] : 0;

                        return (
                            <div key={index} onClick={() => !isLoading && handleNavigation(item.href)} className="block">
                                <Card className={cn("hover:border-primary hover:shadow-lg transition-all relative group", isLoading ? "cursor-wait" : "cursor-pointer")}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-3 rounded-lg relative group-hover:bg-primary group-hover:text-white transition-colors">
                                                <item.icon className="h-6 w-6" />
                                                {badgeCount > 0 && (
                                                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white border-2 border-white shadow-md animate-pulse">
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
