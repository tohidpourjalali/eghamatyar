export interface Accommodation {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  is_instant_booking: boolean;
  cancellation_policy: string;
  standard_capacity: number;
  max_capacity: number;
  bedrooms_count: number;
  beds_count: number;
  bathrooms_count: number;
  base_price: number;
  cleaning_fee: number;
  extra_guest_fee: number;
  prepayment_percent: number;
  min_nights: number;
  max_nights: number;
  check_in_time: string;
  check_out_time: string;
  allow_pets: boolean;
  allow_parties: boolean;
  smoking_allowed: boolean;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating_avg: number;
  reviews_count: number;
  city?: { id: string; name: string; slug: string };
  type?: { id: string; name: string };
  cover_image?: string;
  images: { id: string; url: string; is_cover: boolean }[];
  amenities: string[];
  host_id: string;
  estimated_total?: number;
  nights?: number;
  discount_percent?: number;
}

export interface Booking {
  id: string;
  booking_code: string;
  status: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  base_amount: number;
  cleaning_fee: number;
  extra_guest_amount: number;
  discount_amount: number;
  commission_amount: number;
  total_amount: number;
  prepayment_amount: number;
  remaining_amount: number;
  paid_amount: number;
  refunded_amount: number;
  prepayment_percent: number;
  cancellation_policy: string;
  units: { id: string; accommodation_id: string; total_amount: number }[];
  snapshot?: any;
}

export interface User {
  id: string;
  mobile: string;
  email?: string;
  role: string;
  is_verified: boolean;
  is_host_approved: boolean;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}
