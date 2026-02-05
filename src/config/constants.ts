export const APP_CONFIG = {
  name: "CleanBag",
  version: "1.0.0",
  description: "Food delivery bag cleaning marketplace for Cyprus",
} as const;

export const PRICING = {
  standardClean: 6.5,
  expressClean: 8.5,
  deepClean: 10.0,
  currency: "€",
} as const;

export const COMMISSION_RATES = {
  default: 0.15,
  starter: 0.18,
  growth: 0.15,
  scale: 0.12,
  enterprise: 0.1,
} as const;

export const SERVICE_TYPES = {
  standard: {
    name: "Standard Clean",
    duration: "15-20 min",
    description: "Interior and exterior cleaning with sanitization",
    price: PRICING.standardClean,
  },
  express: {
    name: "Express Clean",
    duration: "10 min",
    description: "Quick clean for time-sensitive deliveries",
    price: PRICING.expressClean,
  },
  deep: {
    name: "Deep Clean",
    duration: "30 min",
    description: "Thorough cleaning with deep sanitization",
    price: PRICING.deepClean,
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
  "Kyrenia",
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
