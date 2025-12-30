
"use server";

import { getProductRecommendations as getProductRecommendationsFlow } from "@/ai/flows/product-recommendations";
import type { ProductRecommendationsInput, ProductRecommendationsOutput } from "@/ai/flows/product-recommendations";
import getFirebaseAdmin from '@/lib/firebase-admin';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { CartItem, Order, OrderStatus, ShippingAddress, PaymentDetails, Voucher, Product, StatusHistory, Notification, User, ModeratorPermissions, OrderItem } from "@/types";
import { revalidatePath } from "next/cache";
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from "crypto";

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

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 random digits
  return `${timestamp}${randomPart}`;
}


export async function placeOrder(
  userId: string,
  cartItems: CartItem[],
  totalAmount: number,
  shippingAddress: Omit<ShippingAddress, 'id' | 'default'>,
  paymentMethod: string,
  paymentDetails?: PaymentDetails,
  usedVoucher?: Voucher | null,
  voucherDiscount?: number | null,
) {
  const adminApp = getFirebaseAdmin();
  const db = getFirestore(adminApp);
  if (!userId || !cartItems || cartItems.length === 0) {
    return { success: false, message: 'Invalid order data.' };
  }

  try {
     const orderRef = db.collection('orders').doc();
     
     await db.runTransaction(async (transaction) => {
        for (const item of cartItems) {
            const productRef = db.collection('products').doc(item.id.toString());
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists) {
                throw new Error(`Product with ID ${item.id} not found.`);
            }
            const productData = productDoc.data() as Product;

            const newStock = (productData.stock || 0) - item.quantity;
            const newSoldCount = (productData.sold || 0) + item.quantity;

            if (newStock < 0) {
                throw new Error(`Not enough stock for ${item.name}.`);
            }
            
            transaction.update(productRef, { stock: newStock, sold: newSoldCount });
        }
        
        let status: OrderStatus = 'pending';
        if (paymentMethod === 'cod') {
            status = 'processing';
        } else if (paymentMethod === 'online') {
            status = 'pending'; 
        }

        const currentDate = Timestamp.now().toDate().toISOString();
        const initialStatusHistory: StatusHistory[] = [{ status, date: currentDate }];

        const orderData: Omit<Order, 'id'> = {
          orderNumber: generateOrderNumber(),
          userId,
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.images[0],
            returnPolicy: item.returnPolicy ?? 0,
          })),
          total: totalAmount,
          status: status,
          date: currentDate,
          statusHistory: initialStatusHistory,
          shippingAddress,
          paymentMethod,
          isReviewed: false,
          ...(usedVoucher && voucherDiscount && {
              usedVoucherCode: usedVoucher.code,
              voucherDiscount: voucherDiscount,
          }),
          ...(paymentDetails && { paymentDetails: paymentDetails })
        };

        transaction.set(orderRef, orderData);

        const cartRef = db.collection('carts').doc(userId);
        const cartDoc = await transaction.get(cartRef);
        if (cartDoc.exists) {
            const currentCartItems: CartItem[] = cartDoc.data()?.items || [];
            const idsToRemove = new Set(cartItems.map(item => item.id));
            const newCartItems = currentCartItems.filter(item => !idsToRemove.has(item.id));
            transaction.update(cartRef, {
                items: newCartItems,
                selectedItemIds: []
            });
        }
        
        if (usedVoucher) {
            const userRef = db.collection('users').doc(userId);
            transaction.update(userRef, {
                usedVoucherCodes: FieldValue.arrayUnion(usedVoucher.code)
            });
        }
     });
    
    revalidatePath('/account/orders');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/verify-payment');

    return { success: true, message: 'Order placed successfully.', orderId: orderRef.id };
  } catch (error: any) {
    console.error("Error placing order:", error);
    return { success: false, message: error.message || 'An unexpected error occurred while placing your order.' };
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
