
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeliverySettingsPage() {
    const { toast } = useToast();
    const [deliveryCharge, setDeliveryCharge] = useState('50');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const savedCharge = localStorage.getItem('deliveryCharge');
        if (savedCharge) {
            setDeliveryCharge(savedCharge);
        }
        setIsLoading(false);
    }, []);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        localStorage.setItem('deliveryCharge', deliveryCharge);
        setTimeout(() => {
            toast({
                title: "Settings Saved",
                description: "The delivery charge has been updated successfully.",
            });
            setIsSaving(false);
        }, 500);
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
                            <div className="space-y-2">
                                <Label htmlFor="deliveryCharge">Standard Delivery Charge (৳)</Label>
                                <Input 
                                    id="deliveryCharge" 
                                    name="deliveryCharge"
                                    type="number"
                                    value={deliveryCharge}
                                    onChange={(e) => setDeliveryCharge(e.target.value)}
                                    placeholder="e.g., 50" 
                                />
                                <p className="text-xs text-muted-foreground">
                                    This charge applies to all orders unless a product is marked for free shipping. If any product in the cart has free shipping, the entire order ships for free.
                                </p>
                            </div>
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
