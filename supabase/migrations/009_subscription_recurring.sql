-- ID da assinatura recorrente no Abacate.pay
-- Necessário para acionar o cancelamento via API
alter table profiles
  add column if not exists abacate_subscription_id text;

-- Tipo de renovação do pagamento (útil para histórico)
-- 'initial' = primeira cobrança, 'renewal' = renovação automática, 'manual' = one-time
alter table subscription_payments
  add column if not exists payment_type text
    check (payment_type in ('initial', 'renewal', 'manual'))
    not null default 'manual';
