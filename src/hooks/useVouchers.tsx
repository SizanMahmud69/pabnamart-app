
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Voucher } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './useAuth';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import app from '@/lib/firebase';

interface VoucherContextType {
  collectedVouchers: Voucher[];
  availableReturnVouchers: Voucher[];
  collectVoucher: (voucher: Voucher) => void;
  voucherCount: number;
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

const db = getFirestore(app);

export const VoucherProvider = ({ children }: { children: ReactNode }) => {
  const [collectedVouchers, setCollectedVouchers] = useState<Voucher[]>([]);
  const [availableReturnVouchers, setAvailableReturnVouchers] = useState<Voucher[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
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
  }, [toast, user]);

  const voucherCount = collectedVouchers.filter(v => !v.isReturnVoucher).length;

  return (
    <VoucherContext.Provider
      value={{
        collectedVouchers,
        availableReturnVouchers,
        collectVoucher,
        voucherCount,
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
