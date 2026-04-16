-- ============================================
-- GRASS NERDS TRUCK INSPECTION - SUPABASE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This creates all tables, seed data, and row-level security policies.

-- ─── 1. DRIVERS ───
create table public.drivers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  initials text,
  email text,
  pin text, -- optional lightweight auth
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─── 2. TRUCKS ───
create table public.trucks (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  equipment_color text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─── 3. CHECKLIST SECTIONS (Appearance, Functionality, etc.) ───
create table public.checklist_sections (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text, -- emoji or icon name
  sort_order int not null default 0
);

-- ─── 4. CHECKLIST ITEMS (individual yes/no items within sections) ───
create table public.checklist_items (
  id uuid default gen_random_uuid() primary key,
  section_id uuid references public.checklist_sections(id) on delete cascade,
  label text not null,
  item_type text default 'yes_no', -- 'yes_no', 'text', 'number'
  sort_order int not null default 0
);

-- ─── 5. INSPECTIONS (one per form submission) ───
create table public.inspections (
  id uuid default gen_random_uuid() primary key,
  truck_id uuid references public.trucks(id),
  driver_id uuid references public.drivers(id),
  miles text,
  date date default current_date,
  comments text,
  tech_name text,
  signature_data text, -- base64 signature image
  miles_to_oil_change text,
  submitted_at timestamptz default now()
);

-- ─── 6. INSPECTION RESPONSES (one per checklist item per inspection) ───
create table public.inspection_responses (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade,
  checklist_item_id uuid references public.checklist_items(id),
  value text, -- 'yes', 'no', or free text for text/number items
  created_at timestamptz default now()
);

-- ─── 7. ISSUE RESOLUTIONS (tracks when flagged items get resolved) ───
create table public.issue_resolutions (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade,
  checklist_item_id uuid references public.checklist_items(id),
  resolved_by text not null,
  resolution_note text,
  resolved_at timestamptz default now()
);

-- ─── 8. MANAGER SETTINGS (notification emails, etc.) ───
create table public.settings (
  key text primary key,
  value text not null
);

-- ============================================
-- SEED DATA
-- ============================================

-- Manager notification email
insert into public.settings (key, value) values
  ('manager_email', 'ndalpiaz@grassnerds.com');

-- Checklist Sections
insert into public.checklist_sections (name, icon, sort_order) values
  ('Appearance', '✨', 1),
  ('Functionality', '⚙️', 2),
  ('Equipment', '🔧', 3),
  ('Engine & Fluids', '💧', 4),
  ('Outside Safety', '🛡️', 5);

-- Checklist Items - Appearance
insert into public.checklist_items (section_id, label, sort_order)
select id, unnest(ARRAY['Truck Washed', 'Inside Cleaned']),
       unnest(ARRAY[1, 2])
from public.checklist_sections where name = 'Appearance';

-- Checklist Items - Functionality
insert into public.checklist_items (section_id, label, sort_order)
select id, unnest(ARRAY[
  'Heating', 'Cooling', 'Defogging System', 'Window Operation',
  'Handles & Locks', 'Alarm', 'Seat Condition', 'Cabin Lights',
  'Mirror Condition', 'Warning Lights'
]), unnest(ARRAY[1,2,3,4,5,6,7,8,9,10])
from public.checklist_sections where name = 'Functionality';

-- Checklist Items - Equipment
insert into public.checklist_items (section_id, label, sort_order)
select id, unnest(ARRAY[
  'Battery Blower', 'Backpack Sprayer', 'Push Spreader', 'Chest Spreader',
  '2 Gal Sprayers x2', 'Chemical Crate', 'Trip N Pours'
]), unnest(ARRAY[1,2,3,4,5,6,7])
from public.checklist_sections where name = 'Equipment';

-- Checklist Items - Engine & Fluids
insert into public.checklist_items (section_id, label, item_type, sort_order)
select id, unnest(ARRAY[
  'Oil', 'Fuel', 'Washer Fluid', 'Coolant', 'Power Steering',
  'Transmission Fluid', 'Oil Change Done', 'Miles Till Oil Change'
]), unnest(ARRAY[
  'yes_no','yes_no','yes_no','yes_no','yes_no',
  'yes_no','yes_no','text'
]), unnest(ARRAY[1,2,3,4,5,6,7,8])
from public.checklist_sections where name = 'Engine & Fluids';

-- Checklist Items - Outside Safety
insert into public.checklist_items (section_id, label, sort_order)
select id, unnest(ARRAY[
  'Windshield (Free of Damage)', 'Wipers', 'Headlights', 'Brakes',
  'Tail Lights', 'E-Brake', 'Horn', 'Tire Condition', 'Fluid Leaks',
  'Turn Signals', 'Excessive Damage'
]), unnest(ARRAY[1,2,3,4,5,6,7,8,9,10,11])
from public.checklist_sections where name = 'Outside Safety';

-- Trucks
insert into public.trucks (name, equipment_color) values
  ('Bagworm', 'White'),
  ('Anthracnose', 'Blue'),
  ('Nematode', 'Red'),
  ('Whitefly', 'Yellow'),
  ('Web Worm', 'Orange'),
  ('Rust', 'Chrome'),
  ('Shot Hole', 'Camo'),
  ('Phytophthora', 'Green'),
  ('Chinch Bug', 'Starry Galaxy'),
  ('Foxtail', 'Lime/White'),
  ('Spittlebug', 'Grey'),
  ('June Bug', 'Electric Blue'),
  ('Cut Worm', 'Gold'),
  ('Fairy Ring', 'Lime Green'),
  ('Spider Mite', 'Brown'),
  ('Red Thread', 'Pink'),
  ('Kyllinga', 'Beige'),
  ('Shop', 'Black'),
  ('Goosegrass', 'Purple'),
  ('Burnweed', 'Red/White');

-- Drivers
insert into public.drivers (name, initials) values
  ('Austin Holmes', 'AH'),
  ('Brent Chapman', 'BC'),
  ('Brett Ogle', 'BO'),
  ('Cody Snyder', 'CODYS'),
  ('Erik Caudle', 'EC'),
  ('Hovey Herd', 'HH'),
  ('Henson McCurdy', 'HM'),
  ('Hudson Holmes', 'HUD'),
  ('John Carter', 'JC'),
  ('Jarrett Francis', 'JF'),
  ('Kristy Trickett', 'KT'),
  ('Mark Williams', 'MARKW'),
  ('Matt Slater', 'MS'),
  ('Marvin Thomas', 'MT'),
  ('Matt Webber', 'MW'),
  ('Nick Masterson', 'NM'),
  ('Shawn Felder', 'SF'),
  ('Trey Mann', 'TM'),
  ('Wynn Kopp', 'WK');

-- ============================================
-- ROW LEVEL SECURITY (open for now, lock down later)
-- ============================================
alter table public.drivers enable row level security;
alter table public.trucks enable row level security;
alter table public.checklist_sections enable row level security;
alter table public.checklist_items enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_responses enable row level security;
alter table public.issue_resolutions enable row level security;
alter table public.settings enable row level security;

-- Allow public read for form data (drivers, trucks, checklist)
create policy "Public read drivers" on public.drivers for select using (true);
create policy "Public read trucks" on public.trucks for select using (true);
create policy "Public read sections" on public.checklist_sections for select using (true);
create policy "Public read items" on public.checklist_items for select using (true);
create policy "Public read settings" on public.settings for select using (true);

-- Allow public insert for inspections (drivers submitting forms)
create policy "Public insert inspections" on public.inspections for insert with check (true);
create policy "Public read inspections" on public.inspections for select using (true);
create policy "Public insert responses" on public.inspection_responses for insert with check (true);
create policy "Public read responses" on public.inspection_responses for select using (true);

-- Allow public insert/read for resolutions
create policy "Public insert resolutions" on public.issue_resolutions for insert with check (true);
create policy "Public read resolutions" on public.issue_resolutions for select using (true);

-- Allow public manage for admin (we'll tighten this with auth later)
create policy "Public manage drivers" on public.drivers for all using (true);
create policy "Public manage trucks" on public.trucks for all using (true);
create policy "Public manage sections" on public.checklist_sections for all using (true);
create policy "Public manage items" on public.checklist_items for all using (true);
