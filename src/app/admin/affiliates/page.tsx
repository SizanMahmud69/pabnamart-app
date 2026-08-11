
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, X, Eye, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { AffiliateRequest } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { approveAffiliateRequest, denyAffiliateRequest } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

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
                <Button variant="ghost" size="sm" className="w-full justify-start text-destructive focus:text-destructive">
                    <X className="mr-2 h-4 w-4" /> Deny Request
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
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [requestToDelete, setRequestToDelete] = useState<AffiliateRequest | null>(null);

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
        setIsProcessing(requestId);
    };
    
    const handleDeny = async (requestId: string, reason: string) => {
        setIsProcessing(requestId);
        const result = await denyAffiliateRequest(requestId, reason);
         if (result.success) {
            toast({ title: "Success", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsProcessing(requestId);
    };

    const handleDeleteRequest = async (requestId: string) => {
        setIsProcessing(requestId);
        try {
            await deleteDoc(doc(db, 'affiliateRequests', requestId));
            toast({ title: "Deleted", description: "Request has been permanently deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete request.", variant: "destructive" });
        } finally {
            setIsProcessing(null);
            setRequestToDelete(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mx-auto p-4 max-w-4xl">
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
                        <CardTitle>Affiliate Requests</CardTitle>
                        <CardDescription>Review and manage affiliate program applications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>NID Number</TableHead>
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
                                            <Badge variant={req.status === 'approved' ? 'default' : req.status === 'denied' ? 'destructive' : 'secondary'} className="capitalize">{req.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {isProcessing === req.id ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <a href={req.nidFrontImageUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                                                    <Eye className="mr-2 h-4 w-4" /> View NID Front
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <a href={req.nidBackImageUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                                                    <Eye className="mr-2 h-4 w-4" /> View NID Back
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {req.status === 'pending' && (
                                                                <>
                                                                    <DropdownMenuItem onSelect={() => handleApprove(req.id)}>
                                                                        <Check className="mr-2 h-4 w-4 text-green-600" /> Approve Request
                                                                    </DropdownMenuItem>
                                                                    <DenyRequestDialog request={req} onDeny={handleDeny} />
                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}
                                                            <DropdownMenuItem 
                                                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                                onSelect={() => setRequestToDelete(req)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Permanent Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No affiliate requests found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>

            <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Request Permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the affiliate request for <span className="font-bold">{requestToDelete?.displayName}</span> from the database. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => requestToDelete && handleDeleteRequest(requestToDelete.id)}
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

