
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Ticket, Settings, HelpCircle, Headphones, Star, Users, PackageSearch, ShoppingBag, ChevronRight, Package, Truck, CheckCircle, XCircle, Undo2 } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from 'lucide-react';
import { useVouchers } from "@/hooks/useVouchers";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMemo, useEffect, useState } from "react";
import { useWishlist } from "@/hooks/useWishlist";
import { Separator } from "@/components/ui/separator";
import type { Order, Review } from "@/types";
import { collection, getFirestore, limit, onSnapshot, query, where, orderBy, collectionGroup } from "firebase/firestore";
import app from "@/lib/firebase";


const db = getFirestore(app);
const DEFAULT_AVATAR_URL = "https://pix1.wapkizfile.info/download/3090f1dc137678b1189db8cd9174efe6/sizan+wapkiz+click/1puser-(sizan.wapkiz.click).gif";


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

const OrderStatusIcon = ({ status }: { status: Order['status'] }) => {
    const iconMap: { [key in Order['status']]: LucideIcon } = {
        pending: Package,
        processing: Package,
        shipped: Truck,
        delivered: CheckCircle,
        cancelled: XCircle,
        returned: Undo2,
        'return-requested': Undo2,
        'return-approved': Undo2
    };
    const Icon = iconMap[status] || Package;
    return <Icon className="h-6 w-6 text-primary" />;
}

export default function AccountPage() {
    const { collectedVouchers } = useVouchers();
    const { user, loading: authLoading, appUser } = useAuth();
    const { wishlistItems } = useWishlist();
    const [orders, setOrders] = useState<Order[]>([]);
    const [userReviews, setUserReviews] = useState<Review[]>([]);

    const unusedVoucherCount = useMemo(() => {
        if (!appUser) return 0;
        const usedVouchersMap = appUser.usedVouchers || {};
        return collectedVouchers.filter(v => {
            const usageCount = usedVouchersMap[v.code] || 0;
            const usageLimit = v.usageLimit || 1;
            return usageCount < usageLimit;
        }).length;
    }, [collectedVouchers, appUser]);
    
    useEffect(() => {
        if (!user) return;
        
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', user.uid), orderBy('date', 'desc'));

        const unsubscribeOrders = onSnapshot(q, (snapshot) => {
            const userOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
            setOrders(userOrders);
        });

        const reviewsRef = collectionGroup(db, 'reviews');
        const reviewsQuery = query(reviewsRef, where('user.uid', '==', user.uid));
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            const reviews = snapshot.docs.map(doc => doc.data() as Review);
            setUserReviews(reviews);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeReviews();
        };
    }, [user]);

    if (authLoading) {
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
    
    const services: ServiceItemProps[] = [
        { icon: HelpCircle, label: "Help Center", href: "/account/help" },
        { icon: Headphones, label: "Contact Customer", href: "/contact" },
        { icon: Star, label: "My Reviews", href: "/account/reviews" },
        { icon: Users, label: "My Affiliate", href: "/affiliate" },
    ];
    
    const orderStatuses: { status: Order['status'][], label: string }[] = [
        { status: ['pending'], label: 'Pending' },
        { status: ['processing'], label: 'Processing' },
        { status: ['shipped'], label: 'Shipped' },
        { status: ['delivered'], label: 'Delivered' },
        { status: ['return-requested'], label: 'Returned' },
    ];
    
    const getOrderStatusCount = (statuses: Order['status'][]) => {
        // Special handling for 'delivered' to count only unreviewed orders
        if (statuses.length === 1 && statuses[0] === 'delivered') {
            const deliveredOrders = orders.filter(o => o.status === 'delivered');
            const unreviewedDeliveredOrders = deliveredOrders.filter(order => 
                order.items.some(item => 
                    !userReviews.some(review => review.productId === item.id)
                )
            );
            return unreviewedDeliveredOrders.length;
        }
        return orders.filter(o => statuses.includes(o.status)).length;
    }


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
                            <AvatarImage src={user.photoURL || DEFAULT_AVATAR_URL} alt="User Avatar" data-ai-hint="user avatar" />
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

                {/* My Orders Section */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">My Orders</CardTitle>
                            <Link href="/account/orders" className="flex items-center text-sm font-medium text-primary hover:underline">
                                See All Orders
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                       <div className="grid grid-cols-5 gap-2">
                           {orderStatuses.map(({status, label}) => (
                               <Link key={label} href={`/account/orders?status=${status[0]}`} className="flex flex-col items-center gap-2 text-center text-xs font-medium p-2 rounded-lg hover:bg-muted">
                                    <div className="relative">
                                        <OrderStatusIcon status={status[0] as Order['status']} />
                                        {getOrderStatusCount(status) > 0 && (
                                            <Badge className="absolute -top-2 -right-2 h-4 w-4 justify-center p-0">{getOrderStatusCount(status)}</Badge>
                                        )}
                                    </div>
                                    <span>{label}</span>
                               </Link>
                           ))}
                       </div>
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
