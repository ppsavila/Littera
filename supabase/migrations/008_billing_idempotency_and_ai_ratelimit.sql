-- ============================================================
-- Idempotência do webhook: impede ativar o mesmo pagamento 2x
-- ============================================================

-- Índice único parcial: payment_id deve ser único quando preenchido
create unique index if not exists subscription_payments_payment_id_unique
  on subscription_payments (payment_id)
  where payment_id is not null;


-- ============================================================
-- Rate limit de análise IA: persistido no banco (serverless-safe)
-- ============================================================

-- Colunas na tabela profiles
alter table profiles
  add column if not exists ai_analysis_count      int not null default 0,
  add column if not exists ai_analysis_window_start timestamptz;

-- Função RPC: verifica e incrementa atomicamente
-- Retorna TRUE se a análise pode prosseguir, FALSE se limite atingido
create or replace function check_ai_rate_limit(
  p_user_id    uuid,
  p_max        int,
  p_window_ms  bigint   -- janela em milissegundos
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count      int;
  v_window_start timestamptz;
  v_now        timestamptz := now();
  v_window_end timestamptz;
begin
  -- Lock na linha do usuário para garantir atomicidade
  select ai_analysis_count, ai_analysis_window_start
    into v_count, v_window_start
    from profiles
   where id = p_user_id
     for update;

  v_window_end := v_window_start + (p_window_ms * interval '1 millisecond');

  -- Se a janela expirou ou nunca foi iniciada, reseta o contador
  if v_window_start is null or v_now > v_window_end then
    update profiles
       set ai_analysis_count       = 1,
           ai_analysis_window_start = v_now
     where id = p_user_id;
    return true;
  end if;

  -- Dentro da janela: verifica limite
  if v_count >= p_max then
    return false;
  end if;

  -- Incrementa
  update profiles
     set ai_analysis_count = ai_analysis_count + 1
   where id = p_user_id;

  return true;
end;
$$;
