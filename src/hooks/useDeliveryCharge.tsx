
"use client";

import { useState, useEffect } from 'react';
import type { DeliverySettings } from '@/types';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';

const defaultSettings: DeliverySettings = {
  insidePabnaSmall: 60,
  insidePabnaLarge: 80,
  outsidePabnaSmall: 120,
  outsidePabnaLarge: 150,
  deliveryTimeInside: 2,
  deliveryTimeOutside: 4,
  returnAddress: '',
  cashOnDeliveryFee: 20,
};

export const useDeliveryCharge = () => {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);

  useEffect(() => {
    if (!app) {
        setSettings(defaultSettings);
        return;
    }
    const db = getFirestore(app);
    const settingsDocRef = doc(db, 'settings', 'delivery');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setSettings({ ...defaultSettings, ...data });
        } else {
            setSettings(defaultSettings);
        }
    }, (error) => {
        console.error("Could not read delivery settings from Firestore", error);
        setSettings(defaultSettings);
    });

    return () => unsubscribe();
  }, []);

  return { 
    chargeInsidePabnaSmall: Number(settings?.insidePabnaSmall ?? defaultSettings.insidePabnaSmall), 
    chargeInsidePabnaLarge: Number(settings?.insidePabnaLarge ?? defaultSettings.insidePabnaLarge),
    chargeOutsidePabnaSmall: Number(settings?.outsidePabnaSmall ?? defaultSettings.outsidePabnaSmall),
    chargeOutsidePabnaLarge: Number(settings?.outsidePabnaLarge ?? defaultSettings.outsidePabnaLarge),
    deliveryTimeInside: Number(settings?.deliveryTimeInside ?? defaultSettings.deliveryTimeInside),
    deliveryTimeOutside: Number(settings?.deliveryTimeOutside ?? defaultSettings.deliveryTimeOutside),
    returnAddress: settings?.returnAddress ?? '',
    cashOnDeliveryFee: Number(settings?.cashOnDeliveryFee ?? defaultSettings.cashOnDeliveryFee),
  };
};
