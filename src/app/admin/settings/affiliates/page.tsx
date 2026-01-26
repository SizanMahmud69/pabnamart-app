
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, X, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { AffiliateRequest } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { approveAffiliateRequest, denyAffiliateRequest } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

const db = getFirestore(app);

function DenyRequestDialog({ request, onDeny }: { request: AffiliateRequest, onDeny: (id: string, reason: string) => Promise<void> }) {
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
                <Button variant="destructive" size="sm">
                    <X className="mr-2 h-4 w-4" /> Deny
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Deny Affiliate Request?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please provide a reason for denying the request for {request.displayName}. This will be sent to the user.
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

export default function AffiliateRequestsPage() {
    const { toast } = useToast();
    const [requests, setRequests] = useState<AffiliateRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null); // To track which request is being processed

    useEffect(() => {
        const requestsRef = collection(db, 'affiliateRequests');
        const q = query(requestsRef, orderBy('requestedAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AffiliateRequest));
            setRequests(reqs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleApprove = async (requestId: string) => {
        setIsProcessing(requestId);
        const result = await approveAffiliateRequest(requestId);
        if (result.success) {
            toast({ title: "Success", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsProcessing(null);
    };
    
    const handleDeny = async (requestId: string, reason: string) => {
        setIsProcessing(requestId);
        const result = await denyAffiliateRequest(requestId, reason);
         if (result.success) {
            toast({ title: "Success", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsProcessing(null);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mx-auto p-4 max-w-4xl">
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
                        <CardTitle>Affiliate Requests</CardTitle>
                        <CardDescription>Review and manage affiliate program applications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>NID Number</TableHead>
                                    <TableHead>NID Image</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length > 0 ? requests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{req.displayName}</div>
                                            <div className="text-sm text-muted-foreground">{req.email}</div>
                                        </TableCell>
                                        <TableCell>{req.nidNumber}</TableCell>
                                        <TableCell>
                                            <Button asChild variant="link" size="sm">
                                                <a href={req.nidImageUrl} target="_blank" rel="noopener noreferrer">
                                                    <Eye className="mr-2 h-4 w-4"/> View
                                                </a>
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={req.status === 'approved' ? 'default' : req.status === 'denied' ? 'destructive' : 'secondary'} className="capitalize">{req.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isProcessing === req.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                                            ) : req.status === 'pending' ? (
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => handleApprove(req.id)}><Check className="mr-2 h-4 w-4"/> Approve</Button>
                                                    <DenyRequestDialog request={req} onDeny={handleDeny} />
                                                </div>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No affiliate requests found.</TableCell>
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
