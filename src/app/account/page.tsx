
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Ticket, Settings, HelpCircle, Headphones, Star, Users, PackageSearch } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from 'lucide-react';
import { useVouchers } from "@/hooks/useVouchers";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMemo } from "react";
import { useWishlist } from "@/hooks/useWishlist";


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

export default function AccountPage() {
    const { collectedVouchers } = useVouchers();
    const { user, loading: authLoading, appUser } = useAuth();
    const { wishlistItems } = useWishlist();

    const unusedVoucherCount = useMemo(() => {
        if (!appUser) return 0;
        const usedCodes = appUser.usedVoucherCodes || [];
        return collectedVouchers.filter(v => !usedCodes.includes(v.code)).length;
    }, [collectedVouchers, appUser]);
    
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
