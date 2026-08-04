
"use client";

import { getFirestore, doc, runTransaction, collection, increment, deleteField, getDocs } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { OrderPayload, Product, User, Voucher, OrderItem, CoinSettings, Category } from '@/types';
import { roundMoney } from '@/lib/utils';

const db = getFirestore(app);

const defaultCoinSettings: CoinSettings = {
    checkInPoints: 1,
    reviewPoints: 20,
    pointsPer100Taka: 10,
    takaPer100Coins: 10,
    maxCoinsPerOrder: 100,
};

function nowToOrderNumber() {
    const now = new Date();
    return `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${Math.floor(10000 + Math.random() * 90000)}`;
}

function sanitize(obj: any): any {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);
    
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (val !== undefined) {
            cleaned[key] = sanitize(val);
        }
    });
    return cleaned;
}

export async function placeOrder(payload: OrderPayload): Promise<{ success: boolean; orderId?: string; orderNumber?: string; message?: string }> {
  try {
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    const allCategories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));

    const isItemValidForVoucher = (itemCategory: string, voucherCategory: string) => {
        if (!voucherCategory) return true;
        if (itemCategory === voucherCategory) return true;
        
        const cat = allCategories.find(c => c.name === itemCategory);
        if (cat && cat.parentId && cat.parentId !== 'none') {
            const parent = allCategories.find(c => c.id === cat.parentId);
            if (parent && parent.name === voucherCategory) return true;
        }
        return false;
    };

    const result = await runTransaction(db, async (transaction) => {
      // 1. PREPARE ALL REFERENCES
      const productRefs = payload.items.map(item => doc(db, 'products', item.id.toString()));
      const userRef = doc(db, 'users', payload.userId);
      const coinSettingsRef = doc(db, 'settings', 'coin');
      const voucherRef = payload.voucherCode ? doc(db, 'vouchers', payload.voucherCode) : null;
      
      const isGuest = payload.userId.startsWith('guest_');

      // 2. EXECUTE ALL READS FIRST (Strict Firestore rule: All gets before sets/updates)
      const [productSnaps, userSnap, coinSettingsSnap, voucherSnap] = await Promise.all([
          Promise.all(productRefs.map(ref => transaction.get(ref))),
          isGuest ? Promise.resolve(null) : transaction.get(userRef),
          transaction.get(coinSettingsRef),
          voucherRef ? transaction.get(voucherRef) : Promise.resolve(null)
      ]);

      // 3. VALIDATIONS & CALCULATIONS
      const userData = userSnap?.exists() ? userSnap.data() as User : null;
      const settings = { ...defaultCoinSettings, ...(coinSettingsSnap.exists() ? coinSettingsSnap.data() : {}) } as CoinSettings;
      
      const itemsForOrder: OrderItem[] = [];
      let totalOfferSubtotal = 0; 

      for (let i = 0; i < productSnaps.length; i++) {
        const productSnap = productSnaps[i];
        const cartItem = payload.items[i];
        
        if (!productSnap.exists()) throw new Error(`Product ${cartItem.name} not found.`);
        const productData = productSnap.data() as Product;
        if (productData.stock < cartItem.quantity) throw new Error(`Not enough stock for ${productData.name}.`);

        const itemPrice = roundMoney(cartItem.price);
        totalOfferSubtotal += itemPrice * cartItem.quantity;

        itemsForOrder.push({
          id: productData.id,
          name: productData.name,
          price: itemPrice,
          originalPrice: roundMoney(cartItem.originalPrice ?? cartItem.price),
          quantity: cartItem.quantity,
          image: productData.images[0] || '',
          returnPolicy: productData.returnPolicy || 0,
          unit: productData.unit || 'Pcs',
          color: cartItem.color || null,
          size: cartItem.size || null,
          isB1G1: cartItem.isB1G1 || false,
        });
      }

      let voucherDiscount = 0;
      let usedVoucherCode = '';

      if (voucherSnap?.exists() && !isGuest) {
        const v = voucherSnap.data() as Voucher;
        const usage = userData?.usedVouchers?.[v.code] || 0;
        const withinLimit = !v.usageLimit || usage < v.usageLimit;
        
        if (withinLimit) {
            const relevantItems = v.applicableCategory 
                ? payload.items.filter(item => isItemValidForVoucher(item.category, v.applicableCategory!))
                : payload.items;
            
            const relevantSubtotal = relevantItems.reduce((acc, item) => acc + (roundMoney(item.price) * item.quantity), 0);
            
            if (!v.minSpend || relevantSubtotal >= v.minSpend) {
                if (relevantItems.length > 0) {
                    usedVoucherCode = v.code;
                    if (v.discountType !== 'shipping') {
                        voucherDiscount = v.type === 'fixed' ? v.discount : (relevantSubtotal * v.discount) / 100;
                        voucherDiscount = roundMoney(voucherDiscount);
                    }
                }
            }
        }
      }
      
      let coinDiscount = 0;
      let coinsToUse = 0;
      if (payload.useCoins && !isGuest && userData) {
          const userCoins = userData.coins || 0;
          coinsToUse = Math.min(userCoins, settings.maxCoinsPerOrder);
          if (coinsToUse > 0) {
              coinDiscount = roundMoney((coinsToUse / 100) * settings.takaPer100Coins);
          }
      }

      let spinDiscount = 0;
      let spinPercentageUsed = 0;
      if (payload.useSpinDiscount && !isGuest && userData?.activeSpinDiscount && userData?.spinDiscountExpiry) {
          const now = new Date();
          const expiry = new Date(userData.spinDiscountExpiry);
          if (now < expiry) {
              spinPercentageUsed = userData.activeSpinDiscount;
              const baseForSpin = totalOfferSubtotal - voucherDiscount - coinDiscount;
              spinDiscount = roundMoney((baseForSpin * spinPercentageUsed) / 100);
          }
      }

      const codFee = payload.paymentMethod === 'cash-on-delivery' ? roundMoney(payload.cashOnDeliveryFee || 0) : 0;
      const total = roundMoney((totalOfferSubtotal - voucherDiscount - coinDiscount - spinDiscount) + payload.shippingFee + codFee);

      // 4. EXECUTE ALL WRITES AFTER ALL READS ARE DONE
      // Update Stocks
      for (let i = 0; i < productSnaps.length; i++) {
        const productSnap = productSnaps[i];
        const cartItem = payload.items[i];
        const productData = productSnap.data() as Product;

        let newColors = [...(productData.colors || [])];
        let newSizes = [...(productData.sizes || [])];

        if (cartItem.color) {
            const idx = newColors.findIndex(c => c.name === cartItem.color);
            if (idx !== -1) newColors[idx].stock -= cartItem.quantity;
        }
        if (cartItem.size) {
            const idx = newSizes.findIndex(s => s.name === cartItem.size);
            if (idx !== -1) newSizes[idx].stock -= cartItem.quantity;
        }
        
        transaction.update(productSnap.ref, {
          stock: increment(-cartItem.quantity),
          sold: increment(cartItem.quantity),
          colors: newColors,
          sizes: newSizes,
        });
      }

      // Update User Data
      if (!isGuest) {
          const userUpdates: any = {};
          if (usedVoucherCode) {
              userUpdates[`usedVouchers.${usedVoucherCode}`] = increment(1);
          }
          if (coinsToUse > 0) {
              userUpdates.coins = increment(-coinsToUse);
              const coinHistoryRef = doc(collection(db, `users/${payload.userId}/coinHistory`));
              transaction.set(coinHistoryRef, {
                  id: coinHistoryRef.id,
                  amount: coinsToUse,
                  type: 'spend',
                  reason: 'Discount on order',
                  date: new Date().toISOString()
              });
          }
          if (spinPercentageUsed > 0) {
              userUpdates.activeSpinDiscount = deleteField();
              userUpdates.spinDiscountExpiry = deleteField();
          }

          // Earn coins logic
          const earnedCoins = Math.floor((totalOfferSubtotal / 100) * settings.pointsPer100Taka);
          if (earnedCoins > 0) {
              userUpdates.coins = increment((userUpdates.coins ? -coinsToUse : 0) + earnedCoins);
              const earnHistoryRef = doc(collection(db, `users/${payload.userId}/coinHistory`));
              transaction.set(earnHistoryRef, {
                id: earnHistoryRef.id,
                amount: earnedCoins,
                type: 'earn',
                reason: `Earned from Order #${nowToOrderNumber()}`, 
                date: new Date().toISOString()
              });
          }

          if (Object.keys(userUpdates).length > 0) {
              transaction.update(userRef, userUpdates);
          }
      }

      // Save the Order
      const orderRef = doc(collection(db, 'orders'));
      const orderNumber = nowToOrderNumber();
      const orderData = {
        userId: payload.userId,
        items: itemsForOrder,
        total,
        shippingAddress: payload.shippingAddress,
        status: payload.paymentMethod === 'cash-on-delivery' ? 'processing' : 'pending',
        date: new Date().toISOString(),
        orderNumber,
        paymentMethod: payload.paymentMethod,
        transactionId: payload.transactionId || '',
        paymentAccountNumber: payload.paymentAccountNumber || '',
        shippingFee: roundMoney(payload.shippingFee),
        voucherCode: usedVoucherCode,
        voucherDiscount,
        coinDiscount,
        spinDiscount,
        spinDiscountPercentage: spinPercentageUsed,
        cashOnDeliveryFee: codFee,
        referrerId: payload.referrerId || null,
      };

      transaction.set(orderRef, sanitize(orderData));

      return { orderId: orderRef.id, orderNumber };
    });

    return { success: true, orderId: result.orderId, orderNumber: result.orderNumber };
  } catch (error: any) {
    console.error('Order placement failed:', error);
    return { success: false, message: error.message || "Something went wrong. Please try again." };
  }
}
