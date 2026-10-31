-- ─────────────────────────────────────────────────────────────────────────────
-- Kharcha Tracker — Family sync schema (Supabase)
--
-- Kaise chalana hai:
--   Supabase Dashboard → SQL Editor → New query → poora paste karo → Run.
-- Script idempotent hai, dobara chalane par kuch bigadta nahi.
-- ─────────────────────────────────────────────────────────────────────────────

-- Family = ek 8-akshar ka join code. Sabhi members ka data isi code ke neeche
-- rehta hai, to ek hi app par alag-alag families ka data aapas me mix nahi hota.
create table if not exists public.kharcha_families (
  code        text   primary key,
  created_at  bigint not null default 0
);

-- Kaun-kaun isi family me hai (naam entry ke saath dikhane ke liye).
create table if not exists public.kharcha_members (
  code         text   not null,
  device_name  text   not null,
  joined_at    bigint not null default 0,
  primary key (code, device_name)
);

-- Ek kharcha = ek row. Month bucket (month_key) wahi hai jo app me use hota hai.
create table if not exists public.kharcha_entries (
  id           text    primary key,
  family_code  text    not null,
  month_key    text    not null,
  day          int     not null,
  name         text    not null,
  cost         numeric not null,
  added_by     text    not null default '',
  updated_at   bigint  not null default 0,
  -- Delete hard nahi karte: ek phone offline delete kare to doosre phone ka
  -- purana copy usse wapas na aa jaye.
  deleted      boolean not null default false
);

-- Delta pull isi index se aata hai: "is family ke rows jo last sync ke baad badle".
create index if not exists kharcha_entries_family_updated
  on public.kharcha_entries (family_code, updated_at);

-- Har phone ki ghadi alag hoti hai, isliye timestamp server ka apna time lagte
-- hain. Sync cursor isi par tikt hai, isse clock skew sync nahi todta.
create or replace function public.kharcha_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := (extract(epoch from now()) * 1000)::bigint;
  return new;
end;
$$;

drop trigger if exists kharcha_entries_touch on public.kharcha_entries;
create trigger kharcha_entries_touch
  before insert or update on public.kharcha_entries
  for each row execute function public.kharcha_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
--
-- App ka anon key public hota hai (APK me ship hota hai), to har request par
-- policy lagta hai: sirf valid lambai ka family code, aur sirf wohi family jiska
-- code kharcha_families me maujood hai. Isse junk/garbage rows nahi ban sakte.
-- Family ka code hi "password" hai — 8 random akshar, guess karna namumkin.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.kharcha_families enable row level security;
alter table public.kharcha_members   enable row level security;
alter table public.kharcha_entries   enable row level security;

drop policy if exists kharcha_families_read   on public.kharcha_families;
drop policy if exists kharcha_families_write  on public.kharcha_families;
drop policy if exists kharcha_members_read    on public.kharcha_members;
drop policy if exists kharcha_members_write   on public.kharcha_members;
drop policy if exists kharcha_entries_read    on public.kharcha_entries;
drop policy if exists kharcha_entries_write   on public.kharcha_entries;
drop policy if exists kharcha_entries_update  on public.kharcha_entries;

create policy kharcha_families_read on public.kharcha_families
  for select to anon
  using (char_length(code) >= 8);

create policy kharcha_families_write on public.kharcha_families
  for insert to anon
  with check (char_length(code) >= 8);

-- Members sirf tab likhe ja sakte hain jab family asli ho.
-- (Column hamesha table-qualified rakha hai: subquery me bina qualification wala
-- naam Postgres inner table `f` par bind kar deta, aur policy hamesha pass ho
-- jaati — yani security gayab.)
create policy kharcha_members_read on public.kharcha_members
  for select to anon
  using (
    char_length(kharcha_members.code) >= 8
    and exists (select 1 from public.kharcha_families f where f.code = kharcha_members.code)
  );

create policy kharcha_members_write on public.kharcha_members
  for insert to anon
  with check (
    char_length(kharcha_members.code) >= 8
    and exists (select 1 from public.kharcha_families f where f.code = kharcha_members.code)
  );

create policy kharcha_members_update on public.kharcha_members
  for update to anon
  using (
    char_length(kharcha_members.code) >= 8
    and exists (select 1 from public.kharcha_families f where f.code = kharcha_members.code)
  )
  with check (
    char_length(kharcha_members.code) >= 8
    and exists (select 1 from public.kharcha_families f where f.code = kharcha_members.code)
  );

create policy kharcha_entries_read on public.kharcha_entries
  for select to anon
  using (
    char_length(kharcha_entries.family_code) >= 8
    and exists (select 1 from public.kharcha_families f where f.code = kharcha_entries.family_code)
  );

create policy kharcha_entries_write on public.kharcha_entries
  for insert to anon
  with check (
    char_length(kharcha_entries.family_code) >= 8
    and exists (select 1 from public.kharcha_families f where f.code = kharcha_entries.family_code)
  );

-- Soft delete isi update se hota hai (deleted = true), client DELETE karta hi nahi.
create policy kharcha_entries_update on public.kharcha_entries
  for update to anon
  using (
    char_length(kharcha_entries.family_code) >= 8
    and exists (select 1 from public.kharcha_families f where f.code = kharcha_entries.family_code)
  )
  with check (
    char_length(kharcha_entries.family_code) >= 8
    and exists (select 1 from public.kharcha_families f where f.code = kharcha_entries.family_code)
  );

-- Supabase naye projects me anon grants ko opt-in bana raha hai, to explicit
-- grant safe rehta hai. (Jo privilege pehle se hai usse dobara grant karne par
-- kuch nahi hota.)
grant select, insert             on public.kharcha_families to anon;
grant select, insert, update     on public.kharcha_members  to anon;
grant select, insert, update     on public.kharcha_entries  to anon;
