
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { submitAffiliateRequest } from '@/app/actions';
import type { PutBlobResult } from '@vercel/blob';

function JoinAffiliatePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [fullName, setFullName] = useState(user?.displayName || '');
    const [nidNumber, setNidNumber] = useState('');
    const [nidFrontImageFile, setNidFrontImageFile] = useState<File | null>(null);
    const [nidBackImageFile, setNidBackImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        if (e.target.files && e.target.files[0]) {
            if (side === 'front') {
                setNidFrontImageFile(e.target.files[0]);
            } else {
                setNidBackImageFile(e.target.files[0]);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !nidNumber || !nidFrontImageFile || !nidBackImageFile || !user?.email) {
            toast({ title: "Error", description: "Please fill all fields and upload both NID images.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        let frontImageUrl = '';
        let backImageUrl = '';

        try {
            // Upload front image
            const frontRes = await fetch(`/api/upload?filename=${nidFrontImageFile.name}`, {
                method: 'POST',
                body: nidFrontImageFile,
            });
            if (!frontRes.ok) throw new Error('Failed to upload front NID image.');
            const frontBlob = (await frontRes.json()) as PutBlobResult;
            frontImageUrl = frontBlob.url;
            
            // Upload back image
            const backRes = await fetch(`/api/upload?filename=${nidBackImageFile.name}`, {
                method: 'POST',
                body: nidBackImageFile,
            });
            if (!backRes.ok) throw new Error('Failed to upload back NID image.');
            const backBlob = (await backRes.json()) as PutBlobResult;
            backImageUrl = backBlob.url;


            const result = await submitAffiliateRequest(user.uid, fullName, user.email, nidNumber, frontImageUrl, backImageUrl);

            if (result.success) {
                toast({ title: "Request Submitted", description: result.message });
                router.push('/affiliate');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({ title: "Submission Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-lg">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/affiliate">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Affiliate Program Application</CardTitle>
                            <CardDescription>Please provide your information for verification.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input 
                                    id="fullName" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name as on NID"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nidNumber">NID Card Number</Label>
                                <Input 
                                    id="nidNumber" 
                                    value={nidNumber}
                                    onChange={(e) => setNidNumber(e.target.value)}
                                    placeholder="Enter your National ID number"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>NID Card (Front Side)</Label>
                                    {nidFrontImageFile ? (
                                        <div className="relative group aspect-video">
                                            <img src={URL.createObjectURL(nidFrontImageFile)} alt="NID front preview" className="object-contain w-full h-full rounded-md border p-1" />
                                            <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => setNidFrontImageFile(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Label htmlFor="front-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                            <Upload className="w-8 h-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground text-center">Upload Front</p>
                                            <Input id="front-image-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'front')} accept="image/*" />
                                        </Label>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>NID Card (Back Side)</Label>
                                    {nidBackImageFile ? (
                                        <div className="relative group aspect-video">
                                            <img src={URL.createObjectURL(nidBackImageFile)} alt="NID back preview" className="object-contain w-full h-full rounded-md border p-1" />
                                            <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => setNidBackImageFile(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Label htmlFor="back-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                            <Upload className="w-8 h-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground text-center">Upload Back</p>
                                            <Input id="back-image-upload" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'back')} accept="image/*" />
                                        </Label>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isSubmitting || !fullName || !nidNumber || !nidFrontImageFile || !nidBackImageFile}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit for Verification
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );
}

export default withAuth(JoinAffiliatePage);
