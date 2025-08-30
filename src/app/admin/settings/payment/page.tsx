
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { PaymentSettings } from '@/types';
import { Separator } from '@/components/ui/separator';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';

const db = getFirestore(app);

const initialSettings: PaymentSettings = {
    bkashMerchantNumber: '',
    nagadMerchantNumber: '',
    rocketMerchantNumber: '',
    bkashLogo: '',
    nagadLogo: '',
    rocketLogo: '',
};

export default function PaymentSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PaymentSettings>(initialSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const settingsDocRef = doc(db, 'settings', 'payment');
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(prev => ({...prev, ...docSnap.data()}));
            }
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const settingsDocRef = doc(db, 'settings', 'payment');
            await setDoc(settingsDocRef, settings, { merge: true });
            toast({
                title: "Settings Saved",
                description: "The payment settings have been updated successfully.",
            });
        } catch (error) {
             toast({
                title: "Error",
                description: "Failed to save settings.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                </Button>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Settings</CardTitle>
                            <CardDescription>Manage payment gateways and site logos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div>
                                <h3 className="text-lg font-medium mb-2">Payment Merchant Numbers</h3>
                                <Separator />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bkashMerchantNumber">bKash Merchant Number</Label>
                                <Input 
                                    id="bkashMerchantNumber" 
                                    name="bkashMerchantNumber"
                                    value={settings.bkashMerchantNumber}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 01xxxxxxxxx" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nagadMerchantNumber">Nagad Merchant Number</Label>
                                <Input 
                                    id="nagadMerchantNumber" 
                                    name="nagadMerchantNumber"
                                    value={settings.nagadMerchantNumber}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 01xxxxxxxxx" 
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="rocketMerchantNumber">Rocket Merchant Number</Label>
                                <Input 
                                    id="rocketMerchantNumber" 
                                    name="rocketMerchantNumber"
                                    value={settings.rocketMerchantNumber}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 01xxxxxxxxx" 
                                />
                            </div>

                             <div className="pt-4">
                                <h3 className="text-lg font-medium mb-2">Payment Gateway Logos</h3>
                                <Separator />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bkashLogo">bKash Logo URL</Label>
                                <Input 
                                    id="bkashLogo" 
                                    name="bkashLogo"
                                    value={settings.bkashLogo}
                                    onChange={handleInputChange}
                                    placeholder="Enter image URL" 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nagadLogo">Nagad Logo URL</Label>
                                <Input 
                                    id="nagadLogo" 
                                    name="nagadLogo"
                                    value={settings.nagadLogo}
                                    onChange={handleInputChange}
                                    placeholder="Enter image URL" 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rocketLogo">Rocket Logo URL</Label>
                                <Input 
                                    id="rocketLogo" 
                                    name="rocketLogo"
                                    value={settings.rocketLogo}
                                    onChange={handleInputChange}
                                    placeholder="Enter image URL" 
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
