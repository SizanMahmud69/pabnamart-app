
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order } from '@/types';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const db = getFirestore(app);

const returnReasons = [
    "Damaged product",
    "Wrong item received",
    "Item not as described",
    "Changed my mind",
    "Other",
];

export default function ReturnRequestPage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState('');
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const params = useParams();
    const orderId = params.id as string;
    const router = useRouter();

    useEffect(() => {
        if (!orderId) return;

        const fetchOrderData = async () => {
            setLoading(true);
            try {
                const orderDocRef = doc(db, 'orders', orderId);
                const orderDocSnap = await getDoc(orderDocRef);

                if (orderDocSnap.exists()) {
                    setOrder({ id: orderDocSnap.id, ...orderDocSnap.data() } as Order);
                } else {
                    toast({ title: "Error", description: "Order not found.", variant: "destructive" });
                    router.push('/account/orders');
                }
            } catch (error) {
                console.error("Error fetching order details:", error);
                toast({ title: "Error", description: "Failed to fetch order details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [orderId, toast, router]);
    
    const handleSubmitReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) {
            toast({ title: "Reason required", description: "Please select a reason for the return.", variant: "destructive"});
            return;
        }
        setIsSubmitting(true);
        
        try {
            const orderDocRef = doc(db, 'orders', orderId);
            await updateDoc(orderDocRef, {
                status: 'return-requested'
            });
            
            toast({
                title: "Return Request Submitted",
                description: "Your return request has been received. We will process it shortly.",
            });
            
            router.push('/account/orders?status=return-requested');
        } catch (error) {
            console.error("Error submitting return request:", error);
            toast({ title: "Error", description: "Failed to submit your return request.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!order) {
        return null;
    }

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto p-4 max-w-2xl">
                <header className="py-4">
                    <Button asChild variant="outline">
                        <Link href="/account/orders?status=delivered">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Delivered Orders
                        </Link>
                    </Button>
                </header>
                <main>
                    <form onSubmit={handleSubmitReturn}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Request a Return</CardTitle>
                                <CardDescription>For order #{order.orderNumber}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Items in this order</h3>
                                    <div className="space-y-4 rounded-md border p-4">
                                        {order.items.map(item => (
                                            <div key={item.id} className="flex items-center gap-4">
                                                <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-semibold">৳{item.price * item.quantity}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-2">
                                    <Label htmlFor="return-reason">Reason for return</Label>
                                    <Select onValueChange={setReason} value={reason} required>
                                        <SelectTrigger id="return-reason">
                                            <SelectValue placeholder="Select a reason" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {returnReasons.map(reason => (
                                                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="comments">Comments (Optional)</Label>
                                    <Textarea 
                                        id="comments" 
                                        value={comments} 
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Please provide more details..."
                                    />
                                </div>

                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSubmitting ? "Submitting..." : "Submit Return Request"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </main>
            </div>
        </div>
    );
}
