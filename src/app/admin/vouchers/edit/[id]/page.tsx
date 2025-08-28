
"use client";

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Voucher } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

const db = getFirestore(app);

export default function EditVoucherPage() {
    const router = useRouter();
    const params = useParams();
    const voucherId = params.id as string;
    const { toast } = useToast();
    const [voucher, setVoucher] = useState<Voucher | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [voucherCode, setVoucherCode] = useState('');
    const [voucherType, setVoucherType] = useState<'fixed' | 'percentage'>('fixed');
    const [discount, setDiscount] = useState(0);
    const [minSpend, setMinSpend] = useState<number | undefined>(undefined);
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState<'order' | 'shipping'>('order');

    useEffect(() => {
        if (!voucherId) return;

        const fetchVoucher = async () => {
            setLoading(true);
            const voucherRef = doc(db, 'vouchers', voucherId);
            const docSnap = await getDoc(voucherRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as Voucher;
                setVoucher(data);
                setVoucherCode(data.code);
                setVoucherType(data.type);
                setDiscount(data.discount);
                setMinSpend(data.minSpend);
                setDescription(data.description);
                setDiscountType(data.discountType || 'order');
            } else {
                toast({ title: "Error", description: "Voucher not found.", variant: "destructive" });
                router.push('/admin/vouchers');
            }
            setLoading(false);
        };
        fetchVoucher();
    }, [voucherId, router, toast]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const voucherRef = doc(db, 'vouchers', voucherId);
            await updateDoc(voucherRef, {
                code: voucherCode,
                type: voucherType,
                discount: Number(discount),
                minSpend: minSpend ? Number(minSpend) : null,
                description,
                discountType,
            });

            toast({
                title: "Voucher Updated",
                description: "The voucher has been successfully updated.",
            });
            router.push('/admin/vouchers');
        } catch (error) {
            console.error("Error updating voucher: ", error);
            toast({ title: "Error", description: "Failed to update voucher.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return <LoadingSpinner />
    }

    return (
        <div className="container mx-auto p-4 max-w-lg">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/vouchers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Vouchers
                    </Link>
                </Button>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Voucher</CardTitle>
                            <CardDescription>Update the details for the voucher.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="code">Voucher Code</Label>
                                <Input id="code" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} required disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., On orders over ৳500" required disabled={isSaving}/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Voucher Type</Label>
                                    <Select required value={voucherType} onValueChange={(v) => setVoucherType(v as 'fixed' | 'percentage')} disabled={isSaving}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">Fixed</SelectItem>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discountType">Discount Type</Label>
                                    <Select required value={discountType} onValueChange={(v) => setDiscountType(v as 'order' | 'shipping')} disabled={isSaving}>
                                        <SelectTrigger id="discountType">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="order">Order</SelectItem>
                                            <SelectItem value="shipping">Shipping</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="discount">Discount Value</Label>
                                    <Input id="discount" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} required placeholder="e.g., 50 or 10" disabled={isSaving}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="min-spend">Minimum Spend (৳)</Label>
                                    <Input id="min-spend" type="number" value={minSpend || ''} onChange={(e) => setMinSpend(e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g., 500" disabled={isSaving}/>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
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
