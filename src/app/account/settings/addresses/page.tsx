
"use client";

import { useState } from 'react';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Home, Building, Trash2, Edit } from "lucide-react";
import { withAuth } from "@/hooks/useAuth";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ShippingAddress } from '@/types';

const mockAddresses: Omit<ShippingAddress, 'icon'>[] = [
    { id: '1', type: 'Home', details: '123 Test Street, Mocktown, USA', default: true },
    { id: '2', type: 'Office', details: '456 Work Ave, Business City, USA', default: false },
];

function ManageAddressesPage() {
    const [addresses, setAddresses] = useState(mockAddresses);
    const [defaultAddressId, setDefaultAddressId] = useState(mockAddresses.find(a => a.default)?.id || '');

    const handleSetDefault = (id: string) => {
        setAddresses(addresses.map(addr => ({ ...addr, default: addr.id === id })));
        setDefaultAddressId(id);
    };
    
    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-md px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                </Button>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Shipping Addresses</CardTitle>
                            <CardDescription>Manage your delivery addresses.</CardDescription>
                        </div>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={defaultAddressId} onValueChange={handleSetDefault} className="space-y-4">
                            {addresses.map((address) => (
                                <div key={address.id} className={cn("p-4 rounded-lg border", defaultAddressId === address.id && "border-primary")}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <RadioGroupItem value={address.id} id={`addr-${address.id}`} />
                                            <div>
                                                <Label htmlFor={`addr-${address.id}`} className="font-semibold flex items-center gap-2">
                                                    {address.type === 'Home' ? <Home className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                                                    {address.type}
                                                    {address.default && <Badge>Default</Badge>}
                                                </Label>
                                                <p className="text-sm text-muted-foreground">{address.details}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default withAuth(ManageAddressesPage);
