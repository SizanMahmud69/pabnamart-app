
"use server";

import { getProductRecommendations as getProductRecommendationsFlow } from "@/ai/flows/product-recommendations";
import type { ProductRecommendationsInput, ProductRecommendationsOutput } from "@/ai/flows/product-recommendations";
import admin from '@/lib/firebase-admin';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { CartItem, Order, OrderStatus, ShippingAddress, PaymentDetails, Voucher, Product, StatusHistory, Notification, User, ModeratorPermissions } from "@/types";
import { revalidatePath } from "next/cache";
import { put } from '@vercel/blob';

const db = getFirestore();

export async function getProductRecommendations(input: ProductRecommendationsInput): Promise<ProductRecommendationsOutput> {
  try {
    const recommendations = await getProductRecommendationsFlow(input);
    return recommendations;
  } catch (error) {
    console.error("Error in getProductRecommendations server action:", error);
    throw new Error("Failed to fetch product recommendations.");
  }
}

export async function uploadImages(formData: FormData): Promise<{ urls: string[] }> {
    const images = formData.getAll('images') as File[];
    const uploadedUrls: string[] = [];

    for (const image of images) {
        if (image && image.size > 0) {
            const blob = await put(image.name, image, {
                access: 'public',
            });
            uploadedUrls.push(blob.url);
        }
    }

    return { urls: uploadedUrls };
}


export async function createModerator(email: string, password: string, permissions: ModeratorPermissions) {
    try {
        const userRecord = await admin.auth().createUser({
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
    if (!uid) {
      return { success: false, message: 'User ID is missing.' };
    }
    try {
        await admin.auth().deleteUser(uid);
        
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
  if (!userId || !cartItems || cartItems.length === 0) {
    return { success: false, message: 'Invalid order data.' };
  }

  try {
     const orderRef = db.collection('orders').doc();
     const productRefs = cartItems.map(item => db.collection('products').doc(item.id.toString()));

     await db.runTransaction(async (transaction) => {
        const productDocs = await transaction.getAll(...productRefs);
        const productsData: { [id: number]: Product } = {};
        productDocs.forEach(doc => {
            if (doc.exists) {
                productsData[Number(doc.id)] = doc.data() as Product;
            }
        });

        // 1. Update product stock and sold count
        for (const item of cartItems) {
            const productRef = db.collection('products').doc(item.id.toString());
            const productData = productsData[item.id];

            if (!productData) {
                throw new Error(`Product with ID ${item.id} not found.`);
            }

            const newStock = (productData.stock || 0) - item.quantity;
            const newSoldCount = (productData.sold || 0) + item.quantity;

            if (newStock < 0) {
                throw new Error(`Not enough stock for ${item.name}.`);
            }

            transaction.update(productRef, { stock: newStock, sold: newSoldCount });
        }

        // 2. Create the order document
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
          items: cartItems.map(item => {
            const productData = productsData[item.id];
            return {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.images[0],
              returnPolicy: productData?.returnPolicy ?? 0,
            }
          }),
          total: totalAmount,
          status: status,
          date: currentDate,
          statusHistory: initialStatusHistory,
          shippingAddress,
          paymentMethod,
          isReviewed: false,
          ...(usedVoucher && { usedVoucherCode: usedVoucher.code }),
          ...(voucherDiscount && { voucherDiscount: voucherDiscount }),
          ...(paymentDetails && { paymentDetails }),
        };
        transaction.set(orderRef, orderData);

        // 3. Clear user's cart
        const cartRef = db.collection('carts').doc(userId);
        transaction.set(cartRef, { items: [] });
        
        // 4. Handle used voucher
        if (usedVoucher) {
            // Add voucher code to user's used voucher list for both regular and return vouchers
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
    return { success: false, message: error.message || 'Failed to place order.' };
  }
}

export async function createAndSendNotification(userId: string, notificationData: Omit<Notification, 'id' | 'time' | 'read'>) {
    if (!userId) return;

    // 1. Save notification to Firestore
    const notification: Omit<Notification, 'id'> = {
        ...notificationData,
        time: new Date().toISOString(),
        read: false,
    };
    await db.collection(`users/${userId}/notifications`).add(notification);

    // 2. Send Push Notification via FCM
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
        await admin.messaging().sendMulticast(payload);
    } catch (error) {
        console.error('Error sending FCM notification:', error);
        // Here you might want to handle invalid tokens, etc.
    }
}
