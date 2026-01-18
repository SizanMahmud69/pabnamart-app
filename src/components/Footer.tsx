
"use client";

import { useState, useEffect } from 'react';
import type { PaymentSettings } from '@/types';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

const db = getFirestore(app);

export default function Footer() {
    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const settingsDocRef = doc(db, 'settings', 'payment');
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as PaymentSettings);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const paymentLogos = [
        settings?.bkashLogo,
        settings?.nagadLogo,
        settings?.rocketLogo,
    ].filter(Boolean) as string[];

    return (
        <footer className="bg-muted mt-12">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center text-center">
                    <h3 className="font-semibold text-lg mb-4">We Accept</h3>
                    {loading ? (
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    ) : (
                        paymentLogos.length > 0 ? (
                            <div className="flex items-center gap-4">
                                {paymentLogos.map((logo, index) => (
                                    <div key={index} className="relative h-8 w-auto">
                                        <img src={logo} alt={`Payment method ${index + 1}`} className="h-full object-contain" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Payment methods will be shown here.</p>
                        )
                    )}
                    <p className="text-xs text-muted-foreground mt-6">&copy; {new Date().getFullYear()} PabnaMart. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}
