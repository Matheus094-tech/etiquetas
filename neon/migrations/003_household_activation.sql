-- Ativação de moradores por código temporário (sem e-mail real).
-- IMPORTANTE: os códigos e suas impressões digitais são provisionados separadamente
-- pela administração e NUNCA devem ser gravados neste repositório.
create table if not exists private.household_activation (
  username text primary key check (username in ('matheus','stephany')),
  house_id uuid not null references public.houses(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  claimed_by uuid unique references neon_auth."user"(id),
  claimed_at timestamptz,
  check ((claimed_by is null and claimed_at is null) or (claimed_by is not null and claimed_at is not null))
);

-- Só retorna TRUE se o código exato está vigente e ainda não foi utilizado.
-- A tabela fica fora do schema público e nunca é consultável pela API.
create or replace function public.check_household_activation(p_username text, p_code text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.household_activation a
    where a.username = lower(trim(p_username))
      and a.token_hash = encode(sha256(convert_to(p_code,'UTF8')),'hex')
      and a.claimed_by is null
      and a.expires_at > now()
  );
$$;

-- Ao ativar a conta pelo Neon Auth, valida titularidade do código
-- e associa SOMENTE o usuário que de fato possui o JWT assinado.
create or replace function public.claim_household_activation(p_username text, p_code text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_activation private.household_activation%rowtype;
  v_user_id uuid;
  v_email text;
  v_expected_email text;
  v_role text;
  v_name text;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Entre na conta antes de ativar';
  end if;

  select * into v_activation
  from private.household_activation a
  where a.username = lower(trim(p_username))
    and a.token_hash = encode(sha256(convert_to(p_code,'UTF8')),'hex')
    and a.claimed_by is null
    and a.expires_at > now()
  for update;
  if not found then raise exception 'Código inválido, utilizado ou expirado'; end if;

  v_expected_email := v_activation.username || '.setup.' ||
    substr(v_activation.token_hash, 1, 24) || '@users.casa-nexo.example';
  select lower(u.email) into v_email from neon_auth."user" u where u.id = v_user_id;
  if v_email is distinct from v_expected_email then
    raise exception 'Este código não pertence à conta autenticada';
  end if;

  v_role := case when v_activation.username = 'matheus' then 'owner' else 'member' end;
  v_name := case when v_activation.username = 'matheus'
    then 'Minhas Finanças — Matheus' else 'Minhas Finanças — Stephany' end;

  insert into public.house_members(house_id,user_id,role)
  values (v_activation.house_id, v_user_id, v_role)
  on conflict (house_id,user_id) do nothing;

  insert into public.finance_ledgers(house_id,scope,owner_user_id,name)
  values (v_activation.house_id,'personal',v_user_id,v_name)
  on conflict do nothing;

  update private.household_activation
  set claimed_by = v_user_id, claimed_at = now()
  where username = v_activation.username;

  return v_activation.house_id;
end;
$$;

-- Depois da ativação, o nome de usuário resolve para o e-mail técnico
-- necessário ao Neon Auth. Não expõe dados pessoais nem o código.
create or replace function public.household_login_email(p_username text)
returns text language sql stable security definer set search_path = ''
as $$
  select u.email
  from private.household_activation a
  join neon_auth."user" u on u.id = a.claimed_by
  where a.username = lower(trim(p_username)) and a.claimed_at is not null
  limit 1;
$$;

revoke all on function public.check_household_activation(text,text) from public;
revoke all on function public.claim_household_activation(text,text) from public;
revoke all on function public.household_login_email(text) from public;
grant execute on function public.check_household_activation(text,text) to anonymous, authenticated;
grant execute on function public.claim_household_activation(text,text) to authenticated;
grant execute on function public.household_login_email(text) to anonymous, authenticated;
