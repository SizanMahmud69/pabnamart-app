
'use server';

import 'dotenv/config';
import {
  getProductRecommendations as getProductRecommendationsFlow,
} from '@/ai/flows/product-recommendations';
import type {
  ProductRecommendationsInput,
  ProductRecommendationsOutput,
} from '@/ai/flows/product-recommendations';
import getFirebaseAdmin from '@/lib/firebase-admin';
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
} from '@/types';
import { revalidatePath } from 'next/cache';

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

export async function placeOrder(
  payload: OrderPayload
): Promise<{ success: boolean; orderId?: string; message?: string }> {
  const adminApp = getFirebaseAdmin();
  const db = getFirestore(adminApp);

  try {
    let finalTotal = 0;
    let finalSubtotal = 0;
    let voucherDiscount = 0;
    let shippingFeeWithDiscount = payload.shippingFee;
    let usedVoucher: Voucher | null = null;

    if (payload.voucherCode) {
      const voucherDocSnap = await db
        .collection('vouchers')
        .doc(payload.voucherCode)
        .get();
      if (voucherDocSnap.exists) {
        const voucher = voucherDocSnap.data() as Voucher;
        const userDoc = await db.collection('users').doc(payload.userId).get();
        const userData = userDoc.data() as User;

        const isUsed = userData.usedVoucherCodes?.includes(voucher.code);

        if (!isUsed) {
          let preSubtotal = 0;
          for (const item of payload.items) {
            preSubtotal += item.price * item.quantity;
          }

          if (!voucher.minSpend || preSubtotal >= voucher.minSpend) {
            usedVoucher = voucher;
            if (voucher.discountType === 'shipping') {
              shippingFeeWithDiscount = 0;
            } else {
              if (voucher.type === 'fixed') {
                voucherDiscount = voucher.discount;
              } else {
                voucherDiscount = (preSubtotal * voucher.discount) / 100;
              }
            }
          }
        }
      }
    }

    const transactionResult = await db.runTransaction(async (transaction) => {
      const productRefs = payload.items.map((item) =>
        db.collection('products').doc(item.id.toString())
      );
      const productDocs = await transaction.getAll(...productRefs);
      const userDocRef = db.collection('users').doc(payload.userId);

      const itemsForOrder: OrderItem[] = [];
      let subtotal = 0;

      for (let i = 0; i < productDocs.length; i++) {
        const productDoc = productDocs[i];
        const item = payload.items[i];

        if (!productDoc.exists) {
          throw new Error(`Product ${item.name} not found.`);
        }

        const productData = productDoc.data() as Product;

        if (productData.stock < item.quantity) {
          throw new Error(`Not enough stock for ${productData.name}.`);
        }

        subtotal += item.price * item.quantity;

        transaction.update(productDoc.ref, {
          stock: FieldValue.increment(-item.quantity),
          sold: FieldValue.increment(item.quantity),
        });

        itemsForOrder.push({
          id: productData.id,
          name: productData.name,
          price: item.price, // Use client-side rounded price for consistency
          quantity: item.quantity,
          image: productData.images[0] || '',
          returnPolicy: productData.returnPolicy || 0,
        });
      }

      const subtotalAfterDiscount = Math.max(0, subtotal - voucherDiscount);
      const total = roundPrice(subtotalAfterDiscount + shippingFeeWithDiscount);

      const orderRef = db.collection('orders').doc();
      const newOrder: Omit<Order, 'id'> = {
        userId: payload.userId,
        items: itemsForOrder,
        total,
        shippingAddress: payload.shippingAddress,
        status: 'pending',
        date: new Date().toISOString(),
        orderNumber: generateOrderNumber(),
        paymentMethod: payload.paymentMethod,
        transactionId: payload.transactionId || '',
        shippingFee: shippingFeeWithDiscount,
        voucherCode: usedVoucher?.code || '',
        voucherDiscount: voucherDiscount,
      };

      transaction.set(orderRef, newOrder);

      if (usedVoucher) {
        transaction.update(userDocRef, {
          usedVoucherCodes: FieldValue.arrayUnion(usedVoucher.code),
        });
      }

      return { orderId: orderRef.id, total, itemsForOrder };
    });

    await createAndSendNotification(payload.userId, {
      icon: 'PackageCheck',
      title: 'Order Placed Successfully!',
      description: `Your order #${transactionResult.orderId.slice(
        0,
        6
      )} for ৳${transactionResult.total} has been placed.`,
      href: `/account/orders/${transactionResult.orderId}`,
    });

    revalidatePath('/admin/orders');
    revalidatePath('/account/orders');

    return { success: true, orderId: transactionResult.orderId };
  } catch (error: any) {
    console.error('Failed to place order:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred.',
    };
  }
}
