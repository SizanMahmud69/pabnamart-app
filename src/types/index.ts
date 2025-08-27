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
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
}
