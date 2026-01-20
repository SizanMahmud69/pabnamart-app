
"use client";

import { useState, useTransition, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Users, Truck, CreditCard, Loader2, LayoutGrid, UserCog, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ModeratorPermissions } from '@/types';

const allSettingsItems = [
    {
        title: "Delivery Settings",
        description: "Set the standard delivery charge for orders.",
        icon: Truck,
        href: "/admin/settings/delivery",
        permissionKey: 'canManageDeliverySettings'
    },
    {
        title: "Payment Settings",
        description: "Manage payment gateways and logos.",
        icon: CreditCard,
        href: "/admin/settings/payment",
        permissionKey: 'canManagePaymentSettings'
    },
    {
        title: "Category Settings",
        description: "Add, edit and delete product categories.",
        icon: LayoutGrid,
        href: "/admin/settings/categories",
        permissionKey: 'canManageCategorySettings'
    },
    {
        title: "User Management",
        description: "View and manage user accounts.",
        icon: Users,
        href: "/admin/users",
        permissionKey: 'canManageUsers'
    },
    {
        title: "Moderator Settings",
        description: "Manage moderator accounts and permissions.",
        icon: UserCog,
        href: "/admin/settings/moderators",
        permissionKey: 'canManageModeratorSettings'
    },
    {
        title: "Contact Page Settings",
        description: "Update contact information.",
        icon: Phone,
        href: "/admin/settings/contact",
        permissionKey: 'canManageContactSettings'
    }
];

export default function AdminSettingsPage() {
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

    const settingsItems = useMemo(() => {
        if (isAdmin) {
            return allSettingsItems;
        }
        if (permissions) {
            return allSettingsItems.filter(item => permissions[item.permissionKey as keyof ModeratorPermissions]);
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
             <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </header>
            <main className="mt-6">
                <h2 className="text-3xl font-bold mb-6">Settings</h2>
                <div className="space-y-4">
                    {settingsItems.map((item, index) => {
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
