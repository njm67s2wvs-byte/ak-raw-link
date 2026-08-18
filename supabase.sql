-- =========================================================
-- VidoCall Database
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- PROFILES
-- =========================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    username text unique,
    display_name text not null default '',
    age integer not null check (age >= 18 and age <= 100),

    gender text not null
        check (gender in ('male', 'female')),

    country text not null default '',

    avatar_url text,

    verified boolean not null default false,
    online boolean not null default false,

    is_creator boolean not null default false,
    is_banned boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =========================================================
-- WALLETS
-- =========================================================

create table if not exists public.wallets (
    user_id uuid primary key references public.profiles(id) on delete cascade,

    coins bigint not null default 120 check (coins >= 0),

    earnings_coins bigint not null default 0
        check (earnings_coins >= 0),

    lifetime_coins_earned bigint not null default 0
        check (lifetime_coins_earned >= 0),

    lifetime_coins_spent bigint not null default 0
        check (lifetime_coins_spent >= 0),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =========================================================
-- FRIEND REQUESTS
-- =========================================================

create table if not exists public.friend_requests (
    id uuid primary key default gen_random_uuid(),

    sender_id uuid not null
        references public.profiles(id)
        on delete cascade,

    receiver_id uuid not null
        references public.profiles(id)
        on delete cascade,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'accepted',
                'rejected',
                'cancelled'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique(sender_id, receiver_id),

    check(sender_id <> receiver_id)
);

-- =========================================================
-- MESSAGES
-- =========================================================

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),

    sender_id uuid not null
        references public.profiles(id)
        on delete cascade,

    receiver_id uuid not null
        references public.profiles(id)
        on delete cascade,

    message_type text not null default 'text'
        check (
            message_type in (
                'text',
                'image',
                'audio'
            )
        ),

    text_content text,

    file_url text,

    duration_seconds integer,

    created_at timestamptz not null default now(),

    read_at timestamptz
);

-- =========================================================
-- CALLS
-- =========================================================

create table if not exists public.calls (
    id uuid primary key default gen_random_uuid(),

    caller_id uuid not null
        references public.profiles(id)
        on delete cascade,

    receiver_id uuid not null
        references public.profiles(id)
        on delete cascade,

    call_type text not null
        check (
            call_type in (
                'public',
                'private'
            )
        ),

    room_name text unique not null,

    started_at timestamptz,
    ended_at timestamptz,

    duration_seconds integer not null default 0,

    coins_per_minute integer not null,

    coins_charged bigint not null default 0,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'ringing',
                'active',
                'completed',
                'rejected',
                'cancelled'
            )
        ),

    created_at timestamptz not null default now()
);

-- =========================================================
-- GIFTS
-- =========================================================

create table if not exists public.gifts (
    id uuid primary key default gen_random_uuid(),

    sender_id uuid not null
        references public.profiles(id)
        on delete cascade,

    receiver_id uuid not null
        references public.profiles(id)
        on delete cascade,

    call_id uuid
        references public.calls(id)
        on delete set null,

    gift_id text not null,

    gift_name text not null,

    emoji text,

    coins bigint not null
        check (coins > 0),

    created_at timestamptz not null default now()
);

-- =========================================================
-- COIN TRANSACTIONS
-- =========================================================

create table if not exists public.coin_transactions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    type text not null
        check (
            type in (
                'signup_bonus',
                'purchase',
                'admin_add',
                'call',
                'gift',
                'refund',
                'adjustment'
            )
        ),

    amount bigint not null,

    balance_after bigint,

    reference_id text,

    description text,

    created_at timestamptz not null default now()
);

-- =========================================================
-- PAYMENTS
-- =========================================================

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    package_id text not null,

    coins bigint not null,

    amount numeric(12,2) not null,

    currency text not null default 'USD',

    payment_method text,

    provider text,

    provider_payment_id text,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'paid',
                'failed',
                'cancelled',
                'refunded'
            )
        ),

    created_at timestamptz not null default now(),

    paid_at timestamptz
);

