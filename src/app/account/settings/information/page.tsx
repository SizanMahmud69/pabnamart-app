
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

function AccountInformationPage() {
    const { user, updateUserDisplayName, updateUserProfilePicture } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user?.displayName) {
            setDisplayName(user.displayName);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (displayName === user?.displayName) return;
        setIsLoading(true);
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
            setIsLoading(false);
        }
    };
    
    const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await updateUserProfilePicture(file);
            toast({
                title: "Success",
                description: "Profile picture updated successfully."
            });
        } catch (error: any) {
            toast({
                title: "Upload Failed",
                description: error.message || "Failed to upload new profile picture.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
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
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={user?.photoURL || ''} alt="User Avatar" />
                                        <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <Button
                                        type="button"
                                        size="icon"
                                        className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                    </Button>
                                    <Input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handlePictureChange}
                                        disabled={isUploading}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">Click the camera to change your picture.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input 
                                    id="displayName" 
                                    value={displayName} 
                                    onChange={(e) => setDisplayName(e.target.value)} 
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" value={user?.email || ''} disabled />
                                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading || displayName === user?.displayName}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}


export default withAuth(AccountInformationPage);
