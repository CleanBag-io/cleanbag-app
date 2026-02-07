export const APP_CONFIG = {
  name: "CleanBag",
  version: "1.0.0",
  description: "Food delivery bag cleaning marketplace for Cyprus",
} as const;

export const PRICING = {
  bagClean: 4.5,
  currency: "€",
} as const;

export const COMMISSION_RATES = {
  default: 0.471,
} as const;

export const SERVICE_TYPES = {
  standard: {
    name: "Clean Delivery Bag",
    duration: "15-20 min",
    description: "Interior and exterior cleaning with sanitization",
    price: PRICING.bagClean,
  },
} as const;

export type ServiceType = keyof typeof SERVICE_TYPES;

export const ORDER_STATUSES = {
  pending: {
    label: "Pending",
    color: "warning",
  },
  accepted: {
    label: "Accepted",
    color: "info",
  },
  in_progress: {
    label: "In Progress",
    color: "info",
  },
  completed: {
    label: "Completed",
    color: "success",
  },
  cancelled: {
    label: "Cancelled",
    color: "inactive",
  },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

export const COMPLIANCE_THRESHOLDS = {
  compliant: 7,
  warning: 14,
  overdue: 15,
} as const;

export const CITIES = [
  "Nicosia",
  "Limassol",
  "Larnaca",
  "Paphos",
  "Famagusta",
] as const;

export type City = (typeof CITIES)[number];

export const ROLES = ["driver", "facility", "agency", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const MAP_CONFIG = {
  defaultCenter: {
    lat: 35.1856,
    lng: 33.3823,
  },
  defaultZoom: 10,
} as const;
