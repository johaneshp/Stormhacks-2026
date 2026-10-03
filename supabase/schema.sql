-- Enable required extensions
create extension if not exists postgis;
create extension if not exists vector;
create extension if not exists "uuid-ossp";

create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique,
  preference_embedding vector(768),
  created_at timestamptz not null default now()
);

create table trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz not null default now()
);

create table checkpoints (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  place_name text,
  location geography(point, 4326),
  lat double precision not null,
  lon double precision not null,
  arrived_at timestamptz,
  left_at timestamptz,
  order_index int not null,
  summary text,
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default uuid_generate_v4(),
  checkpoint_id uuid references checkpoints(id) on delete set null,
  trip_id uuid not null references trips(id) on delete cascade,
  file_url text not null,
  taken_at timestamptz,
  location geography(point, 4326),
  lat double precision,
  lon double precision,
  category text check (category in ('food', 'sightseeing', 'group_photo', 'selfie', 'street_view')),
  created_at timestamptz not null default now()
);

create table trip_stats (
  trip_id uuid primary key references trips(id) on delete cascade,
  travel_dna jsonb not null default '{}'::jsonb,
  core_memories jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Keep `location` in sync with lat/lon so PostGIS distance queries work without
-- the API layer needing to construct geography points itself.
create or replace function sync_checkpoint_location() returns trigger as $$
begin
  new.location := st_setsrid(st_makepoint(new.lon, new.lat), 4326)::geography;
  return new;
end;
$$ language plpgsql;

create trigger checkpoints_sync_location
  before insert or update on checkpoints
  for each row execute function sync_checkpoint_location();

create or replace function sync_photo_location() returns trigger as $$
begin
  if new.lat is not null and new.lon is not null then
    new.location := st_setsrid(st_makepoint(new.lon, new.lat), 4326)::geography;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger photos_sync_location
  before insert or update on photos
  for each row execute function sync_photo_location();

create index trips_user_id_idx on trips(user_id);
create index checkpoints_trip_id_idx on checkpoints(trip_id);
create index checkpoints_location_idx on checkpoints using gist(location);
create index photos_trip_id_idx on photos(trip_id);
create index photos_checkpoint_id_idx on photos(checkpoint_id);
create index photos_location_idx on photos using gist(location);

-- Storage bucket for uploaded photos (id must match PHOTO_BUCKET in backend/app/routers/checkpoints.py)
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do nothing;
