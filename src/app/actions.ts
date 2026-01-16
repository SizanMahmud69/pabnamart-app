'use server';

import 'dotenv/config';
import { getProductRecommendations as getProductRecommendationsFlow } from '@/ai/flows/product-recommendations';
import type {
  ProductRecommendationsInput,
  ProductRecommendationsOutput,
} from '@/ai/flows/product-recommendations';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type {
  Notification,
  User,
  ModeratorPermissions,
  OrderPayload,
  Product,
  Voucher,
  DeliverySettings,
  OrderItem,
  Order,
  CartItem,
} from '@/types';
import { revalidatePath } from 'next/cache';

let adminApp: admin.app.App;

const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !privateKey
    ) {
      throw new Error(
        'Firebase Admin environment variables are not set. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are configured.'
      );
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    return adminApp;
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    throw error;
  }
};

export async function getProductRecommendations(
  input: ProductRecommendationsInput
): Promise<ProductRecommendationsOutput> {
  try {
    const recommendations = await getProductRecommendationsFlow(input);
    return recommendations;
  } catch (error) {
    console.error('Error in getProductRecommendations server action:', error);
    throw new Error('Failed to fetch product recommendations.');
  }
}

export async function createModerator(
  email: string,
  password: string,
  permissions: ModeratorPermissions
) {
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
    console.error('Error creating moderator:', error);
    return {
      success: false,
      message: error.message || 'Failed to create moderator.',
    };
  }
}

export async function updateModeratorPermissions(
  uid: string,
  permissions: ModeratorPermissions
) {
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
    console.error('Error updating permissions:', error);
    return {
      success: false,
      message: error.message || 'Failed to update permissions.',
    };
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
    console.error('Error deleting user:', error);
    return { success: false, message: error.message || 'Failed to delete user.' };
  }
}

export async function createAndSendNotification(
  userId: string,
  notificationData: Omit<Notification, 'id' | 'time' | 'read'>
) {
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

const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
  return `${year}${month}${day}${randomPart}`;
};

const roundPrice = (price: number): number => {
  const decimalPart = price - Math.floor(price);
  if (decimalPart > 0 && decimalPart <= 0.5) {
    return Math.floor(price);
  }
  return Math.round(price);
};

const getOriginalPrice = (item: CartItem | Product): number => {
    return item.originalPrice ?? item.price;
};

export async function placeOrder(
  payload: OrderPayload
): Promise<{ success: boolean; orderId?: string; message?: string }> {
  const adminApp = getFirebaseAdmin();
  const db = getFirestore(adminApp);

  try {
    const transactionResult = await db.runTransaction(async (transaction) => {
      const productRefs = payload.items.map((item) =>
        db.collection('products').doc(item.id.toString())
      );
      const productDocs = await transaction.getAll(...productRefs);
      const userDocRef = db.collection('users').doc(payload.userId);
      let userDoc = await transaction.get(userDocRef);

      const itemsForOrder: OrderItem[] = [];
      let subtotal = 0; // This is the original price subtotal
      let offerSubtotal = 0; // This is the price after offers/flash sales


      for (let i = 0; i < productDocs.length; i++) {
        const productDoc = productDocs[i];
        const cartItem = payload.items[i];

        if (!productDoc.exists) {
          throw new Error(`Product ${cartItem.name} not found.`);
        }

        const productData = productDoc.data() as Product;

        if (productData.stock < cartItem.quantity) {
          throw new Error(`Not enough stock for ${productData.name}.`);
        }
        
        transaction.update(productDoc.ref, {
          stock: FieldValue.increment(-cartItem.quantity),
          sold: FieldValue.increment(cartItem.quantity),
        });
        
        const originalPrice = getOriginalPrice(cartItem);
        subtotal += originalPrice * cartItem.quantity;
        offerSubtotal += cartItem.price * cartItem.quantity;

        itemsForOrder.push({
          id: productData.id,
          name: productData.name,
          price: cartItem.price,
          originalPrice: originalPrice,
          quantity: cartItem.quantity,
          image: productData.images[0] || '',
          returnPolicy: productData.returnPolicy || 0,
        });
      }

      let voucherDiscount = 0;
      let usedVoucher: Voucher | null = null;
      let newUsageCount = 0;

      if (payload.voucherCode) {
        const voucherDocSnap = await db.collection('vouchers').doc(payload.voucherCode).get();
        if (voucherDocSnap.exists) {
            const voucher = voucherDocSnap.data() as Voucher;
            const userData = userDoc.data() as User;
            const currentUsage = userData.usedVouchers?.[voucher.code] || 0;

            if ((!voucher.usageLimit || currentUsage < voucher.usageLimit) && (!voucher.minSpend || subtotal >= voucher.minSpend)) {
                usedVoucher = voucher;
                newUsageCount = currentUsage + 1;

                if (voucher.discountType !== 'shipping') {
                    if (voucher.type === 'fixed') {
                        voucherDiscount = voucher.discount;
                    } else { // percentage
                        voucherDiscount = (subtotal * voucher.discount) / 100;
                    }
                }
            }
        }
      }
      
      const codFee = payload.paymentMethod === 'cash-on-delivery' ? payload.cashOnDeliveryFee || 0 : 0;
      const total = roundPrice((offerSubtotal - voucherDiscount) + payload.shippingFee + codFee);

      const orderRef = db.collection('orders').doc();
      const newOrder: Omit<Order, 'id'> = {
        userId: payload.userId,
        items: itemsForOrder,
        total,
        shippingAddress: payload.shippingAddress,
        status: payload.paymentMethod === 'cash-on-delivery' ? 'processing' : 'pending',
        date: new Date().toISOString(),
        orderNumber: generateOrderNumber(),
        paymentMethod: payload.paymentMethod,
        transactionId: payload.transactionId || '',
        paymentAccountNumber: payload.paymentAccountNumber || '',
        shippingFee: payload.shippingFee,
        voucherCode: usedVoucher?.code || '',
        voucherDiscount: voucherDiscount,
        cashOnDeliveryFee: codFee,
      };

      transaction.set(orderRef, newOrder);

      if (usedVoucher) {
        transaction.update(userDocRef, {
            [`usedVouchers.${usedVoucher.code}`]: newUsageCount
        });
      }

      return { orderId: orderRef.id, total };
    });

    await createAndSendNotification(payload.userId, {
      icon: 'PackageCheck',
      title: 'Order Placed Successfully!',
      description: `Your order #${generateOrderNumber().slice(0, 6)} for ৳${transactionResult.total} has been placed.`,
      href: `/account/orders/${transactionResult.orderId}`,
    });

    revalidatePath('/admin/orders');
    revalidatePath('/account/orders');
    revalidatePath('/payment');

    return { success: true, orderId: transactionResult.orderId };
  } catch (error: any) {
    console.error('Failed to place order:', error);
    revalidatePath('/payment');
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.',
    };
  }
}
