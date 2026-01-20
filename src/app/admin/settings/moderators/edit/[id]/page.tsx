"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, ModeratorPermissions } from '@/types';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { updateModeratorPermissions } from '@/app/actions';
import { Separator } from '@/components/ui/separator';

const db = getFirestore(app);

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

export default function EditModeratorPage() {
    const router = useRouter();
    const params = useParams();
    const moderatorId = params.id as string;
    const { toast } = useToast();
    const [moderator, setModerator] = useState<User | null>(null);
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
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!moderatorId) return;

        const fetchModerator = async () => {
            setLoading(true);
            const userDocRef = doc(db, 'users', moderatorId);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists() && docSnap.data().role === 'moderator') {
                const data = { ...docSnap.data(), uid: docSnap.id } as User;
                setModerator(data);
                if (data.permissions) {
                    setPermissions(prev => ({...prev, ...data.permissions}));
                }
            } else {
                toast({ title: "Error", description: "Moderator not found.", variant: "destructive" });
                router.push('/admin/settings/moderators');
            }
            setLoading(false);
        };
        fetchModerator();
    }, [moderatorId, router, toast]);

    const handlePermissionChange = (permission: keyof ModeratorPermissions) => {
        setPermissions(prev => ({ ...prev, [permission]: !prev[permission] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const result = await updateModeratorPermissions(moderatorId, permissions);
        if (result.success) {
            toast({ title: "Success", description: "Moderator permissions updated." });
            router.push('/admin/settings/moderators');
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsSaving(false);
    };

    if (loading) return <LoadingSpinner />;
    if (!moderator) return null;

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
                            <CardTitle>Edit Moderator Permissions</CardTitle>
                            <CardDescription>Editing permissions for {moderator.email}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="font-semibold">General Permissions</Label>
                                <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                                    {permissionOptions.map(option => (
                                        <div key={option.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={option.id}
                                                checked={permissions[option.id]}
                                                onCheckedChange={() => handlePermissionChange(option.id)}
                                                disabled={isSaving}
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
                                                disabled={isSaving}
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
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
