
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Ticket, Settings, Wallet, Box, Truck, PackageCheck, Undo2, HelpCircle, Headphones, Star, Users } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from 'lucide-react';
import { useVouchers } from "@/hooks/useVouchers";

interface OrderStatusProps {
    icon: LucideIcon;
    label: string;
    count: number;
    href: string;
}

const OrderStatusItem = ({ icon: Icon, label, count, href }: OrderStatusProps) => (
    <Link href={href} className="flex flex-col items-center gap-2 text-center text-xs font-medium">
        <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Icon className="h-6 w-6" />
            </div>
            {count > 0 && <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0">{count}</Badge>}
        </div>
        <span>{label}</span>
    </Link>
);

interface ServiceItemProps {
    icon: LucideIcon;
    label: string;
    href: string;
}

const ServiceItem = ({ icon: Icon, label, href }: ServiceItemProps) => (
    <Link href={href} className="flex flex-col items-center gap-2 text-center text-xs font-medium">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <Icon className="h-6 w-6" />
        </div>
        <span>{label}</span>
    </Link>
)

export default function AccountPage() {
    const { voucherCount } = useVouchers();

    const orderStatuses: OrderStatusProps[] = [
        { icon: Wallet, label: "To Pay", count: 2, href: "/account/orders?status=pending" },
        { icon: Box, label: "To Ship", count: 2, href: "/account/orders?status=shipped" },
        { icon: Truck, label: "To Receive", count: 2, href: "/account/orders?status=in-transit" },
        { icon: PackageCheck, label: "Delivered", count: 0, href: "/account/orders?status=delivered" },
        { icon: Undo2, label: "My Returns", count: 3, href: "/account/orders?status=returned" },
    ];
    
    const services: ServiceItemProps[] = [
        { icon: HelpCircle, label: "Help Center", href: "/account/help" },
        { icon: Headphones, label: "Contact Customer", href: "/contact" },
        { icon: Star, label: "My Reviews", href: "/account/reviews" },
        { icon: Users, label: "My Affiliate", href: "/affiliate" },
    ];

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
                
                {/* My Account Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">My Account</h1>
                    <Link href="/account/settings">
                        <Settings className="h-6 w-6 text-gray-600" />
                    </Link>
                </div>
                
                {/* User Info */}
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src="https://picsum.photos/seed/avatar/200" alt="User Avatar" data-ai-hint="user avatar" />
                            <AvatarFallback>T</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold">New User</h2>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <Link href="/account/wishlist" className="flex items-center gap-1 hover:text-primary">
                                    <Heart className="h-4 w-4" /> 0 Wishlist
                                </Link>
                                <Link href="/vouchers" className="flex items-center gap-1 hover:text-primary">
                                    <Ticket className="h-4 w-4" /> {voucherCount} Vouchers
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* My Orders */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">My Orders</CardTitle>
                        <Link href="/account/orders" className="text-sm font-medium text-primary hover:underline">
                            View All Orders &gt;
                        </Link>
                    </CardHeader>
                    <CardContent className="p-4 flex justify-around">
                        {orderStatuses.map(status => <OrderStatusItem key={status.label} {...status} />)}
                    </CardContent>
                </Card>

                {/* More Services */}
                <Card className="shadow-sm">
                     <CardHeader>
                        <CardTitle className="text-lg">More Services</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-4 gap-4">
                       {services.map(service => <ServiceItem key={service.label} {...service} />)}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
