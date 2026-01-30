
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
    return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    return null;
  }
};

export async function processWithdrawals() {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) {
    console.error("Skipping withdrawal processing: Firebase Admin not available.");
    return;
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

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (withdrawalDay1 > 0 && currentDay === withdrawalDay1) {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 16); 
    } else if (withdrawalDay2 > 0 && currentDay === withdrawalDay2) {
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 16);
      endDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      console.log("Not a withdrawal day or schedule is disabled. Skipping.");
      return;
    }

    const usersSnap = await db.collection('users').where('isAffiliate', '==', true).get();
    
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data() as User;
      if (!user.payoutInfo || !user.payoutInfo.accountNumber) {
        continue;
      }
      
      const earningsSnap = await db.collection('affiliateEarnings')
        .where('affiliateUid', '==', user.uid)
        .where('status', '==', 'paid')
        .where('createdAt', '>=', startDate.toISOString())
        .where('createdAt', '<', endDate.toISOString())
        .get();

      if (earningsSnap.empty) {
        continue;
      }

      let totalAmount = 0;
      const earningsToUpdate: admin.firestore.DocumentReference[] = [];

      const allOrderIds = [...new Set(earningsSnap.docs.map(doc => doc.data().orderId))];
      const orders: Record<string, Order> = {};
      if (allOrderIds.length > 0) {
          const chunkSize = 30;
          for (let i = 0; i < allOrderIds.length; i += chunkSize) {
              const chunk = allOrderIds.slice(i, i + chunkSize);
              if (chunk.length > 0) {
                const ordersQuery = db.collection('orders').where(admin.firestore.FieldPath.documentId(), 'in', chunk);
                const ordersSnapshot = await ordersQuery.get();
                ordersSnapshot.forEach(orderDoc => {
                    orders[orderDoc.id] = { id: orderDoc.id, ...orderDoc.data() } as Order;
                });
              }
          }
      }

      earningsSnap.forEach(doc => {
        const earning = doc.data() as AffiliateEarning;
        const order = orders[earning.orderId];
        let isEligible = false;

        if (order && order.status === 'delivered' && order.deliveredAt) {
            const maxReturnDays = Math.max(0, ...order.items.map(item => item.returnPolicy || 0));
            if (maxReturnDays > 0) {
                const deliveryDate = new Date(order.deliveredAt);
                const returnDeadline = new Date(deliveryDate);
                returnDeadline.setDate(deliveryDate.getDate() + maxReturnDays);

                if (new Date() > returnDeadline) {
                    isEligible = true;
                }
            } else {
                isEligible = true;
            }
        }
        
        if (isEligible) {
            totalAmount += earning.commissionAmount;
            earningsToUpdate.push(doc.ref);
        }
      });


      if (totalAmount > 0 && totalAmount >= (minimumWithdrawal || 100)) {
        const withdrawalRef = db.collection('withdrawals').doc();
        const newWithdrawal: Withdrawal = {
          id: withdrawalRef.id,
          affiliateUid: user.uid,
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

        await createAndSendNotification(user.uid, {
            icon: 'DollarSign',
            title: 'Withdrawal Processed',
            description: `Your earnings of ৳${totalAmount.toFixed(2)} have been processed for withdrawal.`,
            href: '/affiliate/wallet',
        });
      }
    }
    console.log("Withdrawal processing finished successfully.");
  } catch (error) {
    console.error("Error processing withdrawals:", error);
  }
}
