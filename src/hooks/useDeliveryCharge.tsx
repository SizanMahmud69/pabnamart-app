
"use client";

import { useState, useEffect } from 'react';

const DEFAULT_DELIVERY_CHARGE = 50;

export const useDeliveryCharge = () => {
  const [deliveryCharge, setDeliveryCharge] = useState(DEFAULT_DELIVERY_CHARGE);

  useEffect(() => {
    // This hook runs on the client-side, so it's safe to access localStorage.
    try {
      const savedCharge = localStorage.getItem('deliveryCharge');
      if (savedCharge) {
        const charge = parseInt(savedCharge, 10);
        if (!isNaN(charge)) {
          setDeliveryCharge(charge);
        }
      }
    } catch (error) {
      console.error("Could not read delivery charge from localStorage", error);
    }
  }, []);

  return { deliveryCharge };
};
