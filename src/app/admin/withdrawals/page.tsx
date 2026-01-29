
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, X, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Withdrawal, User } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { approveWithdrawal, denyWithdrawal } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

const db = getFirestore(app);

function ApproveWithdrawalDialog({ request, onApprove }: { request: Withdrawal, onApprove: (id: string, trxId: string) => Promise<void> }) {
    const [trxId, setTrxId] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleApprove = async () => {
        if (!trxId.trim()) return;
        await onApprove(request.id, trxId);
        setIsOpen(false);
    }
    
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm"><Check className="mr-2 h-4 w-4"/> Approve</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Approve Withdrawal?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter the transaction ID for this withdrawal of ৳{request.amount}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input 
                    value={trxId} 
                    onChange={(e) => setTrxId(e.target.value)} 
                    placeholder="Enter Transaction ID"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove} disabled={!trxId.trim()}>Confirm Approval</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function DenyWithdrawalDialog({ request, onDeny }: { request: Withdrawal, onDeny: (id: string, reason: string) => Promise<void> }) {
    const [reason, setReason] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleDeny = async () => {
        if (!reason.trim()) return;
        await onDeny(request.id, reason);
        setIsOpen(false);
    }
    
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                 <Button variant="destructive" size="sm"><X className="mr-2 h-4 w-4" /> Deny</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Deny Withdrawal?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please provide a reason for denying this withdrawal. This will be sent to the user.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Reason for denial"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeny} disabled={!reason.trim()}>Confirm Denial</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function WithdrawalRequestsPage() {
    const { toast } = useToast();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        const requestsRef = collection(db, 'withdrawals');
        const q = query(requestsRef, orderBy('requestedAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
            setWithdrawals(reqs);

            const userIds = new Set(reqs.map(r => r.affiliateUid));
            userIds.forEach(uid => {
                if (!users[uid]) {
                    const userRef = doc(db, 'users', uid);
                    onSnapshot(userRef, (userDoc) => {
                        if (userDoc.exists()) {
                            setUsers(prev => ({...prev, [uid]: userDoc.data() as User}));
                        }
                    });
                }
            });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [users]);

    const handleApprove = async (withdrawalId: string, trxId: string) => {
        setIsProcessing(withdrawalId);
        const result = await approveWithdrawal(withdrawalId, trxId);
        if (result.success) {
            toast({ title: "Success", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsProcessing(null);
    };

    const handleDeny = async (withdrawalId: string, reason: string) => {
        setIsProcessing(withdrawalId);
        const result = await denyWithdrawal(withdrawalId, reason);
        if (result.success) {
            toast({ title: "Success", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsProcessing(null);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mx-auto p-4">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </header>
            <main>
                <Card>
                    <CardHeader>
                        <CardTitle>Withdrawal Requests</CardTitle>
                        <CardDescription>Review and process affiliate payment requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Affiliate</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Payout Info</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {withdrawals.length > 0 ? withdrawals.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{users[req.affiliateUid]?.displayName || '...'}</div>
                                            <div className="text-sm text-muted-foreground">{users[req.affiliateUid]?.email || '...'}</div>
                                        </TableCell>
                                        <TableCell>৳{req.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <div>{req.payoutInfo.method}</div>
                                            <div className="text-sm text-muted-foreground">{req.payoutInfo.accountNumber}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={req.status === 'completed' ? 'default' : req.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize">{req.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isProcessing === req.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                                            ) : req.status === 'pending' ? (
                                                <div className="flex gap-2 justify-end">
                                                    <ApproveWithdrawalDialog request={req} onApprove={handleApprove} />
                                                    <DenyWithdrawalDialog request={req} onDeny={handleDeny} />
                                                </div>
                                            ) : (
                                                req.transactionId && <div className="text-xs text-muted-foreground">TrxID: {req.transactionId}</div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No withdrawal requests found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
