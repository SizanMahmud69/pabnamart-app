
"use client";

import { useState, useEffect } from 'react';
import type { DeliverySettings } from '@/types';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';

const db = getFirestore(app);

const defaultSettings: DeliverySettings = {
  insidePabnaSmall: 60,
  insidePabnaLarge: 80,
  outsidePabnaSmall: 120,
  outsidePabnaLarge: 150,
  deliveryTimeInside: 2,
  deliveryTimeOutside: 4,
  returnAddress: '',
};

export const useDeliveryCharge = () => {
  const [settings, setSettings] = useState<DeliverySettings>(defaultSettings);

  useEffect(() => {
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
    chargeInsidePabnaSmall: settings.insidePabnaSmall, 
    chargeInsidePabnaLarge: settings.insidePabnaLarge,
    chargeOutsidePabnaSmall: settings.outsidePabnaSmall,
    chargeOutsidePabnaLarge: settings.outsidePabnaLarge,
    deliveryTimeInside: settings.deliveryTimeInside,
    deliveryTimeOutside: settings.deliveryTimeOutside,
    returnAddress: settings.returnAddress,
  };
};
