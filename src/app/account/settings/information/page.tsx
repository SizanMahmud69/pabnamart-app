
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Camera } from "lucide-react";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PutBlobResult } from '@vercel/blob';

const DEFAULT_AVATAR_URL = "https://pix1.wapkizfile.info/download/3090f1dc137678b1189db8cd9174efe6/sizan+wapkiz+click/1puser-(sizan.wapkiz.click).gif";


function AccountInformationPage() {
    const { user, updateUserDisplayName, updateUserProfilePicture } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [isNameLoading, setIsNameLoading] = useState(false);
    const [isPhotoLoading, setIsPhotoLoading] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
        }
    }, [user]);

    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (displayName === user?.displayName) return;
        setIsNameLoading(true);
        try {
            await updateUserDisplayName(displayName);
            toast({
                title: "Success",
                description: "Your name has been updated successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update your name.",
                variant: "destructive",
            });
        } finally {
            setIsNameLoading(false);
        }
    };
    
    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsPhotoLoading(true);

        try {
            const response = await fetch(
                `/api/upload?filename=${file.name}`,
                {
                  method: 'POST',
                  body: file,
                },
              );
            
            if (!response.ok) {
                throw new Error('Failed to upload image.');
            }
            const newBlob = (await response.json()) as PutBlobResult;
            const downloadURL = newBlob.url;
            
            await updateUserProfilePicture(downloadURL);

            toast({
                title: "Success",
                description: "Profile picture updated successfully."
            });
        } catch (error) {
            console.error("Profile picture update failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Please check your network connection or browser extensions.";
            toast({
                title: "Update Failed",
                description: `Failed to update profile picture. ${errorMessage}`,
                variant: "destructive"
            });
        } finally {
            setIsPhotoLoading(false);
        }
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
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>View and edit your personal details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex flex-col items-center gap-2">
                           <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={user?.photoURL || DEFAULT_AVATAR_URL} alt="User Avatar" />
                                    <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isPhotoLoading}
                                >
                                    {isPhotoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                </Button>
                                <Input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    disabled={isPhotoLoading}
                                />
                           </div>
                           <p className="text-xs text-muted-foreground">Max file size: 4.5MB</p>
                        </div>
                        
                        <form onSubmit={handleNameSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input 
                                    id="displayName" 
                                    value={displayName} 
                                    onChange={(e) => setDisplayName(e.target.value)} 
                                    disabled={isNameLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" value={user?.email || ''} disabled />
                                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                            </div>
                            <Button type="submit" disabled={isNameLoading || displayName === user?.displayName} className="w-full">
                                {isNameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Name Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default withAuth(AccountInformationPage);
    

    