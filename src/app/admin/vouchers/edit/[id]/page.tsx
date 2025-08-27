
"use client";

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

// Mock data for demonstration
const mockVouchers = [
  { id: '1', code: 'PABNA50', type: 'Fixed', value: '50', minSpend: '500' },
  { id: '2', code: 'FREESHIP', type: 'Fixed', value: '50', minSpend: '' },
  { id: '3', code: 'NEW100', type: 'Fixed', value: '100', minSpend: '' },
  { id: '4', code: 'OLDVOUCHER', type: 'Percentage', value: '10', minSpend: '1000' },
];

type VoucherType = {
    id: string;
    code: string;
    type: string;
    value: string;
    minSpend: string;
}

export default function EditVoucherPage() {
    const router = useRouter();
    const params = useParams();
    const voucherId = params.id as string;
    const { toast } = useToast();
    const [voucher, setVoucher] = useState<VoucherType | undefined>(undefined);
    const [voucherType, setVoucherType] = useState('');

    useEffect(() => {
        const voucherToEdit = mockVouchers.find(v => v.id === voucherId);
        if (voucherToEdit) {
            setVoucher(voucherToEdit);
            setVoucherType(voucherToEdit.type);
        }
    }, [voucherId]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: "Voucher Updated",
            description: "The voucher has been successfully updated.",
        });
        router.push('/admin/vouchers');
    };
    
    if (!voucher) {
        return <div className="container mx-auto p-4">Loading...</div>
    }

    return (
        <div className="container mx-auto p-4">
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
                                <Input id="code" defaultValue={voucher.code} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Voucher Type</Label>
                                    <Select required value={voucherType} onValueChange={setVoucherType}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Fixed">Fixed</SelectItem>
                                            <SelectItem value="Percentage">Percentage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="value">Value</Label>
                                    <Input id="value" type="number" defaultValue={voucher.value} required />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="min-spend">Minimum Spend (৳)</Label>
                                <Input id="min-spend" type="number" defaultValue={voucher.minSpend} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
