
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Voucher } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './useAuth';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';

interface VoucherContextType {
  collectedVouchers: Voucher[];
  collectVoucher: (voucher: Voucher) => void;
  voucherCount: number;
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

const db = getFirestore(app);

export const VoucherProvider = ({ children }: { children: ReactNode }) => {
  const [collectedVouchers, setCollectedVouchers] = useState<Voucher[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const updateFirestoreVouchers = useCallback(async (vouchers: Voucher[]) => {
    if (user) {
      const voucherRef = doc(db, 'userVouchers', user.uid);
      await setDoc(voucherRef, { vouchers });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const voucherRef = doc(db, 'userVouchers', user.uid);
      const unsubscribe = onSnapshot(voucherRef, (docSnap) => {
        if (docSnap.exists()) {
          setCollectedVouchers(docSnap.data().vouchers || []);
        } else {
          setCollectedVouchers([]);
        }
      });
      return () => unsubscribe();
    } else {
      // Clear vouchers for logged-out users
      setCollectedVouchers([]);
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
      
    // Fetch latest vouchers to prevent race conditions
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
    
    const newVouchers = [...currentVouchers, voucher];
    await updateFirestoreVouchers(newVouchers); // This will trigger the onSnapshot listener to update state
    
    toast({
      title: "Voucher Collected!",
      description: `Voucher ${voucher.code} has been added to your account.`,
    });
  }, [toast, user, updateFirestoreVouchers]);

  const voucherCount = collectedVouchers.filter(v => !v.isReturnVoucher).length;

  return (
    <VoucherContext.Provider
      value={{
        collectedVouchers,
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
