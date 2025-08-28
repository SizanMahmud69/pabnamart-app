
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Image as ImageIcon, Truck, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const settingsItems = [
    {
        title: "Site Settings",
        description: "Manage your website's logos and branding.",
        icon: ImageIcon,
        href: "/admin/settings/site"
    },
    {
        title: "Delivery Settings",
        description: "Set the standard delivery charge for orders.",
        icon: Truck,
        href: "/admin/settings/delivery"
    },
    {
        title: "Payment Settings",
        description: "Manage payment gateway merchant numbers.",
        icon: CreditCard,
        href: "/admin/settings/payment"
    }
];

export default function AdminSettingsPage() {
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
                    {settingsItems.map((item, index) => (
                        <Link href={item.href} key={index} className="block">
                            <Card className="hover:border-primary hover:shadow-lg transition-all">
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
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
};
