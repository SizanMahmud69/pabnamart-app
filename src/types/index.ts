import type { LucideIcon } from "react";

export interface Review {
  id: string;
  productId: number;
  productName: string;
  user: {
    uid: string;
    displayName: string;
  };
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
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
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  stock: number;
  quantity: number;
  freeShipping?: boolean;
  category: string;
}

export interface OrderItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    returnPolicy: number;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    shippingAddress: ShippingAddress;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    date: string; // ISO string
    orderNumber: string;
    paymentMethod: string;
    transactionId?: string;
    shippingFee: number;
    voucherCode?: string;
    voucherDiscount?: number;
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
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  status: 'active' | 'banned';
  joined: string;
  shippingAddresses?: ShippingAddress[];
  usedVoucherCodes?: string[];
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
}

export interface PaymentSettings {
  bkashMerchantNumber: string;
  nagadMerchantNumber: string;
  rocketMerchantNumber: string;
  bkashLogo: string;
  nagadLogo: string;
  rocketLogo: string;
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
}
