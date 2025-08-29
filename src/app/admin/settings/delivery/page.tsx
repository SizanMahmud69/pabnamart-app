
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

const initialSettings: DeliverySettings = {
    insidePabnaSmall: 60,
    insidePabnaLarge: 80,
    outsidePabnaSmall: 120,
    outsidePabnaLarge: 150,
};

export default function DeliverySettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<DeliverySettings>(initialSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('deliverySettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error("Could not read delivery settings from localStorage", error);
        }
        setIsLoading(false);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            localStorage.setItem('deliverySettings', JSON.stringify(settings));
            toast({
                title: "Settings Saved",
                description: "The delivery charges have been updated successfully.",
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
        return <div className="container mx-auto p-4">Loading settings...</div>;
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
                            <CardDescription>Manage the delivery charges for your store based on quantity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Inside Pabna City</h3>
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
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">Outside Pabna City</h3>
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
                            
                            <p className="text-xs text-muted-foreground pt-4">
                                This charge applies to all orders unless a product is marked for free shipping. If any product in the cart has free shipping, the entire order ships for free. The correct charge will be applied at checkout based on the user's address and item count.
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
