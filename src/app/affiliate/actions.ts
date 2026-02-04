
"use server";

import admin from 'firebase-admin';
import type { Withdrawal, AffiliateEarning, User, AffiliateSettings, Order } from '@/types';
import { createAndSendNotification } from '@/app/actions';

const getFirebaseAdmin = (): admin.App | null => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      console.error('Firebase Admin not initialized.');
      return null;
    }
    const serviceAccount = JSON.parse(serviceAccountJson.replace(/\\n/g, '\n'));
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    return null;
  }
};

/**
 * Processes eligible affiliate earnings and creates withdrawal requests.
 * @param force If true, bypasses the date check (used for manual triggers from admin).
 */
export async function processWithdrawals(force: boolean = false) {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) {
    console.error("Skipping withdrawal processing: Firebase Admin not available.");
    return { success: false, message: "Firebase Admin not available." };
  }
  const db = admin.firestore();

  try {
    const settingsRef = db.collection('settings').doc('affiliate');
    const settingsSnap = await settingsRef.get();
    const settings: AffiliateSettings = settingsSnap.exists() 
        ? settingsSnap.data() as AffiliateSettings 
        : { withdrawalDay1: 16, withdrawalDay2: 1, minimumWithdrawal: 100 };
    
    const { withdrawalDay1, withdrawalDay2, minimumWithdrawal } = settings;

    const today = new Date();
    const currentDay = today.getDate();

    // Check if today is a scheduled withdrawal day
    const isDay1 = withdrawalDay1 > 0 && currentDay === withdrawalDay1;
    const isDay2 = withdrawalDay2 > 0 && currentDay === withdrawalDay2;

    if (!force && !isDay1 && !isDay2) {
      console.log(`Today (${currentDay}) is not a scheduled withdrawal day.`);
      return { success: true, message: "Not a withdrawal day. Skipped." };
    }

    // Fetch all users who are affiliates
    const usersSnap = await db.collection('users').where('isAffiliate', '==', true).get();
    let totalProcessed = 0;
    
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data() as User;
      const userUid = userDoc.id;

      // Skip users without payout info
      if (!user.payoutInfo || !user.payoutInfo.accountNumber) continue;
      
      // Fetch all earnings with status 'paid' (earned but not yet withdrawn)
      const earningsSnap = await db.collection('affiliateEarnings')
        .where('affiliateUid', '==', userUid)
        .where('status', '==', 'paid')
        .get();

      if (earningsSnap.empty) continue;

      let totalAmount = 0;
      const earningsToUpdate: admin.firestore.DocumentReference[] = [];

      // Collect all order IDs to batch check their status
      const orderIds = [...new Set(earningsSnap.docs.map(doc => doc.data().orderId))];
      const orders: Record<string, Order> = {};
      
      if (orderIds.length > 0) {
          // Firestore 'in' queries are limited to 10-30 items depending on SDK
          const chunks = [];
          for (let i = 0; i < orderIds.length; i += 10) {
              chunks.push(orderIds.slice(i, i + 10));
          }
          for (const chunk of chunks) {
              const ordersSnap = await db.collection('orders').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
              ordersSnap.forEach(oDoc => {
                  orders[oDoc.id] = { id: oDoc.id, ...oDoc.data() } as Order;
              });
          }
      }

      // Check eligibility for each earning
      for (const eDoc of earningsSnap.docs) {
        const earning = eDoc.data() as AffiliateEarning;
        const order = orders[earning.orderId];
        
        if (order && order.status === 'delivered' && order.deliveredAt) {
            // Find the maximum return policy days from items
            const maxReturnDays = Math.max(0, ...order.items.map(item => item.returnPolicy || 0));
            const deliveryDate = new Date(order.deliveredAt);
            const returnDeadline = new Date(deliveryDate);
            returnDeadline.setDate(deliveryDate.getDate() + maxReturnDays);

            // If the current time is past the return window, it's eligible
            if (new Date() > returnDeadline) {
                totalAmount += earning.commissionAmount;
                earningsToUpdate.push(eDoc.ref);
            }
        }
      }

      // Create withdrawal request if threshold is met
      if (totalAmount > 0 && totalAmount >= (minimumWithdrawal || 100)) {
        const withdrawalRef = db.collection('withdrawals').doc();
        const newWithdrawal: Withdrawal = {
          id: withdrawalRef.id,
          affiliateUid: userUid,
          amount: totalAmount,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          payoutInfo: user.payoutInfo,
        };

        const batch = db.batch();
        batch.set(withdrawalRef, newWithdrawal);
        earningsToUpdate.forEach(ref => {
          batch.update(ref, { status: 'withdrawn', withdrawalId: withdrawalRef.id });
        });
        await batch.commit();

        await createAndSendNotification(userUid, {
            icon: 'DollarSign',
            title: 'Withdrawal Processed',
            description: `Your earnings of ৳${totalAmount.toFixed(2)} have been processed for withdrawal.`,
            href: '/affiliate/wallet',
        });
        totalProcessed++;
      }
    }
    
    return { success: true, message: `Finished. Processed ${totalProcessed} withdrawal requests.` };
  } catch (error: any) {
    console.error("Error processing withdrawals:", error);
    return { success: false, message: error.message || "Failed to process withdrawals." };
  }
}
