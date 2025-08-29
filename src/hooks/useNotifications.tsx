
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Notification } from '@/types';
import { useAuth } from './useAuth';
import { LogIn, Truck, Gift, Tag, PackageCheck, CheckCircle, XCircle, type LucideIcon } from 'lucide-react';
import { getFirestore, doc, onSnapshot, collection, query, writeBatch, getDocs, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';

const db = getFirestore(app);

export const iconMap: { [key: string]: LucideIcon } = {
    LogIn,
    Truck,
    Gift,
    Tag,
    PackageCheck,
    CheckCircle,
    XCircle,
};


interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const fetchAndClearPendingNotifications = useCallback(async (userId: string) => {
    const notificationsRef = collection(db, `users/${userId}/pendingNotifications`);
    const q = query(notificationsRef);
    const querySnapshot = await getDocs(q);
    
    const pending: Notification[] = [];
    const batch = writeBatch(db);

    querySnapshot.forEach(doc => {
        const data = doc.data() as Omit<Notification, 'id'>;
        pending.push({ ...data, id: doc.id, time: new Date(data.time).toLocaleDateString() });
        batch.delete(doc.ref); // Delete after fetching
    });

    if (!querySnapshot.empty) {
        await batch.commit();
        setNotifications(prev => [...pending.reverse(), ...prev]);
    }
  }, []);

  useEffect(() => {
    if (user) {
        const userNotificationsRef = collection(db, `users/${user.uid}/notifications`);
        const unsubscribe = onSnapshot(userNotificationsRef, (snapshot) => {
            const userNotifications = snapshot.docs.map(doc => {
                const data = doc.data();
                return { ...data, id: doc.id, time: new Date(data.time).toLocaleDateString() } as Notification
            }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            
            setNotifications(userNotifications);
        });
        
        // Check for pending notifications on initial load
        fetchAndClearPendingNotifications(user.uid);

        return () => unsubscribe();
    } else {
        setNotifications([]);
    }
  }, [user, fetchAndClearPendingNotifications]);


  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
        const notificationRef = doc(db, `users/${user.uid}/notifications`, id);
        await updateDoc(notificationRef, { read: true });
    }
  }, [user, notifications]);

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
