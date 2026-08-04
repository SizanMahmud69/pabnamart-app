
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
      const productRefs = payload.items.map(item => doc(db, 'products', item.id.toString()));
      const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));
      
      let userData: User | null = null;
      const isGuest = payload.userId.startsWith('guest_');

      if (!isGuest) {
          const userSnap = await transaction.get(doc(db, 'users', payload.userId));
          if (userSnap.exists()) userData = userSnap.data() as User;
      }

      const coinSettingsSnap = await transaction.get(doc(db, 'settings', 'coin'));
      const settings = { ...defaultCoinSettings, ...(coinSettingsSnap.data() || {}) } as CoinSettings;
      
      const itemsForOrder: OrderItem[] = [];
      let totalOfferSubtotal = 0; 

      for (let i = 0; i < productSnaps.length; i++) {
        const productSnap = productSnaps[i];
        const cartItem = payload.items[i];
        if (!productSnap.exists()) throw new Error(`Product ${cartItem.name} not found.`);
        const productData = productSnap.data() as Product;
        if (productData.stock < cartItem.quantity) throw new Error(`Not enough stock for ${productData.name}.`);

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
        
        const origPrice = cartItem.originalPrice ?? cartItem.price;
        const itemPrice = roundMoney(cartItem.price);
        totalOfferSubtotal += itemPrice * cartItem.quantity;

        itemsForOrder.push({
          id: productData.id,
          name: productData.name,
          price: itemPrice,
          originalPrice: roundMoney(origPrice),
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

      if (payload.voucherCode && !isGuest) {
        const vSnap = await transaction.get(doc(db, 'vouchers', payload.voucherCode));
        if (vSnap.exists()) {
            const v = vSnap.data() as Voucher;
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
                        transaction.update(doc(db, 'users', payload.userId), { [`usedVouchers.${usedVoucherCode}`]: increment(1) });
                    }
                }
            }
        }
      }
      
      let coinDiscount = 0;
      let coinsToUse = 0;
      if (payload.useCoins && !isGuest && userData) {
          const userCoins = userData.coins || 0;
          const maxCoinsAvailable = (settings.maxCoinsPerOrder / settings.takaPer100Coins) * 100;
          coinsToUse = Math.min(userCoins, Math.floor(maxCoinsAvailable));
          if (coinsToUse > 0) {
              coinDiscount = (coinsToUse / 100) * settings.takaPer100Coins;
              coinDiscount = roundMoney(coinDiscount);
              transaction.update(doc(db, 'users', payload.userId), {
                  coins: increment(-coinsToUse)
              });
              const coinHistoryRef = doc(collection(db, `users/${payload.userId}/coinHistory`));
              transaction.set(coinHistoryRef, {
                  id: coinHistoryRef.id,
                  amount: coinsToUse,
                  type: 'spend',
                  reason: 'Discount on order',
                  date: new Date().toISOString()
              });
          }
      }

      let spinDiscount = 0;
      let spinPercentageUsed = 0;
      if (payload.useSpinDiscount && !isGuest && userData && userData.activeSpinDiscount && userData.spinDiscountExpiry) {
          const now = new Date();
          const expiry = new Date(userData.spinDiscountExpiry);
          if (now < expiry) {
              spinPercentageUsed = userData.activeSpinDiscount;
              const baseForSpin = totalOfferSubtotal - voucherDiscount - coinDiscount;
              spinDiscount = roundMoney((baseForSpin * spinPercentageUsed) / 100);
              transaction.update(doc(db, 'users', payload.userId), { 
                  activeSpinDiscount: deleteField(),
                  spinDiscountExpiry: deleteField()
              });
          }
      }

      const codFee = payload.paymentMethod === 'cash-on-delivery' ? roundMoney(payload.cashOnDeliveryFee || 0) : 0;
      const total = roundMoney((totalOfferSubtotal - voucherDiscount - coinDiscount - spinDiscount) + payload.shippingFee + codFee);

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

      if (!isGuest) {
          const coinsEarned = Math.floor((totalOfferSubtotal / 100) * settings.pointsPer100Taka);
          if (coinsEarned > 0) {
              transaction.update(doc(db, 'users', payload.userId), { coins: increment(coinsEarned) });
              const earnHistoryRef = doc(collection(db, `users/${payload.userId}/coinHistory`));
              transaction.set(earnHistoryRef, {
                id: earnHistoryRef.id,
                amount: coinsEarned,
                type: 'earn',
                reason: `Earned from Order #${orderNumber}`,
                date: new Date().toISOString()
              });
          }
      }

      return { orderId: orderRef.id, orderNumber };
    });

    return { success: true, orderId: result.orderId, orderNumber: result.orderNumber };
  } catch (error: any) {
    console.error('Order placement failed:', error);
    return { success: false, message: error.message || "Something went wrong. Please try again." };
  }
}
