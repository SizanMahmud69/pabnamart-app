
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
        <div 
            className={cn(
                "p-4 rounded-lg flex items-start gap-4 transition-colors",
                !notification.read ? 'bg-primary/5' : 'bg-transparent',
                notification.href && 'hover:bg-primary/10 cursor-pointer'
            )} 
            onClick={onClick}
        >
            <div className={cn(
                'mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
                !notification.read ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
                <notification.icon className="h-5 w-5" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold">{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
            </div>
            {!notification.read && (
                <div className="mt-1.5 flex-shrink-0">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
            )}
        </div>
    );

    if (notification.href) {
        return <Link href={notification.href} className="block">{content}</Link>;
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
                <CardContent className="p-0">
                    <div className="divide-y">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <NotificationItem 
                                    key={notification.id} 
                                    notification={notification} 
                                    onClick={() => markAsRead(notification.id)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-16">
                                <Bell className="mx-auto h-16 w-16 text-muted-foreground" />
                                <h2 className="mt-4 text-xl font-semibold">No Notifications</h2>
                                <p className="text-muted-foreground">You're all caught up!</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        </div>
    </div>
  );
}

export default withAuth(NotificationsPage);
