create extension if not exists "uuid-ossp";

-- =========================
-- USERS
-- =========================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text,
    full_name text,
    avatar_url text,
    age integer,
    gender text,
    country text,
    verified boolean default false,
    online boolean default false,
    coins bigint default 120,
    earning_coins bigint default 0,
    created_at timestamptz default now()
);


-- =========================
-- FRIEND REQUESTS
-- =========================

create table if not exists public.friend_requests (
    id uuid primary key default uuid_generate_v4(),
    sender_id uuid references public.profiles(id) on delete cascade,
    receiver_id uuid references public.profiles(id) on delete cascade,
    status text default 'pending',
    created_at timestamptz default now()
);


-- =========================
-- MESSAGES
-- =========================

create table if not exists public.messages (
    id uuid primary key default uuid_generate_v4(),
    sender_id uuid references public.profiles(id) on delete cascade,
    receiver_id uuid references public.profiles(id) on delete cascade,
    message_type text default 'text',
    message text,
    media_url text,
    created_at timestamptz default now()
);


-- =========================
-- VIDEO CALLS
-- =========================

create table if not exists public.video_calls (
    id uuid primary key default uuid_generate_v4(),
    caller_id uuid references public.profiles(id) on delete cascade,
    receiver_id uuid references public.profiles(id) on delete cascade,
    call_type text default 'public',
    rate_per_minute integer default 20,
    started_at timestamptz,
    ended_at timestamptz,
    duration_seconds integer default 0,
    coins_charged bigint default 0,
    status text default 'pending',
    created_at timestamptz default now()
);


-- =========================
-- GIFTS
-- =========================

create table if not exists public.gifts (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    icon text,
    price_coins integer not null,
    created_at timestamptz default now()
);


-- =========================
-- SENT GIFTS
-- =========================

create table if not exists public.sent_gifts (
    id uuid primary key default uuid_generate_v4(),
    sender_id uuid references public.profiles(id) on delete cascade,
    receiver_id uuid references public.profiles(id) on delete cascade,
    gift_id uuid references public.gifts(id),
    coins bigint not null,
    created_at timestamptz default now()
);


-- =========================
-- COIN PACKAGES
-- =========================

create table if not exists public.coin_packages (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    coins bigint not null,
    price_usd numeric(10,2) not null,
    active boolean default true,
    created_at timestamptz default now()
);


-- =========================
-- PAYMENTS
-- =========================

create table if not exists public.payments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade,
    package_id uuid references public.coin_packages(id),
    amount numeric(10,2),
    currency text default 'USD',
    payment_method text,
    payment_status text default 'pending',
    transaction_id text,
    created_at timestamptz default now()
);


-- =========================
-- WITHDRAWALS
-- =========================

create table if not exists public.withdrawals (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade,
    amount_coins bigint not null,
    amount_money numeric(10,2),
    currency text default 'USD',
    method text,
    account_details text,
    status text default 'pending',
    created_at timestamptz default now()
);


-- =========================
-- VERIFICATION
-- =========================

create table if not exists public.verifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade,
    verification_type text default 'face',
    status text default 'pending',
    verified_at timestamptz,
    created_at timestamptz default now()
);


-- =========================
-- COIN TRANSACTIONS
-- =========================

create table if not exists public.coin_transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade,
    amount bigint not null,
    transaction_type text not null,
    description text,
    reference_id text,
    created_at timestamptz default now()
);


-- =========================
-- DEFAULT GIFTS
-- =========================

insert into public.gifts
(name, icon, price_coins)
select 'وردة', '🌹', 20
where not exists (
    select 1 from public.gifts where name = 'وردة'
);

insert into public.gifts
(name, icon, price_coins)
select 'قلب', '❤️', 50
where not exists (
    select 1 from public.gifts where name = 'قلب'
);

insert into public.gifts
(name, icon, price_coins)
select 'ماسة', '💎', 100
where not exists (
    select 1 from public.gifts where name = 'ماسة'
);

insert into public.gifts
(name, icon, price_coins)
select 'تاج', '👑', 250
where not exists (
    select 1 from public.gifts where name = 'تاج'
);

insert into public.gifts
(name, icon, price_coins)
select 'صاروخ', '🚀', 500
where not exists (
    select 1 from public.gifts where name = 'صاروخ'
);


-- =========================
-- COIN PACKAGES
-- =========================

insert into public.coin_packages
(name, coins, price_usd)
select 'Starter', 500, 2.99
where not exists (
    select 1 from public.coin_packages
    where name = 'Starter'
);

insert into public.coin_packages
(name, coins, price_usd)
select 'Popular', 1200, 6.49
where not exists (
    select 1 from public.coin_packages
    where name = 'Popular'
);

insert into public.coin_packages
(name, coins, price_usd)
select 'Large', 2500, 11.99
where not exists (
    select 1 from public.coin_packages
    where name = 'Large'
);

insert into public.coin_packages
(name, coins, price_usd)
select 'VIP', 6000, 24.99
where not exists (
    select 1 from public.coin_packages
    where name = 'VIP'
);

insert into public.coin_packages
(name, coins, price_usd)
select 'Mega', 15000, 54.99
where not exists (
    select 1 from public.coin_packages
    where name = 'Mega'
);


-- =========================
-- ENABLE RLS
-- =========================

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.messages enable row level security;
alter table public.video_calls enable row level security;
alter table public.gifts enable row level security;
alter table public.sent_gifts enable row level security;
alter table public.coin_packages enable row level security;
alter table public.payments enable row level security;
alter table public.withdrawals enable row level security;
alter table public.verifications enable row level security;
alter table public.coin_transactions enable row level security;


-- =========================
-- PROFILE POLICIES
-- =========================

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- =========================
-- MESSAGES POLICIES
-- =========================

create policy "messages_select_own"
on public.messages
for select
to authenticated
using (
    auth.uid() = sender_id
    or
    auth.uid() = receiver_id
);

create policy "messages_insert_own"
on public.messages
for insert
to authenticated
with check (
    auth.uid() = sender_id
);


-- =========================
-- FRIEND REQUEST POLICIES
-- =========================

create policy "friend_requests_select_own"
on public.friend_requests
for select
to authenticated
using (
    auth.uid() = sender_id
    or
    auth.uid() = receiver_id
);

create policy "friend_requests_insert_own"
on public.friend_requests
for insert
to authenticated
with check (
    auth.uid() = sender_id
);


-- =========================
-- GIFTS
-- =========================

create policy "gifts_public_read"
on public.gifts
for select
to authenticated
using (true);


create policy "coin_packages_public_read"
on public.coin_packages
for select
to authenticated
using (active = true);


-- =========================
-- PROFILE TRIGGER
-- =========================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.profiles (
        id,
        username,
        coins
    )
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'name',
            'User'
        ),
        120
    );

    return new;

end;
$$;


drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created

after insert on auth.users

for each row

execute procedure public.handle_new_user();
