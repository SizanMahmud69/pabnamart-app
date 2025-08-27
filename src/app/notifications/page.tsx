
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Tag, Truck } from 'lucide-react';

const notifications = [
    {
        icon: Tag,
        title: "Flash Sale Alert!",
        description: "Don't miss out! Our biggest flash sale of the season is ending in 3 hours.",
        time: "1h ago",
        read: false,
    },
    {
        icon: Truck,
        title: "Order Shipped",
        description: "Your order #12345 has been shipped and is on its way to you.",
        time: "1d ago",
        read: true,
    },
    {
        icon: Tag,
        title: "New Vouchers Available",
        description: "Exclusive vouchers just for you! Collect them now for extra savings.",
        time: "2d ago",
        read: true,
    },
];

export default function NotificationsPage() {
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
                        You have {notifications.filter(n => !n.read).length} unread messages.
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
