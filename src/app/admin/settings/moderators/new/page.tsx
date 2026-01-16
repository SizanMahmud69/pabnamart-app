
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createModerator } from '@/app/actions';
import type { ModeratorPermissions } from '@/types';
import { Separator } from '@/components/ui/separator';

const permissionOptions: { id: keyof ModeratorPermissions, label: string }[] = [
    { id: 'canManageProducts', label: 'Manage Products' },
    { id: 'canManageUsers', label: 'Manage Users' },
    { id: 'canManageOrders', label: 'Manage Orders' },
    { id: 'canVerifyPayments', label: 'Verify Payments' },
    { id: 'canManageReturns', label: 'Manage Returns' },
    { id: 'canManageOffers', label: 'Manage Offers' },
    { id: 'canManageVouchers', label: 'Manage Vouchers' },
    { id: 'canManageReviews', label: 'Manage Reviews' },
];

const settingsPermissionOptions: { id: keyof ModeratorPermissions, label: string }[] = [
    { id: 'canManageDeliverySettings', label: 'Delivery Settings' },
    { id: 'canManagePaymentSettings', label: 'Payment Settings' },
    { id: 'canManageCategorySettings', label: 'Category Settings' },
    { id: 'canManageModeratorSettings', label: 'Moderator Settings' },
    { id: 'canManageContactSettings', label: 'Contact Settings' },
];

export default function NewModeratorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [permissions, setPermissions] = useState<ModeratorPermissions>({
        canManageProducts: false,
        canManageUsers: false,
        canManageOrders: false,
        canVerifyPayments: false,
        canManageReturns: false,
        canManageOffers: false,
        canManageVouchers: false,
        canManageDeliverySettings: false,
        canManagePaymentSettings: false,
        canManageCategorySettings: false,
        canManageModeratorSettings: false,
        canManageReviews: false,
        canManageContactSettings: false,
    });
    const [isCreating, setIsCreating] = useState(false);

    const handlePermissionChange = (permission: keyof ModeratorPermissions) => {
        setPermissions(prev => ({ ...prev, [permission]: !prev[permission] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        const result = await createModerator(email, password, permissions);
        if (result.success) {
            toast({ title: "Success", description: "New moderator has been created." });
            router.push('/admin/settings/moderators');
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsCreating(false);
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/settings/moderators">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Moderators
                    </Link>
                </Button>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Moderator</CardTitle>
                            <CardDescription>Create a new moderator account and set their permissions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Moderator Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="moderator@example.com"
                                    required
                                    disabled={isCreating}
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={isCreating}
                                />
                                <Button
                                    type="button" variant="ghost" size="icon"
                                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">General Permissions</Label>
                                <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                                    {permissionOptions.map(option => (
                                        <div key={option.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={option.id}
                                                checked={permissions[option.id]}
                                                onCheckedChange={() => handlePermissionChange(option.id)}
                                                disabled={isCreating}
                                            />
                                            <Label htmlFor={option.id} className="font-normal cursor-pointer">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                             <div className="space-y-2">
                                <Label className="font-semibold">Settings Permissions</Label>
                                <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                                    {settingsPermissionOptions.map(option => (
                                        <div key={option.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={option.id}
                                                checked={permissions[option.id]}
                                                onCheckedChange={() => handlePermissionChange(option.id)}
                                                disabled={isCreating}
                                            />
                                            <Label htmlFor={option.id} className="font-normal cursor-pointer">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Moderator
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
