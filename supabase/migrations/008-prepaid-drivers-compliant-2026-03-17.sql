-- Mark 9 prepaid PROSOT drivers as compliant (cleaned 2026-03-17)
-- Source: "Make them prepaid for Cleanbag (March 17th)" CSV
-- These drivers were prepaid by PROSOT and cleaned their bags today.
-- Since the system doesn't support prepaid flows, this is a manual update.
-- The DB trigger `check_driver_compliance` will auto-set compliance_status.

UPDATE drivers
SET
  last_cleaning_date = '2026-03-17',
  total_cleanings = total_cleanings + 1
WHERE id IN (
  '0e7bcff0-830e-416a-824d-596db546c594',  -- Malik Abdullah
  'f641fb75-65ad-4778-a2ff-41196f2cd445',  -- Usman zaka
  'fea991e2-6376-4821-97a3-99b38fc6ced1',  -- Abrar Hussain
  'dfcecc46-4083-4436-acc3-ab7d03d6a263',  -- ALI HAIDER
  '8139c10f-0040-425d-a564-2720554eb3cb',  -- Amandeep singh
  '02a83ff1-6cd1-4d1d-8320-7d121d2e7222',  -- Husnain Qaisar
  '96f3153e-d723-4f2e-aeed-1aa2f7a6d0ec',  -- Irtaza Nasir
  '47e11958-f333-4301-8b79-22277f29d0ef',  -- Muhammad Huzaifa
  'a8a2a1b7-5a3d-4861-9d78-46eea9340724'   -- Muhammad Rehman
);
