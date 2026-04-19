-- Add subscription fields to profiles
alter table profiles
  add column if not exists subscription_plan text
    check (subscription_plan in ('free', 'plus', 'premium'))
    not null default 'free',
  add column if not exists subscription_status text
    check (subscription_status in ('active', 'inactive', 'cancelled'))
    not null default 'active',
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists daily_corrections_count int not null default 0,
  add column if not exists daily_corrections_reset_date date;

-- Payment history
create table if not exists subscription_payments (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references profiles(id) on delete cascade not null,
  plan            text check (plan in ('plus', 'premium')) not null,
  amount          numeric(10,2) not null,
  currency        text not null default 'BRL',
  status          text check (status in ('pending', 'paid', 'failed', 'refunded')) not null default 'pending',
  payment_id      text,  -- Abacate.pay payment ID
  checkout_id     text,  -- Abacate.pay checkout ID
  metadata        jsonb,
  created_at      timestamptz default now(),
  paid_at         timestamptz
);

alter table subscription_payments enable row level security;
create policy "Users view own payments"
  on subscription_payments for select using (auth.uid() = user_id);

create index subscription_payments_user_idx on subscription_payments(user_id);
create index profiles_subscription_plan_idx on profiles(subscription_plan);
