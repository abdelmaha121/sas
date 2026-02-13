import { BookingStatus } from "@/models/Booking";

// Payment
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentType = 'instant' | 'cash_on_delivery';

// Search
export interface SearchQuery {
  query: string;
  category?: string;
  location?: string;
  minRating?: number;
  maxPrice?: number;
}

export interface SearchResult {
  services: any[];
  providers: any[];
  explanation: string;
}

// Booking
export interface Currency {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceProvider {
  id: string;
  tenant_id: string;
  user_id: string;
  business_name: string;
  business_name_ar?: string;
  description?: string;
  images?: string[];
  logo?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  kyc_documents?: any;
  rating: number;
  total_reviews: number;
  total_bookings: number;
  commission_rate: number;
  is_active: boolean;
  featured: boolean;
  main_activity?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Booking {
  id: string;
  tenant_id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  booking_type: 'one_time' | 'recurring' | 'emergency';
  status: BookingStatus;
  scheduled_at: Date;
  completed_at?: Date;
  total_amount: number;
  commission_amount?: number;
  currency_id?: string;
  payment_status: PaymentStatus;
  payment_type: PaymentType;
  customer_address?: any;
  notes?: string;
  metadata?: any;
  cancellation_reason?: string;
  cancelled_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Service {
  id: string;
  tenant_id: string;
  provider_id: string;
  category_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  base_price: number;
  currency: string;
  currency_id?: string;
  duration_minutes?: number;
  pricing_type: 'fixed' | 'hourly' | 'custom';
  booking_type: 'instant' | 'request' | 'both';
  allow_recurring: boolean;
  allow_urgent: boolean;
  urgent_fee?: number;
  min_advance_hours: number;
  free_cancellation_hours: number;
  cancellation_type: 'percentage' | 'fixed';
  cancellation_value: number;
  is_active: boolean;
  images?: string[];
  availability?: any; // JSON structure for days and time periods
  metadata?: any;
  payment_methods: PaymentType[];
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}
