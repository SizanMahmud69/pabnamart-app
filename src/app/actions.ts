
'use server';

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
  AffiliateEarning,
  AffiliateRequest,
  CoinTransaction,
  CoinSettings
} from '@/types';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';

const serverActionNotAvailableMessage = 'This server action is disabled in the local development or preview environment because it requires Firebase Admin credentials. It is only available on the live, deployed website.';

const defaultCoinSettings: CoinSettings = {
    checkInPoints: 1,
    reviewPoints: 20,
    pointsPer100Taka: 10,
    takaPer100Coins: 10,
    maxCoinsPerOrder: 100,
};

const getFirebaseAdmin = (): admin.App | null => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        return null;
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    return null;
  }
};

async function getCoinSettings(db: admin.firestore.Firestore): Promise<CoinSettings> {
    try {
        const doc = await db.collection('settings').doc('coin').get();
        if (doc.exists) return { ...defaultCoinSettings, ...doc.data() } as CoinSettings;
        return defaultCoinSettings;
    } catch (e) {
        return defaultCoinSettings;
    }
}

/**
 * Sends a real verification email using SMTP
 */
export async function sendVerificationEmail(userId: string, email: string) {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) return { success: false, message: serverActionNotAvailableMessage };
    const db = getFirestore(adminApp);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60000).toISOString();

    try {
        await db.collection('verificationCodes').doc(userId).set({
            code,
            expiry,
            email
        });

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
            secure: parseInt(process.env.EMAIL_SERVER_PORT || '465') === 465,
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"PabnaMart" <noreply@pabnamart.com>',
            to: email,
            subject: 'Verify Your Email - PabnaMart',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #8b5cf6;">Welcome to PabnaMart!</h2>
                    <p>Use the following code to verify your account. This code will expire in 10 minutes.</p>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${code}</span>
                    </div>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #6b7280;">This is an automated message, please do not reply.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return { success: true, message: 'Verification code sent to your email.' };

    } catch (error: any) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Failed to send email. Check your SMTP settings.' };
    }
}

export async function verifyEmailCode(userId: string, code: string) {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) return { success: false, message: serverActionNotAvailableMessage };
    const db = getFirestore(adminApp);

    try {
        const codeDoc = await db.collection('verificationCodes').doc(userId).get();
        if (!codeDoc.exists) return { success: false, message: 'No verification code found.' };

        const data = codeDoc.data();
        if (data?.code !== code) return { success: false, message: 'Incorrect verification code.' };

        const expiry = new Date(data.expiry);
        if (new Date() > expiry) return { success: false, message: 'Code has expired.' };

        await db.collection('users').doc(userId).update({ emailVerified: true });
        await db.collection('verificationCodes').doc(userId).delete();

        return { success: true, message: 'Email verified successfully!' };

    } catch (error: any) {
        return { success: false, message: error.message || 'Verification failed.' };
    }
}

export async function awardReviewCoins(userId: string, productName: string) {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) return;
    const db = getFirestore(adminApp);
    const settings = await getCoinSettings(db);

    const coinAmount = settings.reviewPoints;
    const transaction: CoinTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        amount: coinAmount,
        type: 'earn',
        reason: `Review for ${productName}`,
        date: new Date().toISOString()
    };

    await db.collection('users').doc(userId).update({
        coins: FieldValue.increment(coinAmount)
    });
    await db.collection(`users/${userId}/coinHistory`).add(transaction);
}

export async function awardSpinCoins(userId: string, amount: number) {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) return;
    const db = getFirestore(adminApp);

    const transaction: CoinTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        amount: amount,
        type: 'earn',
        reason: 'Won from Lucky Spin',
        date: new Date().toISOString()
    };

    await db.collection('users').doc(userId).update({
        coins: FieldValue.increment(amount)
    });
    await db.collection(`users/${userId}/coinHistory`).add(transaction);
}

