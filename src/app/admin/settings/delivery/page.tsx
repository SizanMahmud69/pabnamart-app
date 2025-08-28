
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
    insidePabna: 60,
    outsidePabna: 120,
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
                            <CardDescription>Manage the delivery charges for your store.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="insidePabna">Inside Pabna City (৳)</Label>
                                    <Input 
                                        id="insidePabna" 
                                        name="insidePabna"
                                        type="number"
                                        value={settings.insidePabna}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 60" 
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="outsidePabna">Outside Pabna City (৳)</Label>
                                    <Input 
                                        id="outsidePabna" 
                                        name="outsidePabna"
                                        type="number"
                                        value={settings.outsidePabna}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 120" 
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground pt-4">
                                This charge applies to all orders unless a product is marked for free shipping. If any product in the cart has free shipping, the entire order ships for free. The correct charge will be applied at checkout based on the user's address.
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
