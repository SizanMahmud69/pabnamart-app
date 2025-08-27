
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from 'lucide-react';
import { withAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NotificationItem = ({ notification, onClick }: { notification: Notification, onClick: () => void }) => {
    const content = (
        <div className={cn(
            "p-4 rounded-lg flex items-start gap-4 transition-colors",
            !notification.read ? 'bg-primary/10' : 'bg-muted/50',
            notification.href && 'hover:bg-primary/20'
        )} onClick={onClick}>
            <div className={cn(
                'mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
                !notification.read ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
            )}>
                <notification.icon className="h-5 w-5" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold">{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
            </div>
            {!notification.read && <div className="mt-1 flex-shrink-0 h-3 w-3 rounded-full bg-primary" />}
        </div>
    );

    if (notification.href) {
        return <Link href={notification.href}>{content}</Link>;
    }

    return content;
};


function NotificationsPage() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

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
                    <div className="space-y-2">
                        {notifications.map((notification) => (
                            <NotificationItem 
                                key={notification.id} 
                                notification={notification} 
                                onClick={() => markAsRead(notification.id)}
                            />
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
