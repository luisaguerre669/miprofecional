export interface Category {
  id: string;
  title: string;
  image: string;
  professionalCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'client' | 'professional';
  avatar?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
}

export interface Professional {
  id: string;
  userId: string;
  name: string;
  profession: string;
  category: string;
  description: string;
  avatar: string;
  rating: number;
  reviews: number;
  phone: string;
  email: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  services: Service[];
  verified: boolean;
  is24h: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
}

export interface Review {
  id: string;
  professionalId: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  professionalId: string;
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  bookingId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: boolean;
}
