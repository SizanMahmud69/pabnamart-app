
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function AccountInformationPage() {
    const { user, updateUserDisplayName } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

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
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input 
                                    id="displayName" 
                                    value={displayName} 
                                    onChange={(e) => setDisplayName(e.target.value)} 
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
