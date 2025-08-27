
"use client";

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

// Mock data for demonstration
const mockOffers = [
  { id: '1', name: 'Mega Electronics Sale', discount: '40', startDate: '2023-10-20', endDate: '2023-10-31' },
  { id: '2', name: 'Winter Fashion Fest', discount: '25', startDate: '2023-11-01', endDate: '2023-11-15' },
  { id: '3', name: 'Summer Clearance', discount: '50', startDate: '2023-08-01', endDate: '2023-08-15' },
];


export default function EditOfferPage() {
    const router = useRouter();
    const params = useParams();
    const offerId = params.id as string;
    const { toast } = useToast();
    const [offer, setOffer] = useState<{ id: string; name: string; discount: string; startDate: string; endDate: string; } | undefined>(undefined);

    useEffect(() => {
        const offerToEdit = mockOffers.find(o => o.id === offerId);
        setOffer(offerToEdit);
    }, [offerId]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: "Offer Updated",
            description: "The offer has been successfully updated.",
        });
        router.push('/admin/offers');
    };
    
    if (!offer) {
        return <div className="container mx-auto p-4">Loading...</div>
    }

    return (
        <div className="container mx-auto p-4">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/offers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Offers
                    </Link>
                </Button>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Offer</CardTitle>
                            <CardDescription>Update the details for the offer campaign.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Offer Name</Label>
                                <Input id="name" defaultValue={offer.name} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="discount">Discount Percentage</Label>
                                <Input id="discount" type="number" defaultValue={offer.discount} required />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Start Date</Label>
                                    <Input id="start-date" type="date" defaultValue={offer.startDate} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <Input id="end-date" type="date" defaultValue={offer.endDate} required />
                                </div>
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
