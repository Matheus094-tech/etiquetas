-- Suspende associações de contas técnicas legadas sem apagar os registros.
-- Uma conta inativa não pode consultar Casa, estoque ou livros financeiros.
alter table public.house_members
add column if not exists active boolean not null default true;

create or replace function private.is_house_member(p_house_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1 from public.house_members m
    where m.house_id = p_house_id
      and m.user_id = (select auth.uid())
      and m.active = true
  );
$$;

create or replace function private.is_house_owner(p_house_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1 from public.house_members m
    where m.house_id = p_house_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
      and m.active = true
  );
$$;

-- Somente as quatro contas de testes pré-ativação; conta recém-ativada
-- terá sua própria associação ativa e distinta.
update public.house_members m
set active = false
from neon_auth."user" u
where u.id = m.user_id
  and u.email in (
    'matheus@users.casa-nexo.example',
    'stephany@users.casa-nexo.example',
    'matheus.login@users.casa-nexo.example',
    'stephany.login@users.casa-nexo.example'
  );