-- =========================================================
-- CREATOR EARNINGS
-- =========================================================

create table if not exists public.creator_earnings (
    id uuid primary key default gen_random_uuid(),

    creator_id uuid not null
        references public.profiles(id)
        on delete cascade,

    source_type text not null
        check (
            source_type in (
                'public_call',
                'private_call',
                'gift'
            )
        ),

    source_id uuid,

    gross_coins bigint not null default 0,

    platform_coins bigint not null default 0,

    creator_coins bigint not null default 0,

    status text not null default 'available'
        check (
            status in (
                'pending',
                'available',
                'withdrawn',
                'cancelled'
            )
        ),

    created_at timestamptz not null default now()
);

-- =========================================================
-- WITHDRAWALS
-- =========================================================

create table if not exists public.withdrawals (
    id uuid primary key default gen_random_uuid(),

    creator_id uuid not null
        references public.profiles(id)
        on delete cascade,

    earnings_coins bigint not null
        check (earnings_coins > 0),

    amount numeric(12,2),

    currency text default 'USD',

    method text not null,

    account_details jsonb,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'approved',
                'processing',
                'paid',
                'rejected',
                'cancelled'
            )
        ),

    admin_note text,

    created_at timestamptz not null default now(),

    processed_at timestamptz
);

-- =========================================================
-- VERIFICATION
-- =========================================================

create table if not exists public.verifications (
    id uuid primary key default gen_random_uuid(),

    user_id uuid unique not null
        references public.profiles(id)
        on delete cascade,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'approved',
                'rejected'
            )
        ),

    verification_type text not null default 'face',

    provider text,

    provider_reference text,

    submitted_at timestamptz not null default now(),

    reviewed_at timestamptz,

    reviewer_note text
);

-- =========================================================
-- REPORTS
-- =========================================================

create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),

    reporter_id uuid not null
        references public.profiles(id)
        on delete cascade,

    reported_user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    reason text not null,

    details text,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'reviewed',
                'resolved',
                'dismissed'
            )
        ),

    created_at timestamptz not null default now()
);

-- =========================================================
-- BLOCKS
-- =========================================================