export async function dailyCheckInAction(userId: string) {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) return { success: false, message: serverActionNotAvailableMessage };
    const db = getFirestore(adminApp);
    const settings = await getCoinSettings(db);

    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return { success: false, message: 'User not found' };

        const data = userDoc.data();
        const lastCheckIn = data?.lastCheckIn;
        const today = new Date().toISOString().split('T')[0];

        if (lastCheckIn === today) {
            return { success: false, message: 'Already checked in today!' };
        }

        const coinAmount = settings.checkInPoints;
        const transaction: CoinTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            amount: coinAmount,
            type: 'earn',
            reason: 'Daily Check-in',
            date: new Date().toISOString()
        };

        await userRef.update({
            coins: FieldValue.increment(coinAmount),
            lastCheckIn: today
        });
        await db.collection(`users/${userId}/coinHistory`).add(transaction);

        return { success: true, message: `Successfully checked in! +${coinAmount} Coin` };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to check in.' };
    }
}

export async function placeOrder(
  payload: OrderPayload
): Promise<{ success: boolean; orderId?: string; message?: string }> {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) {
    return { success: false, message: "Server not configured." };
  }
  const db = getFirestore(adminApp);
  const settings = await getCoinSettings(db);

  try {
    const transactionResult = await db.runTransaction(async (transaction) => {
      const productRefs = payload.items.map((item) =>
        db.collection('products').doc(item.id.toString())
      );
      const productDocs = await transaction.getAll(...productRefs);
      const userDocRef = db.collection('users').doc(payload.userId);
      let userDoc = await transaction.get(userDocRef);
      const userData = userDoc.data() as User;

      const itemsForOrder: OrderItem[] = [];
      let subtotal = 0; 
      let offerSubtotal = 0; 

      for (let i = 0; i < productDocs.length; i++) {
        const productDoc = productDocs[i];
        const cartItem = payload.items[i];
        if (!productDoc.exists) throw new Error(`Product ${cartItem.name} not found.`);
        const productData = productDoc.data() as Product;
        if (productData.stock < cartItem.quantity) throw new Error(`Not enough stock for ${productData.name}.`);

        let newColors = [...(productData.colors || [])];
        let newSizes = [...(productData.sizes || [])];

        if (cartItem.color) {
            const idx = newColors.findIndex(c => c.name === cartItem.color);
            if (idx !== -1) newColors[idx].stock -= cartItem.quantity;
        }
        if (cartItem.size) {
            const idx = newSizes.findIndex(s => s.name === cartItem.size);
            if (idx !== -1) newSizes[idx].stock -= cartItem.quantity;
        }
        
        transaction.update(productDoc.ref, {
          stock: FieldValue.increment(-cartItem.quantity),
          sold: FieldValue.increment(cartItem.quantity),
          colors: newColors,
          sizes: newSizes,
        });
        
        const origPrice = cartItem.originalPrice ?? cartItem.price;
        subtotal += origPrice * cartItem.quantity;
        offerSubtotal += cartItem.price * cartItem.quantity;

        itemsForOrder.push({
          id: productData.id,
          name: productData.name,
          price: cartItem.price,
          originalPrice: origPrice,
          quantity: cartItem.quantity,
          image: productData.images[0] || '',
          returnPolicy: productData.returnPolicy || 0,
          color: cartItem.color,
          size: cartItem.size,
          isB1G1: cartItem.isB1G1,
        });
      }

      let voucherDiscount = 0;
      let usedVoucherCode = '';

      if (payload.voucherCode) {
        const vSnap = await db.collection('vouchers').doc(payload.voucherCode).get();
        if (vSnap.exists) {
            const v = vSnap.data() as Voucher;
            const usage = userData?.usedVouchers?.[v.code] || 0;
            if ((!v.usageLimit || usage < v.usageLimit) && (!v.minSpend || subtotal >= v.minSpend)) {
                usedVoucherCode = v.code;
                if (v.discountType !== 'shipping') {
                    voucherDiscount = v.type === 'fixed' ? v.discount : (subtotal * v.discount) / 100;
                }
            }
        }
      }
      
      let coinDiscount = 0;
      if (payload.useCoins) {
          const userCoins = userData?.coins || 0;
          const maxSpendableCoins = settings.maxCoinsPerOrder;
          const coinsToUse = Math.min(userCoins, maxSpendableCoins);
          if (coinsToUse > 0) {
              coinDiscount = (coinsToUse / 100) * settings.takaPer100Coins;
              transaction.update(userDocRef, {
                  coins: FieldValue.increment(-coinsToUse)
              });
              await db.collection(`users/${payload.userId}/coinHistory`).add({
                  id: Math.random().toString(36).substr(2, 9),
                  amount: coinsToUse,
                  type: 'spend',
                  reason: 'Discount on order',
                  date: new Date().toISOString()
              });
          }
      }

      let spinDiscount = 0;
      let spinPercentageUsed = 0;
      if (payload.useSpinDiscount && userData.activeSpinDiscount && userData.spinDiscountExpiry) {
          const now = new Date();
          const expiry = new Date(userData.spinDiscountExpiry);
          if (now < expiry) {
              spinPercentageUsed = userData.activeSpinDiscount;
              const baseForSpin = offerSubtotal - voucherDiscount - coinDiscount;
              spinDiscount = (baseForSpin * spinPercentageUsed) / 100;
              // Clear the discount after use
              transaction.update(userDocRef, { 
                  activeSpinDiscount: FieldValue.delete(),
                  spinDiscountExpiry: FieldValue.delete()
              });
          }
      }

      const codFee = payload.paymentMethod === 'cash-on-delivery' ? payload.cashOnDeliveryFee || 0 : 0;
      const total = Math.round((offerSubtotal - voucherDiscount - coinDiscount - spinDiscount) + payload.shippingFee + codFee);

      const orderRef = db.collection('orders').doc();
      const orderNumber = nowToOrderNumber();
      
      transaction.set(orderRef, {
        userId: payload.userId,
        items: itemsForOrder,
        total,
        shippingAddress: payload.shippingAddress,
        status: payload.paymentMethod === 'cash-on-delivery' ? 'processing' : 'pending',
        date: new Date().toISOString(),
        orderNumber,
        paymentMethod: payload.paymentMethod,
        transactionId: payload.transactionId || '',
        paymentAccountNumber: payload.paymentAccountNumber || '',
        shippingFee: payload.shippingFee,
        voucherCode: usedVoucherCode,
        voucherDiscount,
        coinDiscount,
        spinDiscount,
        spinDiscountPercentage: spinPercentageUsed,
        cashOnDeliveryFee: codFee,
      });

      if (usedVoucherCode) {
        transaction.update(userDocRef, { [`usedVouchers.${usedVoucherCode}`]: FieldValue.increment(1) });
      }

      const coinsEarned = Math.floor((offerSubtotal / 100) * settings.pointsPer100Taka);
      if (coinsEarned > 0) {
          transaction.update(userDocRef, { coins: FieldValue.increment(coinsEarned) });
          await db.collection(`users/${payload.userId}/coinHistory`).add({
            id: Math.random().toString(36).substr(2, 9),
            amount: coinsEarned,
            type: 'earn',
            reason: `Earned from Order #${orderNumber}`,
            date: new Date().toISOString()
          });
      }

      return { orderId: orderRef.id };
    });

    return { success: true, orderId: transactionResult.orderId };
  } catch (error: any) {
    console.error('Order error:', error);
    return { success: false, message: error.message };
  }
}

