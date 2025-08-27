
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Notification } from '@/types';
import { useAuth } from './useAuth';
import { useVouchers } from './useVouchers';
import { LogIn, Truck, Gift, Tag } from 'lucide-react';

// This is mock data that would typically come from a database.
const orders = [
  { id: '12345', status: 'pending', date: '2023-10-26' },
  { id: '12346', status: 'shipped', date: '2023-10-25' },
];

const availableVouchers = [
    { code: "NEW100", description: "For your first purchase." },
];

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const { collectedVouchers } = useVouchers();

  useEffect(() => {
    if (user) {
        const generatedNotifications: Notification[] = [];

        // Welcome notification
        generatedNotifications.push({
          id: 'welcome',
          icon: LogIn,
          title: "Welcome to PabnaMart!",
          description: `Hello ${user?.displayName || 'there'}, welcome to your account.`,
          time: "Just now",
          read: true, // Mark as read by default
          href: "/account"
        });
        
        // Order status notifications
        orders.forEach(order => {
            if (order.status === 'shipped') {
                generatedNotifications.push({
                    id: `order-${order.id}`,
                    icon: Truck,
                    title: "Order Shipped",
                    description: `Your order #${order.id} has been shipped.`,
                    time: "1d ago",
                    read: false,
                    href: "/account/orders?status=shipped"
                });
            }
        });

        // Voucher notifications
        if (availableVouchers.length > collectedVouchers.length) {
            generatedNotifications.push({
                id: 'new-vouchers',
                icon: Gift,
                title: "New Vouchers Available",
                description: "Exclusive vouchers just for you! Collect them now for extra savings.",
                time: "2d ago",
                read: false,
                href: "/vouchers"
            });
        }

        // Flash sale notification
        generatedNotifications.push({
            id: 'flash-sale',
            icon: Tag,
            title: "Flash Sale Alert!",
            description: "Don't miss out! Our biggest flash sale is ending soon.",
            time: "1h ago",
            read: false,
            href: "/flash-sale"
        });

        setNotifications(generatedNotifications);
    } else {
        setNotifications([]);
    }
  }, [user, collectedVouchers]);


  const markAsRead = useCallback((id: string) => {
    setNotifications(prevNotifications => 
        prevNotifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
