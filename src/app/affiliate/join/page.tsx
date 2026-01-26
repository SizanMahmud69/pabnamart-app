
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

    const [nidNumber, setNidNumber] = useState('');
    const [nidImageFile, setNidImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNidImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nidNumber || !nidImageFile || !user?.displayName || !user.email) {
            toast({ title: "Error", description: "Please fill all fields and upload an image.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        let imageUrl = '';
        try {
            const response = await fetch(`/api/upload?filename=${nidImageFile.name}`, {
                method: 'POST',
                body: nidImageFile,
            });
            if (!response.ok) throw new Error('Failed to upload image.');
            const newBlob = (await response.json()) as PutBlobResult;
            imageUrl = newBlob.url;

            const result = await submitAffiliateRequest(user.uid, user.displayName, user.email, nidNumber, imageUrl);

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
                            <div className="space-y-2">
                                <Label>NID Card Image</Label>
                                {nidImageFile ? (
                                    <div className="relative group aspect-video">
                                        <img src={URL.createObjectURL(nidImageFile)} alt="NID preview" className="object-contain w-full h-full rounded-md border p-1" />
                                        <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => setNidImageFile(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground text-center">Click to upload NID image</p>
                                        <Input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                    </Label>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isSubmitting || !nidNumber || !nidImageFile}>
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