function nowToOrderNumber() {
    const now = new Date();
    return `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${Math.floor(10000 + Math.random() * 90000)}`;
}

export async function createModerator(
  email: string,
  password: string,
  permissions: ModeratorPermissions
) {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) {
    return { success: false, message: serverActionNotAvailableMessage };
  }
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
  if (!adminApp) {
    return { success: false, message: serverActionNotAvailableMessage };
  }
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
  if (!adminApp) {
    return { success: false, message: serverActionNotAvailableMessage };
  }
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
  if (!adminApp) return;
  const db = getFirestore(adminApp);

  const notification = {
    ...notificationData,
    time: new Date().toISOString(),
    read: false,
  };
  await db.collection(`users/${userId}/notifications`).add(notification);

  const userDoc = await db.collection('users').doc(userId).get();
  const fcmTokens = userDoc.data()?.fcmTokens || [];
  if (fcmTokens.length > 0) {
    try {
      await adminApp.messaging().sendMulticast({
        tokens: fcmTokens,
        notification: { title: notification.title, body: notification.description },
        webpush: { fcm_options: { link: notification.href || '/' } },
      });
    } catch (e) {}
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: Order['status']
): Promise<{ success: boolean; message?: string }> {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) {
    return { success: false, message: serverActionNotAvailableMessage };
  }
  const db = getFirestore(adminApp);

  try {
    let orderData: Order | null = null;
    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) throw new Error('Order not found.');
      const currentOrderData = orderDoc.data() as Order;
      orderData = currentOrderData;
      if (currentOrderData.status === newStatus) return;

      const updatePayload: any = { status: newStatus };
      if (newStatus === 'delivered' && currentOrderData.status !== 'delivered') {
        updatePayload.deliveredAt = new Date().toISOString();
      }

      transaction.update(orderRef, updatePayload);
    });

    if (orderData) {
        await createAndSendNotification(orderData.userId, {
            icon: 'Truck',
            title: `Order ${newStatus.toUpperCase()}`,
            description: `Your order #${orderData.orderNumber} is now ${newStatus}.`,
            href: `/account/orders/${orderId}`
        });
    }

    return { success: true, message: `Order status updated to ${newStatus}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function cancelOrderByUser(
  orderId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) return { success: false, message: serverActionNotAvailableMessage };
  const db = getFirestore(adminApp);

  try {
    const orderRef = db.collection(orderId).doc(orderId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(orderRef);
      if (!doc.exists) throw new Error('Order not found.');
      const order = doc.data() as Order;
      if (order.userId !== userId) throw new Error('Unauthorized');
      if (order.status !== 'pending' && order.status !== 'processing') throw new Error('Cannot cancel now.');
      transaction.update(orderRef, { status: 'cancelled' });
    });
    return { success: true, message: 'Order cancelled.' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function submitAffiliateRequest(
    userId: string,
    displayName: string,
    email: string,
    nidNumber: string,
    nidFrontImageUrl: string,
    nidBackImageUrl: string
): Promise<{ success: boolean; message: string }> {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) return { success: false, message: serverActionNotAvailableMessage };
    const db = getFirestore(adminApp);

    try {
        const requestRef = db.collection('affiliateRequests').doc();
        await requestRef.set({
            userId, displayName, email, nidNumber, nidFrontImageUrl, nidBackImageUrl,
            status: 'pending', requestedAt: new Date().toISOString(),
        });
        await db.collection('users').doc(userId).update({ affiliateStatus: 'pending' });
        return { success: true, message: 'Request submitted.' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function approveAffiliateRequest(requestId: string) {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) return { success: false };
  const db = getFirestore(adminApp);
  const snap = await db.collection('affiliateRequests').doc(requestId).get();
  if (!snap.exists) return { success: false };
  const data = snap.data();
  await db.collection('users').doc(data?.userId).update({
    isAffiliate: true,
    affiliateStatus: 'approved',
    affiliateId: `AFF-${data?.userId.substring(0, 5).toUpperCase()}`
  });
  await db.collection('affiliateRequests').doc(requestId).update({ status: 'approved' });
  return { success: true };
}

export async function denyAffiliateRequest(requestId: string, reason: string) {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) return { success: false };
  const db = getFirestore(adminApp);
  const snap = await db.collection('affiliateRequests').doc(requestId).get();
  if (!snap.exists) return { success: false };
  const data = snap.data();
  await db.collection('users').doc(data?.userId).update({ affiliateStatus: 'denied' });
  await db.collection('affiliateRequests').doc(requestId).update({ status: 'denied', rejectionReason: reason });
  return { success: true };
}
