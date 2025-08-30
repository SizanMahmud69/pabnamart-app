
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Ticket, Settings, Wallet, Box, Truck, PackageCheck, Undo2, HelpCircle, Headphones, Star, Users } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from 'lucide-react';
import { useVouchers } from "@/hooks/useVouchers";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Order, OrderStatus } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { collection, getFirestore, onSnapshot, query, where } from "firebase/firestore";
import app from "@/lib/firebase";
import { useWishlist } from "@/hooks/useWishlist";


const db = getFirestore(app);


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
    const { collectedVouchers } = useVouchers();
    const { user, loading: authLoading, appUser } = useAuth();
    const { wishlistItems } = useWishlist();
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [viewedDeliveredOrders, setViewedDeliveredOrders] = useState<string[]>([]);

    const unusedVoucherCount = useMemo(() => {
        if (!appUser) return 0;
        const usedCodes = appUser.usedVoucherCodes || [];
        return collectedVouchers.filter(v => !usedCodes.includes(v.code)).length;
    }, [collectedVouchers, appUser]);

    useEffect(() => {
        if (!user) {
            setOrdersLoading(false);
            return;
        }

        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(userOrders);
            setOrdersLoading(false);
        }, (error) => {
            console.error("Error fetching orders: ", error);
            setOrdersLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    useEffect(() => {
        const stored = localStorage.getItem('viewedDeliveredOrders');
        if (stored) {
            setViewedDeliveredOrders(JSON.parse(stored));
        }
    }, []);
    
    const loading = authLoading || ordersLoading;
    
    if (loading) {
        return <LoadingSpinner />
    }

    if (!user) {
        return (
            <div className="bg-purple-50/30 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please log in</h1>
                    <p className="text-muted-foreground mb-6">You need to be logged in to view your account.</p>
                    <Button asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                </div>
            </div>
        )
    }
    
    const orderCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<OrderStatus, number>);
    
    const getCount = (status: OrderStatus) => orderCounts[status] || 0;
    
    const newDeliveredCount = orders.filter(
        order => order.status === 'delivered' && !viewedDeliveredOrders.includes(order.id)
    ).length;
    
    const orderStatuses: OrderStatusProps[] = [
        { icon: Wallet, label: "To Pay", count: getCount('pending'), href: "/account/orders?status=pending" },
        { icon: Box, label: "To Ship", count: getCount('shipped'), href: "/account/orders?status=shipped" },
        { icon: Truck, label: "To Receive", count: getCount('in-transit'), href: "/account/orders?status=in-transit" },
        { icon: PackageCheck, label: "Delivered", count: newDeliveredCount, href: "/account/orders?status=delivered" },
        { icon: Undo2, label: "My Returns", count: getCount('return-requested'), href: "/account/orders?status=return-requested" },
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
                        <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarImage src={user.photoURL || "https://pix1.wapkizfile.info/download/3090f1dc137678b1189db8cd9174efe6/sizan+wapkiz+click/1puser-(sizan.wapkiz.click).gif"} alt="User Avatar" data-ai-hint="user avatar" />
                            <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-xl font-bold truncate">{user.displayName || user.email}</h2>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <Link href="/account/wishlist" className="flex items-center gap-1 hover:text-primary">
                                    <Heart className="h-4 w-4" /> {wishlistItems.length} Wishlist
                                </Link>
                                <Link href="/account/vouchers" className="flex items-center gap-1 hover:text-primary">
                                    <Ticket className="h-4 w-4" /> {unusedVoucherCount} Vouchers
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
