
"use client";

import { useState } from 'react';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

function AccountSecurityPage() {
    const { updateUserPassword } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }
        if (newPassword.length < 6) {
             toast({
                title: "Error",
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            await updateUserPassword(newPassword);
            toast({
                title: "Success",
                description: "Your password has been updated successfully.",
            });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update password. You may need to log in again.",
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
                        <CardTitle>Account Security</CardTitle>
                        <CardDescription>Manage your password and security settings.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <h3 className="font-semibold">Change Password</h3>
                            <div className="space-y-2 relative">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input 
                                    id="newPassword" 
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <Button
                                    type="button" variant="ghost" size="icon"
                                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                             <div className="space-y-2 relative">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input 
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <Button
                                    type="button" variant="ghost" size="icon"
                                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading || !newPassword || !confirmPassword}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default withAuth(AccountSecurityPage);