create table if not exists public.blocks (
    id uuid primary key default gen_random_uuid(),

    blocker_id uuid not null
        references public.profiles(id)
        on delete cascade,

    blocked_id uuid not null
        references public.profiles(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    unique(blocker_id, blocked_id),

    check(blocker_id <> blocked_id)
);

-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists idx_profiles_country
on public.profiles(country);

create index if not exists idx_profiles_gender
on public.profiles(gender);

create index if not exists idx_profiles_online
on public.profiles(online);

create index if not exists idx_profiles_verified
on public.profiles(verified);

create index if not exists idx_messages_sender
on public.messages(sender_id);

create index if not exists idx_messages_receiver
on public.messages(receiver_id);

create index if not exists idx_messages_created
on public.messages(created_at desc);

create index if not exists idx_calls_caller
on public.calls(caller_id);

create index if not exists idx_calls_receiver
on public.calls(receiver_id);

create index if not exists idx_transactions_user
on public.coin_transactions(user_id);

create index if not exists idx_earnings_creator
on public.creator_earnings(creator_id);

create index if not exists idx_withdrawals_creator
on public.withdrawals(creator_id);

-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists profiles_updated_at
on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at();

drop trigger if exists wallets_updated_at
on public.wallets;

create trigger wallets_updated_at
before update on public.wallets
for each row
execute function public.update_updated_at();

drop trigger if exists friend_requests_updated_at
on public.friend_requests;

create trigger friend_requests_updated_at
before update on public.friend_requests
for each row
execute function public.update_updated_at();

-- =========================================================
-- NEW USER FUNCTION
-- =========================================================

create or replace function public.create_new_user(
    user_id uuid,
    user_name text,
    user_age integer,
    user_gender text,
    user_country text,
    user_avatar text default null
)
returns void
language plpgsql
security definer
as $$
begin

    if user_age < 18 then
        raise exception 'User must be 18 or older';
    end if;

    insert into public.profiles (
        id,
        username,
        display_name,
        age,
        gender,
        country,
        avatar_url
    )
    values (
        user_id,
        user_name,
        user_name,
        user_age,
        user_gender,
        user_country,
        user_avatar
    )
    on conflict (id)
    do update set
        username = excluded.username,
        display_name = excluded.display_name,
        age = excluded.age,
        gender = excluded.gender,
        country = excluded.country,
        avatar_url = excluded.avatar_url;

    insert into public.wallets (
        user_id,
        coins
    )
    values (
        user_id,
        120
    )
    on conflict (user_id)
    do nothing;

    insert into public.coin_transactions (
        user_id,
        type,
        amount,
        balance_after,
        description
    )
    values (
        user_id,
        'signup_bonus',
        120,
        120,
        'New account welcome bonus'
    )
    on conflict do nothing;

end;
$$;

-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.friend_requests enable row level security;
alter table public.messages enable row level security;
alter table public.calls enable row level security;
alter table public.gifts enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.payments enable row level security;
alter table public.creator_earnings enable row level security;
alter table public.withdrawals enable row level security;
alter table public.verifications enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

-- =========================================================
-- PROFILE POLICIES
-- =========================================================

drop policy if exists profiles_select_authenticated
on public.profiles;

create policy profiles_select_authenticated
on public.profiles
for select
to authenticated
using (
    is_banned = false
);

drop policy if exists profiles_update_own
on public.profiles;

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (
    auth.uid() = id
)
with check (
    auth.uid() = id
    and age >= 18
);

-- =========================================================
-- WALLET POLICIES
-- =========================================================

drop policy if exists wallet_select_own
on public.wallets;

create policy wallet_select_own
on public.wallets
for select
to authenticated
using (
    auth.uid() = user_id
);

-- =========================================================
-- MESSAGE POLICIES
-- =========================================================

drop policy if exists messages_select_participants
on public.messages;

create policy messages_select_participants
on public.messages
for select
to authenticated
using (
    auth.uid() = sender_id
    or
    auth.uid() = receiver_id
);

drop policy if exists messages_insert_sender
on public.messages;

create policy messages_insert_sender
on public.messages
for insert
to authenticated
with check (
    auth.uid() = sender_id
);

-- =========================================================
-- FRIEND REQUEST POLICIES
-- =========================================================

drop policy if exists requests_select_participants
on public.friend_requests;

create policy requests_select_participants
on public.friend_requests
for select
to authenticated
using (
    auth.uid() = sender_id
    or
    auth.uid() = receiver_id
);

drop policy if exists requests_insert_sender
on public.friend_requests;

create policy requests_insert_sender
on public.friend_requests
for insert
to authenticated
with check (
    auth.uid() = sender_id
);

-- =========================================================
-- CALL POLICIES
-- =========================================================

drop policy if exists calls_select_participants
on public.calls;

create policy calls_select_participants
on public.calls
for select
to authenticated
using (
    auth.uid() = caller_id
    or
    auth.uid() = receiver_id
);

-- =========================================================
-- BLOCK POLICIES
-- =========================================================

drop policy if exists blocks_select_own
on public.blocks;

create policy blocks_select_own
on public.blocks
for select
to authenticated
using (
    auth.uid() = blocker_id
);

drop policy if exists blocks_insert_own
on public.blocks;

create policy blocks_insert_own
on public.blocks
for insert
to authenticated
with check (
    auth.uid() = blocker_id
);

-- =========================================================
-- REALTIME
-- =========================================================

alter publication supabase_realtime
add table public.messages;

alter publication supabase_realtime
add table public.friend_requests;

alter publication supabase_realtime
add table public.calls;

alter publication supabase_realtime
add table public.profiles;

-- =========================================================
-- DONE
-- =========================================================
