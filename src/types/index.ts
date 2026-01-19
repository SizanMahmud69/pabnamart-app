
import type { LucideIcon } from "react";

export interface Review {
  id: string;
  productId: number;
  productName: string;
  user: {
    uid: string;
    displayName: string;
    photoURL?: string;
  };
  rating: number;
  comment: string;
  date: string;
  status: 'approved';
  images?: string[];
  orderId?: string;
}

export interface ProductVariant {
  name: string;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  category: string;
  images: string[];
  reviews: Review[];
  stock: number;
  sold: number;
  details?: string;
  freeShipping?: boolean;
  returnPolicy?: number;
  isFlashSale?: boolean;
  flashSaleEndDate?: string;
  flashSaleDiscount?: number;
  hasOffer?: boolean;
  createdAt: string;
  colors: ProductVariant[];
  sizes: ProductVariant[];
}

export interface CartItem {
  cartItemId: string; // Unique ID for this specific cart entry
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  stock: number;
  quantity: number;
  freeShipping?: boolean;
  category: string;
  color?: string;
  size?: string;
}

export interface OrderItem {
    id: number;
    name: string;
    price: number;
    originalPrice: number;
    quantity: number;
    image: string;
    returnPolicy: number;
    color?: string;
    size?: string;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    shippingAddress: ShippingAddress;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'return-requested' | 'return-approved' | 'return-shipped' | 'return-denied';
    date: string; // ISO string
    orderNumber: string;
    paymentMethod: string;
    transactionId?: string;
    shippingFee: number;
    voucherCode?: string;
    voucherDiscount?: number;
    paymentAccountNumber?: string;
    cashOnDeliveryFee?: number;
    deliveredAt?: string;
}

export interface Voucher {
    id?: string;
    code: string;
    discount: number;
    type: 'fixed' | 'percentage';
    description: string;
    minSpend?: number;
    discountType?: 'order' | 'shipping';
    isReturnVoucher?: boolean;
    collectedDate?: string;
    createdAt?: string;
    usageLimit?: number;
}

export interface Offer {
    id: string;
    name: string;
    discount: number;
    startDate: string;
    endDate: string;
}

export interface Notification {
    id: string;
    icon: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    href?: string;
}

export interface ModeratorPermissions {
  canManageProducts: boolean;
  canManageUsers: boolean;
  canManageOrders: boolean;
  canVerifyPayments: boolean;
  canManageReturns: boolean;
  canManageOffers: boolean;
  canManageVouchers: boolean;
  canManageDeliverySettings: boolean;
  canManagePaymentSettings: boolean;
  canManageCategorySettings: boolean;
  canManageModeratorSettings: boolean;
  canManageReviews: boolean;
  canManageContactSettings: boolean;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  status: 'active' | 'banned';
  joined: string;
  shippingAddresses?: ShippingAddress[];
  usedVouchers?: { [code: string]: number };
  fcmTokens?: string[];
  role?: 'user' | 'moderator';
  permissions?: ModeratorPermissions;
}

export interface ShippingAddress {
    id: string;
    type: 'Home' | 'Office';
    fullName: string;
    phone: string;
    address: string;
    city: string;
    area: string;
    default: boolean;
}

export interface DeliverySettings {
  insidePabnaSmall: number;
  insidePabnaLarge: number;
  outsidePabnaSmall: number;
  outsidePabnaLarge: number;
  deliveryTimeInside: number;
  deliveryTimeOutside: number;
  returnAddress: string;
  cashOnDeliveryFee: number;
}

export interface PaymentSettings {
  bkashMerchantNumber: string;
  nagadMerchantNumber: string;
  rocketMerchantNumber: string;
  bkashLogo: string;
  nagadLogo: string;
  rocketLogo: string;
}

export interface ContactSettings {
  phone: string;
  email: string;
  address: string;
}

export interface Wishlist {
    userId: string;
    productIds: number[];
}

export interface Category {
  id: string;
  name: string;
  image: string;
  createdAt: string;
}

export interface OrderPayload {
  userId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  shippingFee: number;
  voucherCode?: string;
  paymentMethod: string;
  transactionId?: string;
  paymentAccountNumber?: string;
  cashOnDeliveryFee?: number;
}

    
