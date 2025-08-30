
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

interface PaymentSettings {
  bkashMerchantNumber: string;
  nagadMerchantNumber: string;
  rocketMerchantNumber: string;
}

const initialSettings: PaymentSettings = {
    bkashMerchantNumber: '01234567890',
    nagadMerchantNumber: '01234567891',
    rocketMerchantNumber: '01234567892',
};

export default function PaymentSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PaymentSettings>(initialSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('paymentSettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error("Could not read payment settings from localStorage", error);
        }
        setIsLoading(false);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            localStorage.setItem('paymentSettings', JSON.stringify(settings));
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
            // Simulate a delay for better UX
            setTimeout(() => setIsSaving(false), 500);
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
                            <CardDescription>Manage the merchant numbers for online payment gateways.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
