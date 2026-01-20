"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle, MapPin, Lock, FileText, ChevronRight, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { LucideIcon } from 'lucide-react';
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

interface SettingsItemProps {
    icon: LucideIcon;
    label: string;
    description: string;
    href: string;
}

const settingsItems: SettingsItemProps[] = [
    { icon: UserCircle, label: "Account Information", description: "Edit your personal details", href: "/account/settings/information" },
    { icon: MapPin, label: "Shipping Addresses", description: "Manage your delivery locations", href: "/account/settings/addresses" },
    { icon: Lock, label: "Account Security", description: "Change your password", href: "/account/settings/security" },
    { icon: FileText, label: "Privacy & Terms", description: "Read our policies and terms", href: "/account/settings/privacy" },
];


export default function AccountSettingsPage() {
    const { logout } = useAuth();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [loadingHref, setLoadingHref] = useState<string | null>(null);

    const handleNavigation = (href: string) => {
        setLoadingHref(href);
        startTransition(() => {
            router.push(href);
        });
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-lg px-4 py-6">
                <div className="relative flex items-center justify-center mb-6">
                    <Button asChild variant="ghost" size="icon" className="absolute left-0">
                        <Link href="/account">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h2 className="text-2xl font-bold">Account Settings</h2>
                </div>

                <div className="space-y-4">
                   {settingsItems.map((item) => {
                        const isLoading = isPending && loadingHref === item.href;
                        return (
                            <div key={item.label} onClick={() => !isLoading && handleNavigation(item.href)} className="block">
                                <Card className={cn("hover:border-primary hover:shadow-md transition-all", isLoading ? "cursor-wait" : "cursor-pointer")}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-3 rounded-lg">
                                                <item.icon className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold">{item.label}</h3>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    })}
                </div>

                <div className="text-center pt-8">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You will need to log in again to access your account.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
}
