
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Notification } from '@/types';
import { useAuth } from './useAuth';
import { LogIn, Truck, Gift, Tag, PackageCheck, CheckCircle, XCircle, DollarSign, type LucideIcon } from 'lucide-react';
import { getFirestore, onSnapshot, collection, query, writeBatch, getDocs, updateDoc, doc, orderBy, deleteDoc, arrayUnion, type Firestore } from 'firebase/firestore';
import app, { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

export const iconMap: { [key: string]: LucideIcon } = {
    LogIn,
    Truck,
    Gift,
    Tag,
    PackageCheck,
    CheckCircle,
    XCircle,
    DollarSign,
};


interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, appUser } = useAuth();

  useEffect(() => {
    if (app) {
      setDb(getFirestore(app));
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!messaging || !user || !appUser || !db) return;
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            if (!vapidKey) {
                console.error("VAPID key is not configured in environment variables.");
                return;
            }
            const currentToken = await getToken(messaging, { vapidKey });
            if (currentToken) {
                const userDocRef = doc(db, 'users', user.uid);
                if (!appUser.fcmTokens?.includes(currentToken)) {
                     await updateDoc(userDocRef, {
                        fcmTokens: arrayUnion(currentToken)
                    });
                }
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
    }
  }, [user, appUser, db]);

  useEffect(() => {
    if (user && appUser) {
        requestNotificationPermission();
    }
  }, [user, appUser, requestNotificationPermission]);

  // Listener for foreground messages
  useEffect(() => {
    if (messaging) {
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received.', payload);
            // You can show an in-app notification here
        });
        return () => unsubscribe();
    }
  }, []);

  // Listener for main notifications collection
  useEffect(() => {
    if (user && db) {
        const userNotificationsRef = collection(db, `users/${user.uid}/notifications`);
        const q = query(userNotificationsRef, orderBy('time', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userNotifications = snapshot.docs.map(doc => {
                const data = doc.data();
                const displayTime = new Date(data.time).toLocaleString();
                return { ...data, id: doc.id, time: displayTime } as Notification
            });
            
            setNotifications(userNotifications);
        });

        return () => unsubscribe();
    } else {
        setNotifications([]);
    }
  }, [user, db]);

  // Listener for pending notifications to move them in real-time
  useEffect(() => {
    if (user && db) {
      const pendingNotificationsRef = collection(db, `users/${user.uid}/pendingNotifications`);
      const unsubscribePending = onSnapshot(pendingNotificationsRef, async (snapshot) => {
        if (!snapshot.empty) {
          const mainNotificationsRef = collection(db, `users/${user.uid}/notifications`);
          const batch = writeBatch(db);

          snapshot.docs.forEach(docSnapshot => {
            const data = docSnapshot.data() as Omit<Notification, 'id'>;
            const newNotificationRef = doc(mainNotificationsRef);
            batch.set(newNotificationRef, data);
            batch.delete(docSnapshot.ref);
          });

          await batch.commit();
        }
      });

      return () => unsubscribePending();
    }
  }, [user, db]);


  const markAsRead = useCallback(async (id: string) => {
    if (!user || !db) return;
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
        const notificationRef = doc(db, `users/${user.uid}/notifications`, id);
        await updateDoc(notificationRef, { read: true });
    }
  }, [user, notifications, db]);

  const markAllAsRead = useCallback(async () => {
    if (!user || !db) return;
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, `users/${user.uid}/notifications`, notification.id);
        batch.update(notificationRef, { read: true });
    });
    await batch.commit();
  }, [user, db, notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
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
