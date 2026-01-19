
'use server';

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
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId) {
      throw new Error('Firebase project ID is not set. Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is configured.');
    }
    if (!clientEmail) {
      throw new Error('Firebase client email is not set. Ensure FIREBASE_CLIENT_EMAIL is configured.');
    }
    if (!privateKey) {
      throw new Error('Firebase private key is not set. Ensure FIREBASE_PRIVATE_KEY is configured.');
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
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

        let newColors = [...(productData.colors || [])];
        let newSizes = [...(productData.sizes || [])];

        if (cartItem.color) {
            const colorIndex = newColors.findIndex(c => c.name === cartItem.color);
            if (colorIndex !== -1) {
                if (newColors[colorIndex].stock < cartItem.quantity) {
                    throw new Error(`Not enough stock for color ${cartItem.color} of ${productData.name}.`);
                }
                newColors[colorIndex].stock -= cartItem.quantity;
            }
        }

        if (cartItem.size) {
            const sizeIndex = newSizes.findIndex(s => s.name === cartItem.size);
            if (sizeIndex !== -1) {
                if (newSizes[sizeIndex].stock < cartItem.quantity) {
                    throw new Error(`Not enough stock for size ${cartItem.size} of ${productData.name}.`);
                }
                newSizes[sizeIndex].stock -= cartItem.quantity;
            }
        }
        
        transaction.update(productDoc.ref, {
          stock: FieldValue.increment(-cartItem.quantity),
          sold: FieldValue.increment(cartItem.quantity),
          colors: newColors,
          sizes: newSizes,
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
          color: cartItem.color,
          size: cartItem.size,
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

async function _adjustProductStock(
  db: admin.firestore.Firestore,
  transaction: admin.firestore.Transaction,
  order: Order,
  direction: 'increment' | 'decrement'
) {
  const multiplier = direction === 'increment' ? 1 : -1;

  for (const item of order.items) {
    const productRef = db.collection('products').doc(item.id.toString());
    const productDoc = await transaction.get(productRef);

    if (productDoc.exists) {
      const productData = productDoc.data() as Product;
      
      const stockChange = item.quantity * multiplier;

      let newColors = [...(productData.colors || [])];
      if (item.color) {
        const colorIndex = newColors.findIndex(c => c.name === item.color);
        if (colorIndex !== -1) {
          newColors[colorIndex].stock += stockChange;
        }
      }

      let newSizes = [...(productData.sizes || [])];
      if (item.size) {
        const sizeIndex = newSizes.findIndex(s => s.name === item.size);
        if (sizeIndex !== -1) {
          newSizes[sizeIndex].stock += stockChange;
        }
      }

      transaction.update(productRef, {
        stock: FieldValue.increment(stockChange),
        sold: FieldValue.increment(-stockChange),
        colors: newColors,
        sizes: newSizes,
      });
    }
  }
}

export async function cancelOrderByUser(
  orderId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  const adminApp = getFirebaseAdmin();
  const db = getFirestore(adminApp);

  try {
    const orderRef = db.collection('orders').doc(orderId);
    
    const orderData = await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) throw new Error('Order not found.');
      
      const order = orderDoc.data() as Order;
      if (order.userId !== userId) throw new Error('You are not authorized to cancel this order.');
      if (order.status !== 'processing') throw new Error('Order cannot be cancelled at this stage.');
      
      await _adjustProductStock(db, transaction, order, 'increment');
      transaction.update(orderRef, { status: 'cancelled' });
      return order;
    });

    await createAndSendNotification(userId, {
        icon: 'XCircle',
        title: 'Order Cancelled by You',
        description: `Your order #${orderData.orderNumber} has been successfully cancelled.`,
        href: `/account/orders/${orderId}`
    });

    return { success: true, message: 'Order cancelled.' };

  } catch(error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: Order['status']
): Promise<{ success: boolean; message?: string }> {
  const adminApp = getFirebaseAdmin();
  const db = getFirestore(adminApp);

  try {
    let orderData: Order | null = null;
    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error('Order not found.');
      }

      const currentOrderData = orderDoc.data() as Order;
      orderData = currentOrderData;
      const oldStatus = currentOrderData.status;

      if (oldStatus === newStatus) return;

      const updatePayload: { [key: string]: any } = { status: newStatus };

      if (newStatus === 'delivered' && oldStatus !== 'delivered') {
        updatePayload.deliveredAt = new Date().toISOString();
      }

      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        await _adjustProductStock(db, transaction, currentOrderData, 'increment');
      } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
        await _adjustProductStock(db, transaction, currentOrderData, 'decrement');
      }

      transaction.update(orderRef, updatePayload);
    });

    if (orderData) {
        let notificationData;
        switch (newStatus) {
            case 'processing':
                notificationData = { icon: 'PackageCheck', title: 'Order is being processed', description: `Your order #${orderData.orderNumber} is now being processed.`};
                break;
            case 'shipped':
                notificationData = { icon: 'Truck', title: 'Order Shipped', description: `Your order #${orderData.orderNumber} has been shipped.`};
                break;
            case 'delivered':
                notificationData = { icon: 'CheckCircle', title: 'Order Delivered', description: `Your order #${orderData.orderNumber} has been delivered.`};
                break;
            case 'cancelled':
                notificationData = { icon: 'XCircle', title: 'Order Cancelled', description: `Your order #${orderData.orderNumber} has been cancelled.`};
                break;
            case 'returned':
                 notificationData = { icon: 'PackageCheck', title: 'Order Returned', description: `Your order #${orderData.orderNumber} has been marked as returned.`};
                 break;
            default:
                notificationData = null;
        }
        
        if (notificationData) {
            await createAndSendNotification(orderData.userId, { ...notificationData, href: `/account/orders/${orderData.id}` });
        }
    }

    return { success: true, message: `Order status updated to ${newStatus}` };

  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to update order status.' };
  }
}
