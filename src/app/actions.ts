
"use server";

import { getProductRecommendations as getProductRecommendationsFlow } from "@/ai/flows/product-recommendations";
import type { ProductRecommendationsInput, ProductRecommendationsOutput } from "@/ai/flows/product-recommendations";
import getFirebaseAdmin from '@/lib/firebase-admin';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Order, OrderStatus, ShippingAddress, PaymentDetails, Voucher, Product, StatusHistory, Notification, User, ModeratorPermissions, OrderItem, CartItem } from "@/types";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { auth } from "firebase-admin";
import type { OrderPayload } from "./checkout/page";


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


async function getUserIdFromSession(): Promise<string | null> {
    const idToken = headers().get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
        return null;
    }
    try {
        const decodedToken = await auth().verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error('Error verifying ID token:', error);
        return null;
    }
}


export async function placeOrder(payload: OrderPayload) {
  const adminApp = getFirebaseAdmin();
  const db = getFirestore(adminApp);

  const userId = await getUserIdFromSession();

  if (!userId) {
      return { success: false, message: 'User not authenticated.' };
  }
  
  if (!payload.items || payload.items.length === 0) {
    return { success: false, message: 'Invalid order data. No items in order.' };
  }
  
  try {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
        throw new Error('User not found.');
    }
    const userData = userDoc.data() as User;

    const shippingAddress = (userData.shippingAddresses || []).find(addr => addr.id === payload.shippingAddressId);
    if (!shippingAddress) {
        throw new Error('Shipping address not found.');
    }

    let preSubtotal = 0;
    const productDetailsForTx = [];
    for (const item of payload.items) {
        const productRef = db.collection('products').doc(item.id.toString());
        const productDoc = await productRef.get();
        if (!productDoc.exists) {
            throw new Error(`Product with ID ${item.id} not found.`);
        }
        const productData = productDoc.data() as Product;
        preSubtotal += productData.price * item.quantity;
        productDetailsForTx.push({ ...item, id: Number(item.id), productData });
    }

    let voucherDiscount = 0;
    let usedVoucher: Voucher | null = null;
    const existingUsedVouchers = userData.usedVoucherCodes || [];

    if (payload.voucherCode && !existingUsedVouchers.includes(payload.voucherCode)) {
        const voucherDocSnap = await db.collection('vouchers').doc(payload.voucherCode).get();
        if (voucherDocSnap.exists) {
            const voucherData = voucherDocSnap.data() as Voucher;
            if (!voucherData.minSpend || preSubtotal >= voucherData.minSpend) {
                usedVoucher = voucherData;
                if (voucherData.type === 'fixed') {
                    voucherDiscount = voucherData.discount;
                } else {
                    voucherDiscount = (preSubtotal * voucherData.discount) / 100;
                }
            }
        }
    }

    const subtotalAfterDiscount = Math.max(0, preSubtotal - voucherDiscount);

    const deliverySettingsDocSnap = await db.collection('settings').doc('delivery').get();
    let shippingFee = 0;
    if (deliverySettingsDocSnap.exists()) {
        const settings = deliverySettingsDocSnap.data() as any;
        const isInsidePabna = shippingAddress.city.toLowerCase().trim() === 'pabna';
        const itemCount = payload.items.reduce((acc, item) => acc + item.quantity, 0);

        if (isInsidePabna) {
            shippingFee = itemCount <= 5 ? settings.insidePabnaSmall : settings.insidePabnaLarge;
        } else {
            shippingFee = itemCount <= 5 ? settings.outsidePabnaSmall : settings.outsidePabnaLarge;
        }
    }
    
    const finalTotal = Math.round(subtotalAfterDiscount + shippingFee);

    const orderRef = db.collection('orders').doc();
    let updatedUsedVouchers = [...existingUsedVouchers];
    if (usedVoucher && !updatedUsedVouchers.includes(usedVoucher.code)) {
        updatedUsedVouchers.push(usedVoucher.code);
    }

    await db.runTransaction(async (transaction) => {
        const itemsForOrder: OrderItem[] = [];

        for (const detail of productDetailsForTx) {
            const productRef = db.collection('products').doc(detail.id.toString());
            const productDoc = await transaction.get(productRef); 
            if (!productDoc.exists) throw new Error(`Product ${detail.productData.name} disappeared.`);
            
            const productData = productDoc.data() as Product;
            const newStock = (productData.stock || 0) - detail.quantity;
            if (newStock < 0) {
                throw new Error(`Not enough stock for ${productData.name}.`);
            }
            
            itemsForOrder.push({
                id: detail.productData.id,
                name: detail.productData.name,
                price: detail.price,
                quantity: detail.quantity,
                image: detail.productData.images[0],
                returnPolicy: detail.productData.returnPolicy ?? 0,
            });

            const newSoldCount = (productData.sold || 0) + detail.quantity;
            transaction.update(productRef, { stock: newStock, sold: newSoldCount });
        }
        
        let status: OrderStatus = 'pending';
        if (payload.paymentMethod === 'cod') {
            status = 'processing';
        }

        const currentDate = Timestamp.now().toDate().toISOString();
        const initialStatusHistory: StatusHistory[] = [{ status, date: currentDate }];
        
        const shippingAddressData = {
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            address: shippingAddress.address,
            city: shippingAddress.city,
            area: shippingAddress.area,
            type: shippingAddress.type,
        };

        const orderData: Omit<Order, 'id'> = {
          orderNumber: generateOrderNumber(),
          userId,
          items: itemsForOrder,
          total: finalTotal,
          status: status,
          date: currentDate,
          statusHistory: initialStatusHistory,
          shippingAddress: shippingAddressData,
          paymentMethod: payload.paymentMethod,
          isReviewed: false,
          ...(usedVoucher && {
              usedVoucherCode: usedVoucher.code,
              voucherDiscount: voucherDiscount,
          }),
          ...(payload.paymentDetails && { paymentDetails: payload.paymentDetails })
        };

        transaction.set(orderRef, orderData);

        const cartRef = db.collection('carts').doc(userId);
        transaction.set(cartRef, { items: [], selectedItemIds: [] }, { merge: true });
        
        if (updatedUsedVouchers.length > existingUsedVouchers.length) {
            transaction.update(userDocRef, { usedVoucherCodes: updatedUsedVouchers });
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

    