# Multi-Service Support (Hardcoded)

> **Created:** February 2026
> **Status:** Planned (not started)
> **Effort:** Small-Medium (no DB schema change for initial version)
> **Prerequisite:** None

---

## Goal

Allow drivers to choose from multiple cleaning services when booking (e.g., "Clean Delivery Bag" and "Clean Delivery Car"). Services are hardcoded in `constants.ts` — all cleaning facilities offer the same menu.

---

## Current State

- **One service**: "Clean Delivery Bag" at `€4.50`, defined in `SERVICE_TYPES.standard`
- **Booking form** (`booking-form.tsx:25`): grabs `SERVICE_TYPES.standard` directly, no selection UI
- **`createOrder()`** (`lib/driver/actions.ts:194-204`): hardcodes `PRICING.bagClean` and `service_type: "standard"`
- **DB constraint** (`schema.sql:86`): `CHECK (service_type IN ('standard', 'express', 'deep'))` — legacy values from pre-Sprint 5
- **`getServiceName()`** (`lib/utils.ts:76`): already handles multiple types via `SERVICE_TYPES` lookup + `LEGACY_SERVICE_NAMES` fallback
- **Display pages**: 7 files use `getServiceName(order.service_type)` — these already work with any service type string

---

## Changes Required

### 1. `config/constants.ts` — Add new service(s)

```ts
export const PRICING = {
  bagClean: 4.5,
  carClean: 15.0, // example
  currency: "€",
} as const;

export const SERVICE_TYPES = {
  standard: {
    name: "Clean Delivery Bag",
    duration: "15-20 min",
    description: "Interior and exterior cleaning with sanitization",
    price: PRICING.bagClean,
  },
  car_clean: {
    name: "Clean Delivery Car",
    duration: "30-45 min",
    description: "Interior wipe-down and exterior wash for delivery vehicles",
    price: PRICING.carClean,
  },
} as const;
```

### 2. `booking-form.tsx` — Service picker

Replace the hardcoded `const service = SERVICE_TYPES.standard` with a selectable list:

- Render all entries in `SERVICE_TYPES` as selectable cards (radio-style, highlight selected)
- Default to `standard` (first item)
- Track `selectedServiceType` in state
- Pass `service_type` to `createOrder` via FormData
- Update the "Book & Pay" button and summary to show the selected service's price

### 3. `lib/driver/actions.ts` — `createOrder()`

- Read `service_type` from FormData (default: `"standard"`)
- Look up price from `SERVICE_TYPES[serviceType].price` instead of hardcoding `PRICING.bagClean`
- Pass the selected `service_type` to the DB insert
- Stripe `PaymentIntent` amount uses the looked-up price

### 4. DB migration — Update CHECK constraint

The existing constraint only allows `('standard', 'express', 'deep')`. Need a small migration:

```sql
-- Remove old constraint and add new one
ALTER TABLE orders DROP CONSTRAINT orders_service_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_service_type_check
  CHECK (service_type IN ('standard', 'express', 'deep', 'car_clean'));
```

Alternatively, drop the CHECK entirely and let the app layer validate (simpler for future additions). Legacy values (`express`, `deep`) must remain valid for old orders.

### 5. `lib/utils.ts` — `getServiceName()` + `LEGACY_SERVICE_NAMES`

Already works — `getServiceName()` checks `SERVICE_TYPES` first, falls back to `LEGACY_SERVICE_NAMES`. New service types added to `SERVICE_TYPES` will resolve automatically.

### 6. E2E tests

- Update booking test to verify service picker is visible
- Test selecting a non-default service and completing the booking flow
- Verify order detail and history pages show the correct service name

---

## Files Touched

| File | Change |
|------|--------|
| `src/config/constants.ts` | Add new service type + pricing |
| `src/app/driver/facilities/[id]/booking-form.tsx` | Service picker UI + pass selection to action |
| `src/lib/driver/actions.ts` | Read `service_type` from FormData, dynamic pricing |
| `supabase/migrations/005-*.sql` | Update or drop `service_type` CHECK constraint |
| `e2e/sprint6.spec.ts` | Update/add booking tests |

**No changes needed** for display pages — `getServiceName()` already handles any service type.

---

## Not In Scope (Future)

- **Per-facility services**: Facilities choose which services they offer (requires `facility_services` table)
- **Custom pricing per facility**: Facilities set their own prices (requires DB-stored prices)
- **Service categories/groups**: Organizing services into categories
- **Service images/icons**: Visual differentiation in the picker

These belong to a "Per-Facility Service Management" feature and are a bigger lift.

---

## Adding More Services Later

With this pattern in place, adding another hardcoded service is a 2-step process:

1. Add entry to `PRICING` + `SERVICE_TYPES` in `constants.ts`
2. Add the key to the DB CHECK constraint (or remove it entirely on first migration)

The booking UI, order creation, and display pages will pick it up automatically.
