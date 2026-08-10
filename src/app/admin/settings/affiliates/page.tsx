
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, onSnapshot, doc, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { AffiliateSettings } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const db = getFirestore(app);

export default function AffiliateSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<AffiliateSettings>({ withdrawalDay1: 16, withdrawalDay2: 1, minimumWithdrawal: 100 });
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const settingsRef = doc(db, 'settings', 'affiliate');
        const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(prev => ({...prev, ...docSnap.data()}));
            }
            setIsSettingsLoading(false);
        });
        return () => unsubSettings();
    }, []);

    const handleSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const settingsRef = doc(db, 'settings', 'affiliate');
            const settingsToSave: AffiliateSettings = {
                withdrawalDay1: Number(settings.withdrawalDay1),
                withdrawalDay2: Number(settings.withdrawalDay2),
                minimumWithdrawal: Number(settings.minimumWithdrawal || 0),
                lastWithdrawalRun: settings.lastWithdrawalRun || '',
            };
            await setDoc(settingsRef, settingsToSave);
            toast({ title: "Success", description: "Affiliate settings have been updated." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to save settings.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    if (isSettingsLoading) return <LoadingSpinner />;

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
                <Card>
                    <CardHeader>
                        <CardTitle>Affiliate Withdrawal Settings</CardTitle>
                        <CardDescription>Configure the automatic withdrawal schedule and minimum payout.</CardDescription>
                    </CardHeader>
                     <form onSubmit={handleSettingsSave}>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="withdrawalDay1">First Withdrawal Day</Label>
                                <Input 
                                    id="withdrawalDay1"
                                    name="withdrawalDay1"
                                    type="number"
                                    min="0" max="31"
                                    value={settings.withdrawalDay1}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 16"
                                    disabled={isSaving}
                                />
                                <p className="text-xs text-muted-foreground">Set to 0 to disable.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="withdrawalDay2">Second Withdrawal Day</Label>
                                <Input 
                                    id="withdrawalDay2"
                                    name="withdrawalDay2"
                                    type="number"
                                    min="0" max="31"
                                    value={settings.withdrawalDay2}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 1"
                                    disabled={isSaving}
                                />
                                <p className="text-xs text-muted-foreground">Set to 0 to disable.</p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="minimumWithdrawal">Minimum Withdrawal (৳)</Label>
                                <Input 
                                    id="minimumWithdrawal"
                                    name="minimumWithdrawal"
                                    type="number"
                                    min="0"
                                    value={settings.minimumWithdrawal || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 100"
                                    disabled={isSaving}
                                />
                                <p className="text-xs text-muted-foreground">Min balance for withdrawal.</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSaving} className="w-full">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Settings
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </main>
        </div>
    );
}
