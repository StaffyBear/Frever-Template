-- ============================================================
-- Frever Platform - Authentication and preferences
-- Migration: 002
--
-- Run this file after 001_frever_core_schema.sql.
-- It registers the clean template as a valid Frever app so its
-- user settings can be stored in frever_app_settings.
-- ============================================================

begin;

insert into public.frever_apps (
  app_code,
  app_name,
  description,
  is_active,
  sort_order
)
values (
  'template',
  'Frever Template',
  'Reusable Frever application template and authentication test app.',
  true,
  0
)
on conflict (app_code) do update
set
  app_name = excluded.app_name,
  description = excluded.description,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

commit;

-- Verification results: this should return one row.
select app_code, app_name, is_active
from public.frever_apps
where app_code = 'template';
