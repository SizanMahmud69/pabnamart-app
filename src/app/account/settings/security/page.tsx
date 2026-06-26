
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import { sendVerificationEmail, verifyEmailCode } from '@/app/actions';

const db = getFirestore(app);

function AccountSecurityPage() {
    const { user, appUser, updateUserPassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Email Verification States
    const [isVerifying, setIsVerifying] = useState(false);
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'initial' | 'otp'>('initial');

    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match.",
                variant: "destructive",
            });
            return;
        }
        if (newPassword.length < 6) {
             toast({
                title: "Error",
                description: "New password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            await updateUserPassword(currentPassword, newPassword);
            toast({
                title: "Success",
                description: "Your password has been updated successfully.",
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update password.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendCode = async () => {
        if (!user?.email || !user?.uid) return;
        setIsVerifying(true);
        try {
            const result = await sendVerificationEmail(user.uid, user.email);
            if (result.success) {
                toast({
                    title: "Email Sent!",
                    description: result.message,
                });
                setStep('otp');
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send verification code.",
                variant: "destructive"
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!user?.uid || !otp) return;
        setIsVerifying(true);
        try {
            const result = await verifyEmailCode(user.uid, otp);
            if (result.success) {
                toast({
                    title: "Account Verified!",
                    description: result.message,
                });
                setStep('initial');
            } else {
                toast({
                    title: "Invalid Code",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Verification failed. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsVerifying(false);
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
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                             <Mail className="h-5 w-5 text-primary" />
                             <CardTitle>Email Verification</CardTitle>
                        </div>
                        <CardDescription>Verify your email to secure your account and get a verified badge.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {appUser?.emailVerified ? (
                            <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg border border-green-100 text-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                                <h3 className="font-bold text-green-700">Email Verified</h3>
                                <p className="text-sm text-green-600">Your account is now fully verified and secure.</p>
                            </div>
                        ) : (
                            <>
                                {step === 'initial' ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                                            <span className="text-sm font-medium">{user?.email}</span>
                                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold uppercase">Unverified</span>
                                        </div>
                                        <Button onClick={handleSendCode} disabled={isVerifying} className="w-full">
                                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Send Verification Code
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="otp">Enter 6-Digit Code</Label>
                                            <Input 
                                                id="otp" 
                                                placeholder="000000" 
                                                value={otp} 
                                                onChange={(e) => setOtp(e.target.value)}
                                                maxLength={6}
                                                className="text-center text-2xl tracking-widest font-bold"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                             <Button variant="outline" onClick={() => setStep('initial')} className="flex-1">Back</Button>
                                             <Button onClick={handleVerifyOtp} disabled={isVerifying || otp.length < 6} className="flex-1">
                                                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Verify
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <CardTitle>Change Password</CardTitle>
                        </div>
                        <CardDescription>Keep your account secure by updating your password regularly.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 relative">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input 
                                    id="currentPassword" 
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    required
                                />
                                <Button
                                    type="button" variant="ghost" size="icon"
                                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input 
                                    id="newPassword" 
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    required
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
                                    disabled={isLoading}
                                    required
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
                            <Button type="submit" disabled={isLoading || !currentPassword || !newPassword || !confirmPassword} className="w-full">
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
