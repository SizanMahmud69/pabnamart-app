
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

const DEFAULT_AVATAR_URL = "https://pix1.wapkizfile.info/download/3090f1dc137678b1189db8cd9174efe6/sizan+wapkiz+click/1puser-(sizan.wapkiz.click).gif";


function AccountInformationPage() {
    const { user, updateUserDisplayName, updateUserProfilePicture } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [isNameLoading, setIsNameLoading] = useState(false);
    const [isPhotoLoading, setIsPhotoLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPhotoURL(user.photoURL || '');
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
    
    const handlePhotoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (photoURL === user?.photoURL) return;
        setIsPhotoLoading(true);
        try {
            await updateUserProfilePicture(photoURL);
            toast({
                title: "Success",
                description: "Profile picture updated successfully."
            });
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update profile picture.",
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
                        <div className="flex justify-center">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user?.photoURL || DEFAULT_AVATAR_URL} alt="User Avatar" />
                                <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        
                        <form onSubmit={handlePhotoSubmit} className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="photoURL">Profile Picture URL</Label>
                                <Input 
                                    id="photoURL" 
                                    value={photoURL} 
                                    onChange={(e) => setPhotoURL(e.target.value)} 
                                    disabled={isPhotoLoading}
                                    placeholder="https://example.com/image.png"
                                />
                            </div>
                            <Button type="submit" disabled={isPhotoLoading || photoURL === user?.photoURL} className="w-full">
                                {isPhotoLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Picture
                            </Button>
                        </form>

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
