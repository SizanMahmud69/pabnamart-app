
import type { LucideIcon } from "react";

export interface Review {
  user: string;
  comment: string;
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
  details?: string;
  freeShipping?: boolean;
  shippingTime?: string;
  returnPolicy?: number;
  isFlashSale?: boolean;
  hasOffer?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
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
    icon: LucideIcon;
    title: string;
    description: string;
    time: string;
    read: boolean;
    href?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  status: 'active' | 'banned';
  joined: string;
  shippingAddresses?: ShippingAddress[];
}

export type OrderStatus = 'pending' | 'shipped' | 'in-transit' | 'delivered' | 'returned' | 'return-requested' | 'processing' | 'return-rejected';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
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

export interface PaymentDetails {
  gateway: string;
  transactionId: string;
  payerNumber: string;
  merchantNumber: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  date: string;
  shippingAddress: Omit<ShippingAddress, 'id' | 'default'>;
  paymentMethod: string;
  paymentDetails?: PaymentDetails;
}
