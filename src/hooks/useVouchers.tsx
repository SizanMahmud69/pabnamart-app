
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Voucher } from '@/types';
import { useToast } from "@/hooks/use-toast";

interface VoucherContextType {
  collectedVouchers: Voucher[];
  collectVoucher: (voucher: Voucher) => void;
  voucherCount: number;
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

export const VoucherProvider = ({ children }: { children: ReactNode }) => {
  const [collectedVouchers, setCollectedVouchers] = useState<Voucher[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const savedVouchers = window.localStorage.getItem('collectedVouchers');
      return savedVouchers ? JSON.parse(savedVouchers) : [];
    } catch (error) {
      console.error("Error reading vouchers from localStorage", error);
      return [];
    }
  });
  const { toast } = useToast();
  
  useEffect(() => {
    try {
      window.localStorage.setItem('collectedVouchers', JSON.stringify(collectedVouchers));
    } catch (error) {
      console.error("Error saving vouchers to localStorage", error);
    }
  }, [collectedVouchers]);

  const collectVoucher = useCallback((voucher: Voucher) => {
    const isAlreadyCollected = collectedVouchers.some(v => v.code === voucher.code);

    if (isAlreadyCollected) {
      toast({
        title: "Already Collected",
        description: "You have already collected this voucher.",
        variant: "destructive"
      });
      return;
    }

    setCollectedVouchers(prevVouchers => [...prevVouchers, voucher]);
    toast({
      title: "Voucher Collected!",
      description: `Voucher ${voucher.code} has been added to your account.`,
    });
  }, [collectedVouchers, toast]);


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
