
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Notification } from '@/types';
import { useAuth } from './useAuth';
import { LogIn, Truck, Gift, Tag, PackageCheck, CheckCircle, XCircle, type LucideIcon } from 'lucide-react';
import { getFirestore, onSnapshot, collection, query, writeBatch, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
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
    const pendingNotificationsRef = collection(db, `users/${userId}/pendingNotifications`);
    const mainNotificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(pendingNotificationsRef);
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return;
    }

    const batch = writeBatch(db);

    querySnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data() as Omit<Notification, 'id'>;
        const newNotificationRef = doc(mainNotificationsRef);
        batch.set(newNotificationRef, data);
        batch.delete(docSnapshot.ref);
    });

    await batch.commit();
  }, []);

  useEffect(() => {
    if (user) {
        const userNotificationsRef = collection(db, `users/${user.uid}/notifications`);
        const q = query(userNotificationsRef, orderBy('time', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userNotifications = snapshot.docs.map(doc => {
                const data = doc.data();
                // Format time for display, but keep original for sorting
                const displayTime = new Date(data.time).toLocaleString();
                return { ...data, id: doc.id, time: displayTime } as Notification
            });
            
            setNotifications(userNotifications);
        });
        
        // Check for pending notifications on initial load and move them
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
