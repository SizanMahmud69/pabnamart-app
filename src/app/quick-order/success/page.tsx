
"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, ShoppingBag, ArrowRight, Link as LinkIcon } from "lucide-react";
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const orderNumber = searchParams.get('num');
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
        if (!orderNumber) {
            router.replace('/');
        }
    }, [orderNumber, router]);

    const trackLink = `${baseUrl}/track-order?id=${orderNumber}`;

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: `${label} কপি করা হয়েছে!` });
        }).catch(() => {
            toast({ title: "কপি করা সম্ভব হয়নি", variant: "destructive" });
        });
    };

    if (!orderNumber) return <LoadingSpinner />;

    return (
        <div className="container mx-auto max-w-md px-4 py-12 text-center">
            <div className="mb-8 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto drop-shadow-lg" />
            </div>
            
            <h1 className="text-3xl font-black text-primary mb-2 uppercase tracking-tighter">অর্ডার কনফার্ম!</h1>
            <p className="text-muted-foreground mb-8">আমাদের ওপর আস্থা রাখার জন্য ধন্যবাদ। শীঘ্রই আপনার সাথে যোগাযোগ করা হবে।</p>

            <Card className="border-2 border-primary/10 shadow-xl overflow-hidden mb-6">
                <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">আপনার অর্ডার আইডি</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border-2 border-dashed">
                        <span className="flex-1 font-mono text-xl font-black tracking-widest text-primary">#{orderNumber}</span>
                        <Button 
                            variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/10"
                            onClick={() => handleCopy(orderNumber, "অর্ডার আইডি")}
                        >
                            <Copy className="h-5 w-5" />
                        </Button>
                    </div>

                    <Separator label="অর্ডার ট্র্যাক করুন" />

                    <div className="space-y-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase text-left pl-1">ট্র্যাকিং লিঙ্ক</p>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border text-left overflow-hidden">
                            <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 text-[10px] font-mono truncate text-muted-foreground">{trackLink}</span>
                            <Button 
                                variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                                onClick={() => handleCopy(trackLink, "ট্র্যাকিং লিঙ্ক")}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <Button asChild size="lg" className="w-full h-14 text-lg font-bold shadow-lg">
                    <Link href={`/track-order?id=${orderNumber}`}>
                        অর্ডার ট্র্যাক করুন <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="w-full h-14 text-lg font-bold">
                    <Link href="/">
                        <ShoppingBag className="mr-2 h-5 w-5" /> আরও কেনাকাটা করুন
                    </Link>
                </Button>
            </div>

            <p className="mt-8 text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">PabnaMart E-commerce</p>
        </div>
    );
}

const Separator = ({ label }: { label: string }) => (
    <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-bold tracking-tighter">{label}</span></div>
    </div>
);

export default function OrderSuccessPage() {
    return (
        <div className="bg-purple-50/30 min-h-screen">
            <Suspense fallback={<LoadingSpinner />}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
