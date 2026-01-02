
"use server";

import { getProductRecommendations as getProductRecommendationsFlow } from "@/ai/flows/product-recommendations";
import type { ProductRecommendationsInput, ProductRecommendationsOutput } from "@/ai/flows/product-recommendations";
import getFirebaseAdmin from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import type { Notification, User, ModeratorPermissions } from "@/types";
import { revalidatePath } from "next/cache";


export async function getProductRecommendations(input: ProductRecommendationsInput): Promise<ProductRecommendationsOutput> {
  try {
    const recommendations = await getProductRecommendationsFlow(input);
    return recommendations;
  } catch (error) {
    console.error("Error in getProductRecommendations server action:", error);
    throw new Error("Failed to fetch product recommendations.");
  }
}

export async function createModerator(email: string, password: string, permissions: ModeratorPermissions) {
    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);
    try {
        const userRecord = await adminApp.auth().createUser({
            email,
            password,
            displayName: 'Moderator',
        });

        const moderatorData: Partial<User> = {
            email,
            displayName: 'Moderator',
            role: 'moderator',
            permissions,
            status: 'active',
            joined: new Date().toISOString(),
        };

        await db.collection('users').doc(userRecord.uid).set(moderatorData);
        return { success: true, message: 'Moderator created successfully.' };
    } catch (error: any) {
        console.error("Error creating moderator:", error);
        return { success: false, message: error.message || 'Failed to create moderator.' };
    }
}

export async function updateModeratorPermissions(uid: string, permissions: ModeratorPermissions) {
    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);
    if (!uid) {
        return { success: false, message: 'Moderator ID is missing.' };
    }
    try {
        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.update({ permissions });
        return { success: true, message: 'Permissions updated successfully.' };
    } catch (error: any) {
        console.error("Error updating permissions:", error);
        return { success: false, message: error.message || 'Failed to update permissions.' };
    }
}

export async function deleteModerator(uid: string) {
    return deleteUserAccount(uid);
}


export async function deleteUserAccount(uid: string) {
    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);
    if (!uid) {
      return { success: false, message: 'User ID is missing.' };
    }
    try {
        await adminApp.auth().deleteUser(uid);
        
        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.delete();
        
        return { success: true, message: 'User deleted successfully.' };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, message: error.message || 'Failed to delete user.' };
    }
}

export async function createAndSendNotification(userId: string, notificationData: Omit<Notification, 'id' | 'time' | 'read'>) {
    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);
    if (!userId) return;

    const notification: Omit<Notification, 'id'> = {
        ...notificationData,
        time: new Date().toISOString(),
        read: false,
    };
    await db.collection(`users/${userId}/notifications`).add(notification);

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const user = userDoc.data() as User;
    const fcmTokens = user.fcmTokens || [];

    if (fcmTokens.length === 0) return;

    const payload = {
        tokens: fcmTokens,
        notification: {
            title: notification.title,
            body: notification.description,
        },
        webpush: {
            fcm_options: {
                link: notification.href || '/',
            },
        },
    };

    try {
        await adminApp.messaging().sendMulticast(payload);
    } catch (error) {
        console.error('Error sending FCM notification:', error);
    }
}
