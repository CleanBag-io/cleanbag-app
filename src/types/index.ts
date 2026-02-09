import type { Role, ServiceType, OrderStatus, City } from "@/config/constants";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  agency_id: string | null;
  vehicle_type: "motorcycle" | "car" | "bicycle" | null;
  license_plate: string | null;
  platforms: string[];
  city: City;
  last_cleaning_date: string | null;
  total_cleanings: number;
  compliance_status: "compliant" | "warning" | "overdue";
  created_at: string;
}

export interface Facility {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: City;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  operating_hours: Record<string, { open: string; close: string }> | null;
  services: ServiceOption[];
  rating: number;
  total_orders: number;
  commission_rate: number;
  stripe_account_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ServiceOption {
  type: ServiceType;
  price: number;
  duration: number;
}

export interface Agency {
  id: string;
  user_id: string;
  name: string;
  city: City;
  total_drivers: number;
  compliance_target: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  driver_id: string;
  facility_id: string;
  service_type: ServiceType;
  status: OrderStatus;
  base_price: number;
  commission_amount: number;
  total_price: number;
  payment_status: "pending" | "paid" | "refunded";
  stripe_payment_intent_id: string | null;
  scheduled_at: string | null;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  order_id: string;
  facility_id: string;
  type: "order_payment" | "commission" | "payout";
  amount: number;
  status: "pending" | "completed" | "failed";
  stripe_transfer_id: string | null;
  created_at: string;
}

export interface AgencyRequest {
  id: string;
  agency_id: string;
  driver_id: string;
  initiated_by: "driver" | "agency";
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message: string | null;
  responded_at: string | null;
  created_at: string;
  // Joined fields (for display)
  agency?: Agency;
  driver?: Driver & { profile?: Profile };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "order" | "compliance" | "payment" | "system" | null;
  read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}
