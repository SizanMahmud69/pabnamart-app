
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { PaymentSettings, PaymentMethod } from '@/types';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { PutBlobResult } from '@vercel/blob';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const db = getFirestore(app);

export default function PaymentSettingsPage() {
    const { toast } = useToast();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [newMethodName, setNewMethodName] = useState('');
    const [newMethodNumber, setNewMethodNumber] = useState('');
    const [newMethodLogoFile, setNewMethodLogoFile] = useState<File | null>(null);
    
    const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const inputFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const settingsDocRef = doc(db, 'settings', 'payment');
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as PaymentSettings | any;
                // Handle migration from old format
                if (data.methods && Array.isArray(data.methods)) {
                    setMethods(data.methods);
                } else if (data.bkashMerchantNumber) { // old format
                    const migratedMethods: PaymentMethod[] = [];
                    if (data.bkashMerchantNumber) migratedMethods.push({ id: 'bkash', name: 'bKash', merchantNumber: data.bkashMerchantNumber, logo: data.bkashLogo });
                    if (data.nagadMerchantNumber) migratedMethods.push({ id: 'nagad', name: 'Nagad', merchantNumber: data.nagadMerchantNumber, logo: data.nagadLogo });
                    if (data.rocketMerchantNumber) migratedMethods.push({ id: 'rocket', name: 'Rocket', merchantNumber: data.rocketMerchantNumber, logo: data.rocketLogo });
                    setMethods(migratedMethods);
                }
            }
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, []);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewMethodLogoFile(e.target.files[0]);
        }
    };
    
    const saveMethods = async (updatedMethods: PaymentMethod[]) => {
        const settingsDocRef = doc(db, 'settings', 'payment');
        await setDoc(settingsDocRef, { methods: updatedMethods });
    };

    const handleAddMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMethodName.trim() || !newMethodNumber.trim() || !newMethodLogoFile) {
            toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        let logoUrl = '';
        try {
            const response = await fetch(`/api/upload?filename=${newMethodLogoFile.name}`, {
                method: 'POST',
                body: newMethodLogoFile,
            });
            if (!response.ok) throw new Error('Failed to upload image.');
            const newBlob = (await response.json()) as PutBlobResult;
            logoUrl = newBlob.url;

            const newMethod: PaymentMethod = {
                id: Date.now().toString(),
                name: newMethodName,
                merchantNumber: newMethodNumber,
                logo: logoUrl
            };
            
            const updatedMethods = [...methods, newMethod];
            await saveMethods(updatedMethods);

            toast({ title: "Success", description: "New payment method added." });
            setNewMethodName('');
            setNewMethodNumber('');
            setNewMethodLogoFile(null);
            if (inputFileRef.current) inputFileRef.current.value = '';

        } catch (error) {
            console.error("Error adding method:", error);
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({ title: "Error", description: `Failed to add method. ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteMethod = async () => {
        if (!methodToDelete) return;
        setIsDeleting(true);
        try {
            const updatedMethods = methods.filter(m => m.id !== methodToDelete.id);
            await saveMethods(updatedMethods);
            toast({ title: "Success", description: "Payment method deleted." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to delete method.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
            setMethodToDelete(null);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <>
        <div className="container mx-auto p-4 max-w-2xl">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                </Button>
            </header>
            <main className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Payment Method</CardTitle>
                    </CardHeader>
                    <form onSubmit={handleAddMethod}>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="method-name">Method Name</Label>
                                    <Input id="method-name" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} placeholder="e.g., bKash" disabled={isSaving} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="method-number">Merchant Number</Label>
                                    <Input id="method-number" value={newMethodNumber} onChange={(e) => setNewMethodNumber(e.target.value)} placeholder="e.g., 01xxxxxxxxx" disabled={isSaving} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Method Logo</Label>
                                <div className="w-full max-w-xs">
                                {newMethodLogoFile ? (
                                    <div className="relative group aspect-video">
                                        <img src={URL.createObjectURL(newMethodLogoFile)} alt="New logo preview" className="object-contain w-full h-full rounded-md border p-2" />
                                        <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => setNewMethodLogoFile(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground text-center mb-1">Click to upload</p>
                                        <p className="text-xs text-muted-foreground">Max 4.5MB</p>
                                        <Input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" ref={inputFileRef} />
                                    </Label>
                                )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Plus className="mr-2 h-4 w-4" />
                                Add Method
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Manage Payment Methods</CardTitle>
                        <CardDescription>View and delete existing payment gateways.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {methods.length > 0 ? (
                            <ul className="space-y-4">
                                {methods.map(method => (
                                    <li key={method.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                                        <div className="flex items-center gap-4">
                                            {method.logo && (
                                                <div className="relative h-10 w-24 rounded-md overflow-hidden bg-white">
                                                    <img src={method.logo} alt={method.name} className="object-contain w-full h-full" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold">{method.name}</p>
                                                <p className="text-sm text-muted-foreground font-mono">{method.merchantNumber}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setMethodToDelete(method)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-center">No payment methods added yet.</p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
        <AlertDialog open={!!methodToDelete} onOpenChange={(open) => !open && setMethodToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the "{methodToDelete?.name}" payment method.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteMethod} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}

    