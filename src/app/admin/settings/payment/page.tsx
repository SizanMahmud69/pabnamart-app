
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { PaymentSettings } from '@/types';
import { Separator } from '@/components/ui/separator';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { PutBlobResult } from '@vercel/blob';
import Image from 'next/image';

const db = getFirestore(app);

const initialSettings: PaymentSettings = {
    bkashMerchantNumber: '',
    nagadMerchantNumber: '',
    rocketMerchantNumber: '',
    bkashLogo: '',
    nagadLogo: '',
    rocketLogo: '',
};

type LogoFileState = {
  bkash: File | null;
  nagad: File | null;
  rocket: File | null;
};

export default function PaymentSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PaymentSettings>(initialSettings);
    const [logoFiles, setLogoFiles] = useState<LogoFileState>({ bkash: null, nagad: null, rocket: null });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const bkashInputRef = useRef<HTMLInputElement>(null);
    const nagadInputRef = useRef<HTMLInputElement>(null);
    const rocketInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const settingsDocRef = doc(db, 'settings', 'payment');
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(prev => ({...prev, ...docSnap.data()}));
            }
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (gateway: keyof LogoFileState, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFiles(prev => ({ ...prev, [gateway]: e.target.files![0] }));
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const response = await fetch(`/api/upload?filename=${file.name}`, {
            method: 'POST',
            body: file,
        });
        if (!response.ok) {
            throw new Error('Failed to upload image.');
        }
        const newBlob = (await response.json()) as PutBlobResult;
        return newBlob.url;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        const updatedSettings = { ...settings };

        try {
            if (logoFiles.bkash) {
                updatedSettings.bkashLogo = await uploadImage(logoFiles.bkash);
            }
            if (logoFiles.nagad) {
                updatedSettings.nagadLogo = await uploadImage(logoFiles.nagad);
            }
            if (logoFiles.rocket) {
                updatedSettings.rocketLogo = await uploadImage(logoFiles.rocket);
            }

            const settingsDocRef = doc(db, 'settings', 'payment');
            await setDoc(settingsDocRef, updatedSettings, { merge: true });

            setSettings(updatedSettings);
            setLogoFiles({ bkash: null, nagad: null, rocket: null });

            toast({
                title: "Settings Saved",
                description: "The payment settings have been updated successfully.",
            });
        } catch (error) {
             toast({
                title: "Error",
                description: "Failed to save settings.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }
    
    const renderImageUpload = (gateway: keyof LogoFileState, ref: React.RefObject<HTMLInputElement>) => {
        const file = logoFiles[gateway];
        const existingLogo = settings[`${gateway}Logo` as keyof PaymentSettings];
        const previewUrl = file ? URL.createObjectURL(file) : existingLogo;

        return (
            <div className="space-y-2">
                <Label htmlFor={`${gateway}-logo`}>{gateway.charAt(0).toUpperCase() + gateway.slice(1)} Logo</Label>
                <div className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center">
                    {previewUrl ? (
                        <div className="relative w-full h-full">
                            <Image src={previewUrl} alt={`${gateway} logo preview`} layout="fill" objectFit="contain" className="p-2" />
                            <Button 
                                type="button" 
                                size="icon" 
                                variant="destructive" 
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full" 
                                onClick={() => {
                                    setLogoFiles(prev => ({ ...prev, [gateway]: null }));
                                    setSettings(prev => ({...prev, [`${gateway}Logo`]: ''}));
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                         <Label htmlFor={`${gateway}-upload`} className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted">
                            <Upload className="w-8 h-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload</p>
                            <Input id={`${gateway}-upload`} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(gateway, e)} ref={ref} />
                        </Label>
                    )}
                </div>
            </div>
        );
    }


    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                </Button>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Settings</CardTitle>
                            <CardDescription>Manage payment gateways and site logos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div>
                                <h3 className="text-lg font-medium mb-2">Payment Merchant Numbers</h3>
                                <Separator />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bkashMerchantNumber">bKash Merchant Number</Label>
                                <Input 
                                    id="bkashMerchantNumber" 
                                    name="bkashMerchantNumber"
                                    value={settings.bkashMerchantNumber}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 01xxxxxxxxx" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nagadMerchantNumber">Nagad Merchant Number</Label>
                                <Input 
                                    id="nagadMerchantNumber" 
                                    name="nagadMerchantNumber"
                                    value={settings.nagadMerchantNumber}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 01xxxxxxxxx" 
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="rocketMerchantNumber">Rocket Merchant Number</Label>
                                <Input 
                                    id="rocketMerchantNumber" 
                                    name="rocketMerchantNumber"
                                    value={settings.rocketMerchantNumber}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 01xxxxxxxxx" 
                                />
                            </div>

                             <div className="pt-4">
                                <h3 className="text-lg font-medium mb-2">Payment Gateway Logos</h3>
                                <Separator />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderImageUpload('bkash', bkashInputRef)}
                                {renderImageUpload('nagad', nagadInputRef)}
                                {renderImageUpload('rocket', rocketInputRef)}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
