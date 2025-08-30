
import type { Product } from '@/types';

export const products: Product[] = [
  {
    id: 2,
    name: 'Wireless Bluetooth Headphones',
    description:
      'Experience immersive sound with these high-fidelity wireless headphones. With up to 20 hours of battery life and a comfortable over-ear design, they are perfect for music lovers.',
    price: 100,
    originalPrice: 130,
    rating: 4.8,
    category: 'Electronics',
    stock: 0,
    sold: 150,
    images: [
      'https://picsum.photos/seed/headphones1/600/600',
      'https://picsum.photos/seed/headphones2/600/600',
    ],
    reviews: [],
    details: 'Bluetooth 5.0, Active Noise Cancellation, 20-Hour Battery Life, Built-in Microphone, Foldable Design.',
    freeShipping: true,
    shippingTime: '2-3',
    returnPolicy: 30
  },
  {
    id: 4,
    name: 'Organic Green Tea',
    description:
      'A refreshing and healthy blend of organic green tea leaves. Sourced from the finest gardens, this tea offers a smooth and delicate flavor.',
    price: 16,
    rating: 4.9,
    category: 'Groceries',
    stock: 25,
    sold: 300,
    images: [
        'https://picsum.photos/seed/tea1/600/600',
    ],
    reviews: [],
    details: '100% Organic, Non-GMO, 50 Tea Bags, Sourced from Japan, Rich in Antioxidants.',
    freeShipping: true,
    shippingTime: '1-2',
    returnPolicy: 15
  },
  {
    id: 5,
    name: 'Men\'s Running Shoes',
    description:
      'Achieve your best performance with these lightweight and comfortable running shoes. Designed for maximum support and durability, they are perfect for your daily run.',
    price: 120,
    rating: 4.7,
    category: 'Men\'s Fashion',
    stock: 8,
    sold: 120,
    images: [
      'https://picsum.photos/seed/shoes1/600/600',
      'https://picsum.photos/seed/shoes2/600/600',
      'https://picsum.photos/seed/shoes3/600/600',
    ],
    reviews: [],
    details: 'Breathable Mesh Upper, Cushioned Midsole, Durable Rubber Outsole, Lightweight Design.',
    freeShipping: false,
    shippingTime: '3-5',
    returnPolicy: 30
  },
  {
    id: 6,
    name: 'Smart Home Hub',
    description:
      'Control all your smart devices from one central hub. Compatible with Alexa, Google Assistant, and Apple HomeKit, it simplifies your smart home experience.',
    price: 90,
    originalPrice: 110,
    rating: 4.4,
    category: 'Electronics',
    stock: 12,
    sold: 80,
    images: [
      'https://picsum.photos/seed/hub1/600/600',
    ],
    reviews: [],
    details: 'Wi-Fi and Bluetooth Connectivity, Voice Control, Supports over 1000+ devices, Easy Setup.',
    freeShipping: true,
    shippingTime: '2-3',
    returnPolicy: 30
  },
  {
    id: 7,
    name: 'Gourmet Coffee Beans',
    description:
      'Start your day with the rich and aromatic flavor of these gourmet coffee beans. Sourced from Colombia, they offer a smooth and balanced taste.',
    price: 23,
    rating: 4.9,
    category: 'Groceries',
    stock: 0,
    sold: 500,
    images: [
      'https://picsum.photos/seed/coffee1/600/600',
    ],
    reviews: [],
    details: '100% Arabica Beans, Medium Roast, 12 oz Bag, Sourced from Colombia, Whole Bean.',
    freeShipping: true,
    shippingTime: '1-2',
    returnPolicy: 0
  },
  {
    id: 9,
    name: 'Gaming Laptop',
    description:
      'High-performance gaming laptop with the latest graphics card and a high-refresh-rate display for a smooth gaming experience.',
    price: 1500,
    rating: 4.9,
    category: 'Mobile & Computers',
    stock: 10,
    sold: 25,
    images: [
      'https://picsum.photos/seed/laptop1/600/600',
      'https://picsum.photos/seed/laptop2/600/600',
    ],
    reviews: [],
    details: '15.6" 144Hz Display, NVIDIA GeForce RTX 4060, Intel Core i7, 16GB DDR5 RAM, 1TB NVMe SSD.',
    freeShipping: true,
    shippingTime: '2-4',
    returnPolicy: 30
  },
  {
    id: 13,
    name: 'Luxury Foundation',
    description:
      'A lightweight, full-coverage foundation that leaves a natural, radiant finish. Formulated with skin-loving ingredients to improve your complexion over time.',
    price: 55,
    originalPrice: 65,
    rating: 4.8,
    category: 'Cosmetics',
    stock: 15,
    sold: 90,
    images: [
      'https://picsum.photos/seed/foundation1/600/600',
    ],
    reviews: [],
    details: '30ml / 1.0 fl oz, Available in 20 shades, SPF 15, Paraben-free, Cruelty-free.',
    freeShipping: true,
    shippingTime: '2-3',
    returnPolicy: 30
  },
   {
    id: 14,
    name: 'Women\'s Summer Dress',
    description:
      'Stay cool and stylish in this beautiful floral summer dress. Made from breathable cotton, it\'s perfect for warm weather and casual outings.',
    price: 75,
    rating: 4.6,
    category: 'Women\'s Fashion',
    stock: 20,
    sold: 75,
    images: [
      'https://picsum.photos/seed/dress1/600/600',
      'https://picsum.photos/seed/dress2/600/600'
    ],
    reviews: [],
    details: '100% Cotton, Floral Print, A-Line Silhouette, Midi Length, Available in S, M, L, XL.',
    freeShipping: true,
    shippingTime: '3-5',
    returnPolicy: 30
  }
];
