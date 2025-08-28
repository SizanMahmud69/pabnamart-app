
"use client";

import { useState, useEffect } from 'react';
import type { DeliverySettings } from '@/types';

const defaultSettings: DeliverySettings = {
  insidePabna: 60,
  outsidePabna: 120,
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
    chargeInsidePabna: settings.insidePabna, 
    chargeOutsidePabna: settings.outsidePabna 
  };
};
