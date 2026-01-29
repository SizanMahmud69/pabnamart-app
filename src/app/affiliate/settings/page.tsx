
"use client";

import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const db = getFirestore(app);

function PayoutSettingsPage() {
    const { user, appUser } = useAuth();
    const { toast } = useToast();
    const [payoutMethod, setPayoutMethod] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (appUser?.payoutInfo) {
            setPayoutMethod(appUser.payoutInfo.method);
            setAccountNumber(appUser.payoutInfo.accountNumber);
        }
    }, [appUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !payoutMethod || !accountNumber) {
            toast({ title: 'Error', description: 'Please fill out all fields.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                payoutInfo: {
                    method: payoutMethod,
                    accountNumber: accountNumber
                }
            }, { merge: true });

            toast({ title: 'Success', description: 'Payout information saved successfully.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save payout information.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Payout Settings</h1>
            <Card className="max-w-md mx-auto">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                        <CardDescription>Enter the account details where you want to receive your affiliate earnings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="payoutMethod">Payment Method</Label>
                            <Select value={payoutMethod} onValueChange={setPayoutMethod} required>
                                <SelectTrigger id="payoutMethod">
                                    <SelectValue placeholder="Select a method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bKash">bKash</SelectItem>
                                    <SelectItem value="Nagad">Nagad</SelectItem>
                                    <SelectItem value="Rocket">Rocket</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input
                                id="accountNumber"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="e.g., 01700000000"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Payout Info
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default withAuth(PayoutSettingsPage);
