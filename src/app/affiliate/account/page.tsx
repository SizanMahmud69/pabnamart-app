
"use client";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, AlertCircle, ArrowLeft, Settings, CalendarClock, Wallet, Undo2, Mail, FileText, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

const DEFAULT_AVATAR_URL = "https://i.ibb.co/mJkTS0D/3d-render-nanotechnology-robot-hand-touching-virtual-screen-with-finger.jpg";


function AffiliateAccountPage() {
    const { user, appUser } = useAuth();
    const router = useRouter();

    const handleJoinProgram = () => {
        router.push('/affiliate/join');
    };

    if (!appUser) {
        return <LoadingSpinner />;
    }

    if (appUser.affiliateStatus === 'pending') {
        return (
            <div className="bg-pink-50 min-h-screen">
                <div className="container mx-auto px-4 py-8 text-center max-w-lg">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Pending</CardTitle>
                            <CardDescription>Your affiliate program application is under review.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>We will notify you once the review process is complete. Thank you for your patience.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (appUser.affiliateStatus === 'denied') {
        return (
            <div className="bg-pink-50 min-h-screen">
                <div className="container mx-auto px-4 py-8 text-center max-w-lg">
                    <Card className="border-destructive">
                        <CardHeader className="text-center">
                            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                            <CardTitle className="text-destructive mt-4">Request Denied</CardTitle>
                            <CardDescription>We're sorry, your affiliate application was not approved.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Please contact support if you have any questions.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (appUser.affiliateStatus !== 'approved' || !appUser.affiliateId) {
        return (
            <div className="bg-pink-50 min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-3xl mx-auto">
                        <Card>
                            <CardHeader className="text-center">
                                <Users className="mx-auto h-12 w-12 text-primary" />
                                <CardTitle className="text-3xl mt-2">Join Our Affiliate Program</CardTitle>
                                <CardDescription>Earn money by promoting our products.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-muted-foreground mb-6">
                                    Promote our products and earn a commission on every sale you refer. It's free to join!
                                </p>
                                <Button size="lg" onClick={handleJoinProgram}>
                                    Join Now for Free
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    const generatedOrdersItems = [
        { href: '/affiliate/wallet?status=pending', icon: CalendarClock, label: 'Pending' },
        { href: '/affiliate/wallet?status=paid', icon: Wallet, label: 'To Earn' },
        { href: '/affiliate/wallet?status=cancelled', icon: Undo2, label: 'Returned' },
    ];

    const toolsAndServicesItems = [
        { href: '#', icon: Mail, label: 'Feedback' },
        { href: '#', icon: FileText, label: 'Blog' },
        { href: '#', icon: AlertTriangle, label: 'Whistleblow' },
    ];

    return (
        <div className="bg-pink-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-b from-pink-200/50 to-pink-50 p-4">
                 <div className="container mx-auto max-w-2xl">
                    <div className="relative flex items-center justify-between">
                         <Button asChild variant="ghost" size="icon">
                            <Link href="/affiliate">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                <AvatarImage src={user?.photoURL || DEFAULT_AVATAR_URL} alt={user?.displayName || 'user'} />
                                <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-lg font-bold">Affiliate Partner</h1>
                                <p className="text-sm text-muted-foreground">Member ID: {appUser.affiliateId}</p>
                            </div>
                        </div>
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/account/settings">
                                <Settings className="h-6 w-6" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
           
            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">

                {/* Generated Orders Card */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Generated Orders</CardTitle>
                         <Link href="/affiliate/wallet" className="text-sm font-medium text-primary flex items-center">
                            View All Orders <ChevronRight className="h-4 w-4" />
                        </Link>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 text-center pt-4">
                       {generatedOrdersItems.map(item => (
                           <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted">
                               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                                   <item.icon className="h-6 w-6" />
                               </div>
                               <span className="text-sm font-medium">{item.label}</span>
                           </Link>
                       ))}
                    </CardContent>
                </Card>

                {/* Tools & Services Card */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Tools & Services</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 text-center pt-4">
                        {toolsAndServicesItems.map(item => (
                           <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted">
                               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                                   <item.icon className="h-6 w-6" />
                               </div>
                               <span className="text-sm font-medium">{item.label}</span>
                           </Link>
                       ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
export default withAuth(AffiliateAccountPage);
