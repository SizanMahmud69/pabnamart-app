
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Home, Building, Trash2, Edit, Loader2 } from "lucide-react";
import { withAuth, useAuth } from "@/hooks/useAuth";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ShippingAddress } from '@/types';
import { getFirestore, doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import AddressFormModal from '@/components/AddressFormModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

const db = getFirestore(app);

function ManageAddressesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setAddresses(userData.shippingAddresses || []);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    const handleSetDefault = async (id: string) => {
        if (!user) return;
        const newAddresses = addresses.map(addr => ({ ...addr, default: addr.id === id }));
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { shippingAddresses: newAddresses });
    };

    const handleAddNewAddress = () => {
        setEditingAddress(null);
        setIsModalOpen(true);
    };

    const handleEditAddress = (address: ShippingAddress) => {
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    const handleDeleteAddress = async (addressToDelete: ShippingAddress) => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userDocRef, {
                shippingAddresses: arrayRemove(addressToDelete)
            });
            toast({ title: "Address Deleted", description: "The address has been successfully deleted." });
        } catch (error) {
            console.error("Error deleting address:", error);
            toast({ title: "Error", description: "Failed to delete address.", variant: "destructive" });
        }
    };
    
    const handleSaveAddress = async (address: Omit<ShippingAddress, 'id' | 'default'> & { id?: string }) => {
        if (!user) return;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            await setDoc(userDocRef, { shippingAddresses: [] });
        }
        
        const currentAddresses = userDoc.data()?.shippingAddresses || [];

        if (editingAddress) { // Editing existing address
            const updatedAddresses = currentAddresses.map((addr: ShippingAddress) => 
                addr.id === editingAddress.id ? { ...addr, ...address } : addr
            );
            await updateDoc(userDocRef, { shippingAddresses: updatedAddresses });
            toast({ title: "Address Updated", description: "Your address has been successfully updated." });
        } else { // Adding new address
            const newAddress: ShippingAddress = {
                ...address,
                id: Date.now().toString(),
                default: currentAddresses.length === 0, // Make first address default
            };
            await updateDoc(userDocRef, {
                shippingAddresses: arrayUnion(newAddress)
            });
            toast({ title: "Address Added", description: "Your new address has been saved." });
        }
        setIsModalOpen(false);
        setEditingAddress(null);
    };
    
    const defaultAddressId = addresses.find(a => a.default)?.id || '';

    if (loading) {
        return <LoadingSpinner />;
    }
    
    return (
        <>
            <div className="bg-purple-50/30 min-h-screen">
                <div className="container mx-auto max-w-2xl px-4 py-6">
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
                            <Button size="sm" onClick={handleAddNewAddress}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add New
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {addresses.length > 0 ? (
                                <RadioGroup value={defaultAddressId} onValueChange={handleSetDefault} className="space-y-4">
                                {addresses.map((address) => (
                                    <div key={address.id} className={cn("p-4 rounded-lg border", defaultAddressId === address.id && "border-primary ring-1 ring-primary")}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <RadioGroupItem value={address.id} id={`addr-${address.id}`} className="mt-1" />
                                                <div className="flex-1">
                                                    <Label htmlFor={`addr-${address.id}`} className="font-semibold flex items-center gap-2 cursor-pointer">
                                                        {address.type === 'Home' ? <Home className="h-4 w-4 text-muted-foreground" /> : <Building className="h-4 w-4 text-muted-foreground" />}
                                                        {address.type}
                                                        {address.default && <Badge variant="secondary">Default</Badge>}
                                                    </Label>
                                                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                                        <p className="font-medium text-foreground">{address.fullName}</p>
                                                        <p>{address.phone}</p>
                                                        <p>{address.address}, {address.area}, {address.city}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditAddress(address)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete this address.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteAddress(address)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </RadioGroup>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">You haven't added any shipping addresses yet.</p>
                                    <Button variant="link" onClick={handleAddNewAddress}>Add your first address</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
             <AddressFormModal 
                isOpen={isModalOpen} 
                onClose={() => { setIsModalOpen(false); setEditingAddress(null); }} 
                onSave={handleSaveAddress}
                address={editingAddress} 
            />
        </>
    );
}

export default withAuth(ManageAddressesPage);
