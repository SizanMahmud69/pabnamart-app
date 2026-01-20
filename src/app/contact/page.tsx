"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import type { ContactSettings } from "@/types";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

const db = getFirestore(app);

export default function ContactPage() {
    const [settings, setSettings] = useState<ContactSettings | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const settingsDocRef = doc(db, 'settings', 'contact');
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as ContactSettings);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                 <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Account
                    </Link>
                </Button>
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>Get in touch with us through any of the following channels.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Phone className="h-6 w-6 text-primary" />
                                <div>
                                    <h3 className="font-semibold">Phone</h3>
                                    {loading ? <Skeleton className="h-4 w-32" /> : <p className="text-muted-foreground">{settings?.phone || 'Not available'}</p>}
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-4">
                                <Mail className="h-6 w-6 text-primary" />
                                <div>
                                    <h3 className="font-semibold">Email</h3>
                                     {loading ? <Skeleton className="h-4 w-48" /> : <p className="text-muted-foreground">{settings?.email || 'Not available'}</p>}
                                </div>
                            </div>
                             <Separator />
                            <div className="flex items-center gap-4">
                                <MapPin className="h-6 w-6 text-primary" />
                                <div>
                                    <h3 className="font-semibold">Address</h3>
                                     {loading ? (
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-56" />
                                        </div>
                                     ) : (
                                        <p className="text-muted-foreground">{settings?.address || 'Not available'}</p>
                                     )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
