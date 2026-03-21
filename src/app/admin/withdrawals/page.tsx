
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, X, Eye, Loader2, DollarSign, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Withdrawal, User } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { approveWithdrawal, denyWithdrawal } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const db = getFirestore(app);

function ApproveWithdrawalDialog({ request, onApprove, isProcessing }: { request: Withdrawal, onApprove: (id: string, trxId: string) => Promise<void>, isProcessing: boolean }) {
    const [trxId, setTrxId] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleApprove = async () => {
        if (!trxId.trim()) return;
        await onApprove(request.id, trxId);
        setIsOpen(false);
        setTrxId('');
    }
    
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200">
                    <Check className="mr-1 h-4 w-4"/> Approve
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Approve Withdrawal Request</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are approving a payment of <span className="font-bold text-foreground">৳{request.amount.toFixed(2)}</span> to <span className="font-bold text-foreground">{request.payoutInfo.accountNumber}</span> via <span className="font-bold text-foreground">{request.payoutInfo.method}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="trxId">Transaction ID (Required)</Label>
                        <Input 
                            id="trxId"
                            value={trxId} 
                            onChange={(e) => setTrxId(e.target.value)} 
                            placeholder="e.g. 8K29ML0PX"
                        />
                        <p className="text-xs text-muted-foreground">Enter the ID from your bKash/Nagad/Rocket transaction.</p>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setTrxId('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove} disabled={!trxId.trim() || isProcessing} className="bg-green-600 hover:bg-green-700">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Confirm Payment
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function DenyWithdrawalDialog({ request, onDeny, isProcessing }: { request: Withdrawal, onDeny: (id: string, reason: string) => Promise<void>, isProcessing: boolean }) {
    const [reason, setReason] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleDeny = async () => {
        if (!reason.trim()) return;
        await onDeny(request.id, reason);
        setIsOpen(false);
        setReason('');
    }
    
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <X className="mr-1 h-4 w-4" /> Deny
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Deny Withdrawal Request</AlertDialogTitle>
                    <AlertDialogDescription>
                        Provide a reason for denying this request. The funds will be returned to the affiliate's balance.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Denial</Label>
                        <Input 
                            id="reason"
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)} 
                            placeholder="e.g. Account number incorrect"
                        />
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setReason('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeny} disabled={!reason.trim() || isProcessing} className="bg-destructive hover:bg-destructive/90">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                        Confirm Denial
                    </AlertDialogAction>
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

            // Fetch user info for each withdrawal
            const uniqueUserIds = Array.from(new Set(reqs.map(r => r.affiliateUid)));
            uniqueUserIds.forEach(uid => {
                if (!users[uid]) {
                    const userRef = doc(db, 'users', uid);
                    onSnapshot(userRef, (userDoc) => {
                        if (userDoc.exists()) {
                            setUsers(prev => ({...prev, [uid]: { ...userDoc.data(), uid: userDoc.id } as User}));
                        }
                    });
                }
            });
            setLoading(false);
        });
        return () => unsubscribe();
    }, []); // Removed users from dependency to avoid loop

    const handleApprove = async (withdrawalId: string, trxId: string) => {
        setIsProcessing(withdrawalId);
        try {
            const result = await approveWithdrawal(withdrawalId, trxId);
            if (result.success) {
                toast({ title: "Approved", description: result.message });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to process approval.", variant: "destructive" });
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDeny = async (withdrawalId: string, reason: string) => {
        setIsProcessing(withdrawalId);
        try {
            const result = await denyWithdrawal(withdrawalId, reason);
            if (result.success) {
                toast({ title: "Denied", description: result.message });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to process denial.", variant: "destructive" });
        } finally {
            setIsProcessing(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <header className="py-4 mb-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </header>
            <main>
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <DollarSign className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Withdrawal Management</CardTitle>
                                <CardDescription>Manage and process affiliate payment requests.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="font-semibold">Affiliate</TableHead>
                                        <TableHead className="font-semibold">Requested At</TableHead>
                                        <TableHead className="font-semibold">Amount</TableHead>
                                        <TableHead className="font-semibold">Payout Info</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="text-right font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.length > 0 ? withdrawals.map(req => {
                                        const affiliate = users[req.affiliateUid];
                                        return (
                                            <TableRow key={req.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground">{affiliate?.displayName || 'Loading...'}</span>
                                                        <span className="text-xs text-muted-foreground">{affiliate?.email || '...'}</span>
                                                        {affiliate?.affiliateId && (
                                                            <span className="text-[10px] font-mono mt-1 text-primary">{affiliate.affiliateId}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p>{new Date(req.requestedAt).toLocaleDateString()}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-foreground">৳{req.amount.toFixed(2)}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-semibold uppercase">{req.payoutInfo.method}</span>
                                                        <span className="text-sm font-mono tracking-tight">{req.payoutInfo.accountNumber}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={req.status === 'completed' ? 'default' : req.status === 'failed' ? 'destructive' : 'secondary'} 
                                                        className="capitalize px-2 py-0.5 h-6 text-[10px] font-bold"
                                                    >
                                                        {req.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isProcessing === req.id ? (
                                                        <div className="flex justify-end pr-4">
                                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                        </div>
                                                    ) : req.status === 'pending' ? (
                                                        <div className="flex gap-2 justify-end">
                                                            <ApproveWithdrawalDialog 
                                                                request={req} 
                                                                onApprove={handleApprove} 
                                                                isProcessing={isProcessing === req.id}
                                                            />
                                                            <DenyWithdrawalDialog 
                                                                request={req} 
                                                                onDeny={handleDeny}
                                                                isProcessing={isProcessing === req.id}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end pr-2">
                                                            {req.transactionId ? (
                                                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border">Trx: {req.transactionId}</span>
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground italic">Processed</span>
                                                            )}
                                                            <span className="text-[9px] text-muted-foreground mt-1">
                                                                {req.processedAt ? new Date(req.processedAt).toLocaleDateString() : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <DollarSign className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No withdrawal requests found.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
