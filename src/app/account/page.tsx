
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShoppingBag, Heart, MapPin, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const menuItems = [
    { icon: User, label: "Profile Information", href: "/account/profile" },
    { icon: ShoppingBag, label: "My Orders", href: "/account/orders" },
    { icon: Heart, label: "Wishlist", href: "/account/wishlist" },
    { icon: MapPin, label: "Manage Addresses", href: "/account/addresses" },
];

export default function AccountPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                 <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">My Account</CardTitle>
                        <CardDescription>Manage your account settings and track your orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                           {menuItems.map((item, index) => (
                                <React.Fragment key={index}>
                                    <Link href={item.href}>
                                        <div className="flex items-center p-4 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                                            <item.icon className="h-6 w-6 mr-4 text-primary" />
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                    </Link>
                                    {index < menuItems.length - 1 && <Separator />}
                                </React.Fragment>
                           ))}
                        </div>
                        <Separator className="my-4" />
                        <Button variant="outline" className="w-full">
                            <LogOut className="mr-2 h-5 w-5" />
                            Logout
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
import * as React from 'react';
