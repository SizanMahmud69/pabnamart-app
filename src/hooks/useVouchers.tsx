
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Voucher } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './useAuth';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, arrayUnion, collection, query, orderBy, type Firestore } from 'firebase/firestore';
import app from '@/lib/firebase';

interface VoucherContextType {
  collectedVouchers: Voucher[];
  availableReturnVouchers: Voucher[];
  collectVoucher: (voucher: Voucher) => void;
  voucherCount: number;
  popupVoucher: Voucher | null;
  markVoucherAsSeen: (code: string) => void;
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

export const VoucherProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [collectedVouchers, setCollectedVouchers] = useState<Voucher[]>([]);
  const [availableReturnVouchers, setAvailableReturnVouchers] = useState<Voucher[]>([]);
  const [allVouchers, setAllVouchers] = useState<Voucher[]>([]);
  const [popupVoucher, setPopupVoucher] = useState<Voucher | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (app) {
      setDb(getFirestore(app));
    }
  }, []);

  // Fetch all general vouchers
  useEffect(() => {
    if (!db) return;
    const vouchersRef = collection(db, 'vouchers');
    const q = query(vouchersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const vouchersData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Voucher))
            .filter(v => !v.isReturnVoucher);
        setAllVouchers(vouchersData);
    });
    return () => unsubscribe();
  }, [db]);

  // Handle user-specific vouchers
  useEffect(() => {
    if (user && db) {
      // Listener for collected vouchers
      const collectedVoucherRef = doc(db, 'userVouchers', user.uid);
      const unsubscribeCollected = onSnapshot(collectedVoucherRef, (docSnap) => {
        if (docSnap.exists()) {
          setCollectedVouchers(docSnap.data().vouchers || []);
        } else {
          setCollectedVouchers([]);
        }
      });
      
      // Listener for available return vouchers
      const availableVoucherRef = doc(db, 'availableReturnVouchers', user.uid);
      const unsubscribeAvailable = onSnapshot(availableVoucherRef, (docSnap) => {
        if (docSnap.exists()) {
          setAvailableReturnVouchers(docSnap.data().vouchers || []);
        } else {
          setAvailableReturnVouchers([]);
        }
      });

      return () => {
        unsubscribeCollected();
        unsubscribeAvailable();
      };
    } else {
      // Clear vouchers for logged-out users
      setCollectedVouchers([]);
      setAvailableReturnVouchers([]);
    }
  }, [user, db]);

  // Logic for new voucher popup
  useEffect(() => {
    if (user && allVouchers.length > 0 && collectedVouchers) {
      const seenVouchers = JSON.parse(localStorage.getItem(`seenVouchers_${user.uid}`) || '[]');
      const collectedVoucherCodes = new Set(collectedVouchers.map(v => v.code));
      
      const uncollectedAndUnseenVouchers = allVouchers.filter(
        v => !collectedVoucherCodes.has(v.code) && !seenVouchers.includes(v.code)
      );

      if (uncollectedAndUnseenVouchers.length > 0) {
        // Pick a random voucher from the uncollected and unseen list
        const randomIndex = Math.floor(Math.random() * uncollectedAndUnseenVouchers.length);
        setPopupVoucher(uncollectedAndUnseenVouchers[randomIndex]);
      } else {
        setPopupVoucher(null);
      }
    } else {
        setPopupVoucher(null);
    }
  }, [allVouchers, collectedVouchers, user]);

  const markVoucherAsSeen = useCallback((code: string) => {
    if (!user) return;
    const seenVouchers = JSON.parse(localStorage.getItem(`seenVouchers_${user.uid}`) || '[]');
    if (!seenVouchers.includes(code)) {
        const newSeenVouchers = [...seenVouchers, code];
        localStorage.setItem(`seenVouchers_${user.uid}`, JSON.stringify(newSeenVouchers));
    }
    setPopupVoucher(null);
  }, [user]);

  const collectVoucher = useCallback(async (voucher: Voucher) => {
    if (!user) {
        toast({
            title: "Please log in",
            description: "You need to be logged in to collect vouchers.",
            variant: "destructive"
        });
        return;
    }
    
    if (!db) return;
      
    const voucherRef = doc(db, 'userVouchers', user.uid);
    const docSnap = await getDoc(voucherRef);
    const currentVouchers = docSnap.exists() ? docSnap.data().vouchers : [];

    const isAlreadyCollected = currentVouchers.some((v: Voucher) => v.code === voucher.code);

    if (isAlreadyCollected) {
      toast({
        title: "Already Collected",
        description: "You have already collected this voucher.",
      });
      return;
    }
    
    const voucherToCollect = {
        ...voucher,
        collectedDate: new Date().toISOString()
    };
    
    if (docSnap.exists()) {
        await setDoc(voucherRef, { vouchers: arrayUnion(voucherToCollect) }, { merge: true });
    } else {
        await setDoc(voucherRef, { vouchers: [voucherToCollect] });
    }
    
    toast({
      title: "Voucher Collected!",
      description: `Voucher ${voucher.code} has been added to your account.`,
    });
  }, [toast, user, db]);

  const voucherCount = collectedVouchers.length;

  return (
    <VoucherContext.Provider
      value={{
        collectedVouchers,
        availableReturnVouchers,
        collectVoucher,
        voucherCount,
        popupVoucher,
        markVoucherAsSeen,
      }}
    >
      {children}
    </VoucherContext.Provider>
  );
};

export const useVouchers = () => {
  const context = useContext(VoucherContext);
  if (context === undefined) {
    throw new Error('useVouchers must be used within a VoucherProvider');
  }
  return context;
};
