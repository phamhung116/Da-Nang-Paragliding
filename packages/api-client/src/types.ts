export type ServicePackage = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price: string;
  flight_duration_minutes: number;
  included_services: string[];
  participation_requirements: string[];
  min_child_age: number;
  hero_image: string;
  gallery_images: string[];
  launch_site_name: string;
  launch_lat: number;
  launch_lng: number;
  landing_site_name: string;
  landing_lat: number;
  landing_lng: number;
  featured: boolean;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type AvailabilitySlot = {
  time: string;
  capacity: number;
  booked: number;
  is_locked: boolean;
  is_full: boolean;
  temperature_c: number;
  wind_kph: number;
  uv_index: number;
  flight_condition: string;
};

export type AvailabilityDay = {
  id: string;
  service_slug: string;
  date: string;
  temperature_c: number;
  wind_kph: number;
  uv_index: number;
  flight_condition: string;
  slots: AvailabilitySlot[];
};

export type Booking = {
  id: string;
  code: string;
  service_slug: string;
  service_name: string;
  launch_site_name: string;
  flight_date: string;
  flight_time: string;
  customer_name: string;
  phone: string;
  email: string;
  adults: number;
  children: number;
  notes: string | null;
  unit_price: string;
  original_total: string;
  final_total: string;
  payment_method: string;
  payment_status: string;
  approval_status: string;
  rejection_reason: string | null;
  flight_status: string;
  assigned_pilot_name: string | null;
  assigned_pilot_phone: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Account = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  preferred_language: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type AuthSession = {
  token: string;
  expires_at: string;
};

export type AuthResult = {
  account: Account;
  session: AuthSession;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  published: boolean;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PaymentSession = {
  provider_name: string;
  provider_reference: string;
  payment_url: string;
  amount: string;
  deposit_percentage: string;
  transfer_content: string;
  qr_code_url: string;
  expires_at: string;
} | null;

export type PaymentTransaction = {
  id: string;
  booking_code: string;
  method: string;
  status: string;
  amount: string;
  deposit_percentage: number;
  provider_name: string;
  provider_reference: string;
  payment_url: string;
  qr_code_url: string;
  transfer_content: string;
  expires_at: string;
  created_at: string | null;
  updated_at: string | null;
};

export type Tracking = {
  id: string;
  booking_code: string;
  phone: string;
  service_name: string;
  flight_status: string;
  pilot_name: string | null;
  current_location: Record<string, unknown>;
  route_points: Array<Record<string, unknown>>;
  timeline: Array<Record<string, unknown>>;
  created_at: string | null;
  updated_at: string | null;
};

export type PilotFlight = {
  booking: Booking;
  tracking: Tracking | null;
};

export type BookingCreatePayload = {
  service_slug: string;
  flight_date: string;
  flight_time: string;
  customer_name?: string;
  phone?: string;
  email?: string;
  adults: number;
  children: number;
  notes?: string;
  payment_method: string;
};

export type RegisterPayload = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  preferred_language: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UpdateProfilePayload = {
  full_name?: string;
  phone?: string;
  preferred_language?: string;
};

export type ManagedAccountPayload = {
  full_name: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
  preferred_language: string;
  is_active: boolean;
};

export type ServicePackageWritePayload = Omit<ServicePackage, "id" | "created_at" | "updated_at">;
export type PostWritePayload = Omit<Post, "id" | "published_at" | "created_at" | "updated_at">;
