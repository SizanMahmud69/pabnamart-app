
"use client";

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, PlusCircle, MoreHorizontal, Edit, Trash2, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, onSnapshot, query, where } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { User, ModeratorPermissions } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { deleteModerator } from '@/app/actions';

const db = getFirestore(app);

const permissionLabels: Record<keyof ModeratorPermissions, string> = {
    canManageProducts: 'Products',
    canManageUsers: 'Users',
    canManageOrders: 'Orders',
    canVerifyPayments: 'Payments',
    canManageReturns: 'Returns',
    canManageOffers: 'Offers',
    canManageVouchers: 'Vouchers',
    canManageSettings: 'Settings',
};


export default function ModeratorSettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [moderators, setModerators] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [moderatorToDelete, setModeratorToDelete] = useState<User | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    useEffect(() => {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'moderator'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const mods = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
            setModerators(mods);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = () => {
        if (!moderatorToDelete) return;
        startDeleteTransition(async () => {
            const result = await deleteModerator(moderatorToDelete.uid);
            if (result.success) {
                toast({ title: "Success", description: "Moderator deleted." });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
            setModeratorToDelete(null);
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <div className="container mx-auto p-4 max-w-4xl">
                <header className="py-4 flex justify-between items-center">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/admin/settings">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Settings
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href="/admin/settings/moderators/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Moderator
                        </Link>
                    </Button>
                </header>
                <main>
                    <Card>
                        <CardHeader>
                            <CardTitle>Moderator Management</CardTitle>
                            <CardDescription>Manage moderator accounts and their permissions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Permissions</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {moderators.map(mod => (
                                        <TableRow key={mod.uid}>
                                            <TableCell className="font-medium">{mod.email}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(permissionLabels).map(([key, label]) => {
                                                        const hasPermission = mod.permissions?.[key as keyof ModeratorPermissions];
                                                        if (hasPermission) {
                                                            return (
                                                                <span key={key} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                                                    {label}
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => router.push(`/admin/settings/moderators/edit/${mod.uid}`)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Edit Permissions</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive" onSelect={() => setModeratorToDelete(mod)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {moderators.length === 0 && <p className="text-muted-foreground text-center pt-8">No moderators found.</p>}
                        </CardContent>
                    </Card>
                </main>
            </div>
             <AlertDialog open={!!moderatorToDelete} onOpenChange={(open) => !open && setModeratorToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the moderator account for <span className="font-bold">{moderatorToDelete?.email}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
