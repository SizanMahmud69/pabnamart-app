
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const settingsItems = [
    { label: "Account Information", href: "/account/settings/information" },
    { label: "Shipping Addresses", href: "/account/settings/addresses" },
    { label: "Account Security", href: "/account/settings/security" },
    { label: "Privacy Policy", href: "/account/settings/privacy" },
]

export default function AccountSettingsPage() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-md px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Profile
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Account Settings</CardTitle>
                        <CardDescription>
                            Manage your account preferences and settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {settingsItems.map((item, index) => (
                                <div key={item.label}>
                                    <Link href={item.href} className="flex items-center justify-between py-3 text-lg font-medium hover:bg-muted/50 rounded-md px-2">
                                        <span>{item.label}</span>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </Link>
                                    {index < settingsItems.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>
                        <Separator className="my-4" />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-destructive hover:text-destructive text-lg p-2 font-medium"
                                >
                                    Log Out
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
