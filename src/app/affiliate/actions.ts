
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
 * @param force If true, bypasses the date check.
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
    const settings: AffiliateSettings = settingsSnap.exists 
        ? settingsSnap.data() as AffiliateSettings 
        : { withdrawalDay1: 16, withdrawalDay2: 1, minimumWithdrawal: 100 };
    
    const { withdrawalDay1, withdrawalDay2, minimumWithdrawal, lastWithdrawalRun } = settings;

    // Use Bangladesh Time for consistent date checking
    const bdTimeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    }).format(new Date());
    
    const [month, day, year] = bdTimeStr.split('/');
    const currentDay = parseInt(day);
    const todayStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Check if it's already been run today
    if (!force && lastWithdrawalRun === todayStr) {
        return { success: true, message: "Already processed today." };
    }

    // Check if today is a scheduled withdrawal day
    const isDay1 = withdrawalDay1 > 0 && currentDay === withdrawalDay1;
    const isDay2 = withdrawalDay2 > 0 && currentDay === withdrawalDay2;

    if (!force && !isDay1 && !isDay2) {
      return { success: true, message: `Today (${currentDay}) is not a scheduled withdrawal day.` };
    }

    console.log(`Starting withdrawal processing for ${todayStr}...`);

    // Fetch all users who are affiliates
    const usersSnap = await db.collection('users').where('isAffiliate', '==', true).get();
    let totalProcessed = 0;
    
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data() as User;
      const userUid = userDoc.id;

      // Skip users without payout info
      if (!user.payoutInfo || !user.payoutInfo.accountNumber) continue;
      
      // Fetch all earnings with status 'paid'
      const earningsSnap = await db.collection('affiliateEarnings')
        .where('affiliateUid', '==', userUid)
        .where('status', '==', 'paid')
        .get();

      if (earningsSnap.empty) continue;

      let totalAmount = 0;
      const earningsToUpdate: admin.firestore.DocumentReference[] = [];

      // Collect order IDs
      const orderIds = [...new Set(earningsSnap.docs.map(doc => doc.data().orderId))];
      const orders: Record<string, Order> = {};
      
      if (orderIds.length > 0) {
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

      const now = new Date();

      // Check eligibility (24 hours after delivery)
      for (const eDoc of earningsSnap.docs) {
        const earning = eDoc.data() as AffiliateEarning;
        const order = orders[earning.orderId];
        
        if (order && order.status === 'delivered' && order.deliveredAt) {
            const deliveryDate = new Date(order.deliveredAt);
            const withdrawalDeadline = new Date(deliveryDate.getTime() + 24 * 60 * 60 * 1000);

            if (now >= withdrawalDeadline) {
                totalAmount += earning.commissionAmount;
                earningsToUpdate.push(eDoc.ref);
            }
        }
      }

      // Create withdrawal if threshold is met
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
    
    // Mark as run today
    await settingsRef.update({ lastWithdrawalRun: todayStr });
    
    return { success: true, message: `Finished. Processed ${totalProcessed} withdrawal requests.` };
  } catch (error: any) {
    console.error("Error processing withdrawals:", error);
    return { success: false, message: error.message || "Failed to process withdrawals." };
  }
}

export async function requestManualWithdrawal(userId: string): Promise<{ success: boolean; message: string }> {
    const adminApp = getFirebaseAdmin();
    if (!adminApp) return { success: false, message: "Firebase Admin not available." };
    const db = admin.firestore();

    try {
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found.");
        const user = userSnap.data() as User;

        if (!user.payoutInfo || !user.payoutInfo.accountNumber) {
            return { success: false, message: "Please set your payout information in settings first." };
        }

        const settingsRef = db.collection('settings').doc('affiliate');
        const settingsSnap = await settingsRef.get();
        const settings: AffiliateSettings = settingsSnap.exists 
            ? settingsSnap.data() as AffiliateSettings 
            : { withdrawalDay1: 16, withdrawalDay2: 1, minimumWithdrawal: 100 };

        const earningsSnap = await db.collection('affiliateEarnings')
            .where('affiliateUid', '==', userId)
            .where('status', '==', 'paid')
            .get();

        if (earningsSnap.empty) return { success: false, message: "No eligible earnings found." };

        const orderIds = [...new Set(earningsSnap.docs.map(doc => doc.data().orderId))];
        const orders: Record<string, Order> = {};
        
        if (orderIds.length > 0) {
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

        const now = new Date();
        let totalAmount = 0;
        const earningsToUpdate: admin.firestore.DocumentReference[] = [];

        for (const eDoc of earningsSnap.docs) {
            const earning = eDoc.data() as AffiliateEarning;
            const order = orders[earning.orderId];
            
            // Check eligibility (24 hours after delivery)
            if (order && order.status === 'delivered' && order.deliveredAt) {
                const deliveryDate = new Date(order.deliveredAt);
                const withdrawalDeadline = new Date(deliveryDate.getTime() + 24 * 60 * 60 * 1000);

                if (now >= withdrawalDeadline) {
                    totalAmount += earning.commissionAmount;
                    earningsToUpdate.push(eDoc.ref);
                }
            }
        }

        if (totalAmount <= 0) {
            return { success: false, message: "No earnings have passed the 24-hour waiting period yet." };
        }

        if (totalAmount < (settings.minimumWithdrawal || 100)) {
            return { success: false, message: `Minimum withdrawal amount is ৳${settings.minimumWithdrawal || 100}. Your eligible amount is ৳${totalAmount.toFixed(2)}.` };
        }

        const withdrawalRef = db.collection('withdrawals').doc();
        const newWithdrawal: Withdrawal = {
            id: withdrawalRef.id,
            affiliateUid: userId,
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

        return { success: true, message: `Withdrawal request for ৳${totalAmount.toFixed(2)} submitted successfully.` };

    } catch (error: any) {
        console.error("Manual withdrawal error:", error);
        return { success: false, message: error.message || "Failed to process withdrawal request." };
    }
}
