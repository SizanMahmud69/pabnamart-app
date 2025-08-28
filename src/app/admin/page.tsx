
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, Users, ShoppingCart, Undo2, ArrowRight, Tag, Ticket, ShieldCheck } from "lucide-react";
import Link from "next/link";

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
        title: "Verify Payments",
        description: "Verify pending online payments.",
        icon: ShieldCheck,
        href: "/admin/verify-payment"
    },
    {
        title: "Return Requests",
        description: "Manage and process return requests.",
        icon: Undo2,
        href: "/admin/returns"
    },
    {
        title: "Offer Management",
        description: "Create and manage special offers.",
        icon: Tag,
        href: "/admin/offers"
    },
    {
        title: "Voucher Management",
        description: "Create and distribute vouchers.",
        icon: Ticket,
        href: "/admin/vouchers"
    }
];

const AdminDashboard = () => {
    return (
        <div className="container mx-auto max-w-2xl p-4">
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
