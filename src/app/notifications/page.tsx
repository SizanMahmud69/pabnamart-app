
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Tag, Truck, Gift, LogIn } from 'lucide-react';
import type { LucideIcon } from "lucide-react";
import { withAuth, useAuth } from "@/hooks/useAuth";
import { useVouchers } from "@/hooks/useVouchers";
import { useEffect, useState } from "react";

// This is mock data that would typically come from a database.
const orders = [
  { id: '12345', status: 'pending', date: '2023-10-26' },
  { id: '12346', status: 'shipped', date: '2023-10-25' },
];

const availableVouchers = [
    { code: "NEW100", description: "For your first purchase." },
];

interface Notification {
    icon: LucideIcon;
    title: string;
    description: string;
    time: string;
    read: boolean;
}

function NotificationsPage() {
  const { user } = useAuth();
  const { collectedVouchers } = useVouchers();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const generatedNotifications: Notification[] = [];

    // Welcome notification
    generatedNotifications.push({
      icon: LogIn,
      title: "Welcome to PabnaMart!",
      description: `Hello ${user?.displayName || 'there'}, welcome to your account.`,
      time: "Just now",
      read: false,
    });
    
    // Order status notifications
    orders.forEach(order => {
        if (order.status === 'shipped') {
            generatedNotifications.push({
                icon: Truck,
                title: "Order Shipped",
                description: `Your order #${order.id} has been shipped.`,
                time: "1d ago",
                read: true,
            });
        }
    });

    // Voucher notifications
    if (availableVouchers.length > collectedVouchers.length) {
         generatedNotifications.push({
            icon: Gift,
            title: "New Vouchers Available",
            description: "Exclusive vouchers just for you! Collect them now for extra savings.",
            time: "2d ago",
            read: true,
        });
    }

    // Flash sale notification
    generatedNotifications.push({
        icon: Tag,
        title: "Flash Sale Alert!",
        description: "Don't miss out! Our biggest flash sale is ending soon.",
        time: "1h ago",
        read: false,
    });

    setNotifications(generatedNotifications);

  }, [user, collectedVouchers]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-purple-50/30 min-h-screen">
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl flex items-center gap-2">
                        <Bell className="h-8 w-8 text-primary" />
                        Notifications
                    </CardTitle>
                    <CardDescription>
                        You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {notifications.map((notification, index) => (
                            <div key={index} className={`p-4 rounded-lg flex items-start gap-4 ${!notification.read ? 'bg-primary/10' : 'bg-muted/50'}`}>
                                <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${!notification.read ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                    <notification.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold">{notification.title}</p>
                                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                                </div>
                                {!notification.read && <div className="mt-1 flex-shrink-0 h-3 w-3 rounded-full bg-primary" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
        </div>
    </div>
  );
}

export default withAuth(NotificationsPage);
