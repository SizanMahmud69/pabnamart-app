"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Package, Users, ShoppingCart, Undo2, ArrowRight } from "lucide-react";
import Link from "next/link";
import LoadingSpinner from '@/components/LoadingSpinner';

const menuItems = [
    {
        title: "Product Management",
        description: "Add, edit, and remove products.",
        icon: Package,
        href: "/admin/products"
    },
    {
        title: "User Management",
        description: "View and manage user accounts.",
        icon: Users,
        href: "/admin/users"
    },
    {
        title: "Order Management",
        description: "Track and process customer orders.",
        icon: ShoppingCart,
        href: "/admin/orders"
    },
    {
        title: "Return Requests",
        description: "Manage and process return requests.",
        icon: Undo2,
        href: "/admin/returns"
    }
];

const AdminDashboard = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            router.replace('/admin/login');
        } else {
            setIsLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        router.push('/admin/login');
    };
    
    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="flex items-center justify-between py-4">
                <h1 className="text-2xl font-bold text-primary">PabnaMart</h1>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
            </header>

            <main className="mt-6">
                <h2 className="text-3xl font-bold mb-6">Welcome, Admin!</h2>
                <div className="space-y-4">
                    {menuItems.map((item, index) => (
                        <Link href={item.href} key={index} className="block">
                            <Card className="hover:border-primary hover:shadow-lg transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-lg">
                                            <item.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
