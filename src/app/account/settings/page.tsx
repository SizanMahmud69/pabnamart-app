
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle, MapPin, Lock, FileText, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { LucideIcon } from 'lucide-react';

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
    { icon: FileText, label: "Privacy Policy", description: "Read our terms of service", href: "/account/settings/privacy" },
];

const SettingsItem = ({ icon: Icon, label, description, href }: SettingsItemProps) => (
    <Link href={href} className="block">
        <Card className="hover:border-primary hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">{label}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
        </Card>
    </Link>
);


export default function AccountSettingsPage() {
    const { logout } = useAuth();
    const router = useRouter();

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
                    <h1 className="text-2xl font-bold">Account Settings</h1>
                </div>

                <div className="space-y-4">
                   {settingsItems.map((item) => <SettingsItem key={item.label} {...item} />)}
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
