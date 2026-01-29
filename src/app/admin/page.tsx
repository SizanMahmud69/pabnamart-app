
"use client";

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Package, Users, ArrowRight, Tag, Ticket, Settings, ShoppingCart, CreditCard, Undo2, Star, Loader2, DollarSign } from "lucide-react";
import { cn } from '@/lib/utils';
import type { ModeratorPermissions } from '@/types';

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
        permissionKey: 'canManageOrders'
    },
    {
        title: "Verify Payments",
        description: "Verify online payments for orders.",
        icon: CreditCard,
        href: "/admin/verify-payments",
        permissionKey: 'canVerifyPayments'
    },
    {
        title: "Return Requests",
        description: "Manage customer return requests.",
        icon: Undo2,
        href: "/admin/returns",
        permissionKey: 'canManageReturns'
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
        title: "Withdrawal Requests",
        description: "Manage affiliate payment requests.",
        icon: DollarSign,
        href: "/admin/withdrawals",
        permissionKey: 'canManageWithdrawals'
    },
];

const AdminDashboard = () => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [loadingHref, setLoadingHref] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<ModeratorPermissions | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const adminStatus = localStorage.getItem('isAdmin') === 'true';
        setIsAdmin(adminStatus);
        if (!adminStatus) {
            const storedPermissions = localStorage.getItem('moderatorPermissions');
            if (storedPermissions) {
                setPermissions(JSON.parse(storedPermissions));
            }
        }
    }, []);

    const menuItems = useMemo(() => {
        if (isAdmin) {
            return allMenuItems;
        }
        if (permissions) {
             return allMenuItems.filter(item => {
                if (Array.isArray(item.permissionKey)) {
                    // If it's an array of keys, check if the moderator has at least one of them.
                    return item.permissionKey.some(key => permissions[key as keyof ModeratorPermissions]);
                }
                // Otherwise, it's a single key.
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
                <h2 className="text-3xl font-bold mb-6">Welcome, {isAdmin ? 'Admin' : 'Moderator'}!</h2>
                <div className="space-y-4">
                    {menuItems.map((item, index) => {
                        const isLoading = isPending && loadingHref === item.href;
                        return (
                            <div key={index} onClick={() => !isLoading && handleNavigation(item.href)} className="block">
                                <Card className={cn("hover:border-primary hover:shadow-lg transition-all", isLoading ? "cursor-wait" : "cursor-pointer")}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-3 rounded-lg">
                                                <item.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                                        ) : (
                                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
