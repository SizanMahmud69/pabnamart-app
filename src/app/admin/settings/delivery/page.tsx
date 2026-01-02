
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DeliverySettings } from '@/types';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const db = getFirestore(app);

const initialSettings: DeliverySettings = {
    insidePabnaSmall: 0,
    insidePabnaLarge: 0,
    outsidePabnaSmall: 0,
    outsidePabnaLarge: 0,
    deliveryTimeInside: 0,
    deliveryTimeOutside: 0,
    returnAddress: '',
};

export default function DeliverySettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<DeliverySettings>(initialSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const settingsDocRef = doc(db, 'settings', 'delivery');
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                // Ensure all fields from initialSettings are present
                setSettings({ ...initialSettings, ...docSnap.data() });
            } else {
                setSettings(initialSettings);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // For number inputs, convert to number type
        const isNumeric = ['insidePabnaSmall', 'insidePabnaLarge', 'outsidePabnaSmall', 'outsidePabnaLarge', 'deliveryTimeInside', 'deliveryTimeOutside'].includes(name);
        setSettings(prev => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const settingsDocRef = doc(db, 'settings', 'delivery');
            await setDoc(settingsDocRef, settings);
            toast({
                title: "Settings Saved",
                description: "The delivery settings have been updated successfully.",
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
                            <CardTitle>Delivery Settings</CardTitle>
                            <CardDescription>Manage the delivery charges and times for your store.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Delivery Charges</h3>
                                <p className="text-xs text-muted-foreground mb-4">
                                This charge applies to all orders unless a product is marked for free shipping. If any product in the cart has free shipping, the entire order ships for free. The correct charge will be applied at checkout based on the user's address and item count.
                                </p>
                                <Separator className="mb-4" />
                                <h4 className="font-medium text-md mb-2">Inside Pabna City</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="insidePabnaSmall">1-5 Items (৳)</Label>
                                        <Input 
                                            id="insidePabnaSmall" 
                                            name="insidePabnaSmall"
                                            type="number"
                                            value={settings.insidePabnaSmall}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 60" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="insidePabnaLarge">6-10 Items (৳)</Label>
                                        <Input 
                                            id="insidePabnaLarge" 
                                            name="insidePabnaLarge"
                                            type="number"
                                            value={settings.insidePabnaLarge}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 80" 
                                        />
                                    </div>
                                </div>
                                <h4 className="font-medium text-md mb-2 mt-4">Outside Pabna City</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="outsidePabnaSmall">1-5 Items (৳)</Label>
                                        <Input 
                                            id="outsidePabnaSmall" 
                                            name="outsidePabnaSmall"
                                            type="number"
                                            value={settings.outsidePabnaSmall}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 120" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="outsidePabnaLarge">6-10 Items (৳)</Label>
                                        <Input 
                                            id="outsidePabnaLarge" 
                                            name="outsidePabnaLarge"
                                            type="number"
                                            value={settings.outsidePabnaLarge}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 150" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <h3 className="font-semibold text-lg mb-2">Estimated Delivery Time</h3>
                                <Separator className="mb-4" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="deliveryTimeInside">Inside Pabna (in days)</Label>
                                        <Input 
                                            id="deliveryTimeInside" 
                                            name="deliveryTimeInside"
                                            type="number"
                                            value={settings.deliveryTimeInside}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 2" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deliveryTimeOutside">Outside Pabna (in days)</Label>
                                        <Input 
                                            id="deliveryTimeOutside" 
                                            name="deliveryTimeOutside"
                                            type="number"
                                            value={settings.deliveryTimeOutside}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 4" 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                             <div className="pt-4">
                                <h3 className="font-semibold text-lg mb-2">Return Address</h3>
                                <Separator className="mb-4" />
                                <div className="space-y-2">
                                    <Label htmlFor="returnAddress">Address for returned products</Label>
                                    <Textarea 
                                        id="returnAddress" 
                                        name="returnAddress"
                                        value={settings.returnAddress}
                                        onChange={handleInputChange}
                                        placeholder="Enter the full address where customers should send returned items." 
                                    />
                                </div>
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

    