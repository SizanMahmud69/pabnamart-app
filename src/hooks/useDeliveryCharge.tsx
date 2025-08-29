
"use client";

import { useState, useEffect } from 'react';
import type { DeliverySettings } from '@/types';

const defaultSettings: DeliverySettings = {
  insidePabnaSmall: 60,
  insidePabnaLarge: 80,
  outsidePabnaSmall: 120,
  outsidePabnaLarge: 150,
};

export const useDeliveryCharge = () => {
  const [settings, setSettings] = useState<DeliverySettings>(defaultSettings);

  useEffect(() => {
    // This hook runs on the client-side, so it's safe to access localStorage.
    try {
      const savedSettings = localStorage.getItem('deliverySettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error("Could not read delivery settings from localStorage", error);
    }
  }, []);

  return { 
    chargeInsidePabnaSmall: settings.insidePabnaSmall, 
    chargeInsidePabnaLarge: settings.insidePabnaLarge,
    chargeOutsidePabnaSmall: settings.outsidePabnaSmall,
    chargeOutsidePabnaLarge: settings.outsidePabnaLarge,
  };
};
