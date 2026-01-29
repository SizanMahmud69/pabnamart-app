
"use server";

import admin from 'firebase-admin';
import type { Withdrawal, AffiliateEarning, User } from '@/types';
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
    const usersSnap = await db.collection('users').where('isAffiliate', '==', true).get();
    
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data() as User;
      if (!user.payoutInfo || !user.payoutInfo.accountNumber) {
        continue;
      }
      
      const earningsSnap = await db.collection('affiliateEarnings')
        .where('affiliateUid', '==', user.uid)
        .where('status', '==', 'paid')
        .get();

      if (earningsSnap.empty) {
        continue;
      }

      let totalAmount = 0;
      const earningsToUpdate: admin.firestore.DocumentReference[] = [];

      earningsSnap.forEach(doc => {
        const earning = doc.data() as AffiliateEarning;
        totalAmount += earning.commissionAmount;
        earningsToUpdate.push(doc.ref);
      });

      if (totalAmount > 0) {
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
