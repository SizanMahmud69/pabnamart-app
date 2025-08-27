
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Voucher } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './useAuth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
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
      setCollectedVouchers([]);
    }
  }, [user]);

  const collectVoucher = useCallback((voucher: Voucher) => {
    if (!user) {
        toast({
            title: "Please log in",
            description: "You need to be logged in to collect vouchers.",
            variant: "destructive"
        });
        return;
    }
      
    const isAlreadyCollected = collectedVouchers.some(v => v.code === voucher.code);

    if (isAlreadyCollected) {
      toast({
        title: "Already Collected",
        description: "You have already collected this voucher.",
        variant: "destructive"
      });
      return;
    }
    
    const newVouchers = [...collectedVouchers, voucher];
    setCollectedVouchers(newVouchers);
    updateFirestoreVouchers(newVouchers);
    toast({
      title: "Voucher Collected!",
      description: `Voucher ${voucher.code} has been added to your account.`,
    });
  }, [collectedVouchers, toast, user, updateFirestoreVouchers]);


  const voucherCount = collectedVouchers.length;

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
