
"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { Offer } from '@/types';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';

interface OfferContextType {
  offers: Offer[];
  activeOffers: Offer[];
  loading: boolean;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

export const OfferProvider = ({ children }: { children: ReactNode }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!app) {
      setLoading(false);
      return;
    }
    const db = getFirestore(app);
    const unsubscribe = onSnapshot(collection(db, 'offers'), (snapshot) => {
        const offersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
        setOffers(offersData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching offers:", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const activeOffers = useMemo(() => {
    const now = new Date();
    return offers.filter(offer => {
      const start = new Date(offer.startDate);
      const end = new Date(offer.endDate);
      end.setHours(23, 59, 59, 999);
      return now >= start && now <= end;
    });
  }, [offers]);

  return (
    <OfferContext.Provider value={{ offers, activeOffers, loading }}>
      {children}
    </OfferContext.Provider>
  );
};

export const useOffers = () => {
  const context = useContext(OfferContext);
  if (context === undefined) {
    throw new Error('useOffers must be used within an OfferProvider');
  }
  return context;
};
