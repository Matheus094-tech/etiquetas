-- Casa Nexo: fundação compartilhada (Supabase/PostgreSQL)
-- Aplicar no SQL Editor do projeto Supabase, apenas depois de configurar o ambiente.
-- Não executar na Netlify nem no navegador. Não contém dados pessoais nem credenciais.

create schema if not exists private;

create table public.houses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.house_members (
  house_id uuid not null references public.houses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (house_id, user_id)
);

-- SECURITY DEFINER evita recursão nas políticas de house_members.
create or replace function private.is_house_member(p_house_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1 from public.house_members m
    where m.house_id = p_house_id and m.user_id = (select auth.uid())
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
  );
$$;

-- Quem cria a Casa recebe automaticamente a associação como proprietário.
create or replace function private.add_house_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.house_members(house_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;
create trigger add_house_owner after insert on public.houses
for each row execute function private.add_house_owner();

create table public.storage_locations (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  parent_id uuid,
  name text not null check (length(trim(name)) between 1 and 100),
  kind text not null default 'armario'
    check (kind in ('ambiente','armario','prateleira','gaveta','geladeira','freezer','despensa','outro')),
  created_at timestamptz not null default now(),
  unique (house_id, id),
  foreign key (house_id, parent_id)
    references public.storage_locations(house_id, id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 200),
  brand text,
  barcode text,
  category text,
  package_description text, -- Ex.: 'frasco de 1,5 L'; quantidades são de embalagens
  reorder_at numeric(12,3) not null default 0 check (reorder_at >= 0),
  photo_path text, -- somente caminho privado no bucket, nunca URL pública
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (house_id, id)
);
create index products_house_name_idx on public.products(house_id, name);
create index products_house_barcode_idx on public.products(house_id, barcode) where barcode is not null;

create table public.stock_lots (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  product_id uuid not null,
  location_id uuid,
  quantity numeric(12,3) not null default 0 check (quantity >= 0),
  expires_on date,
  purchased_on date,
  unit_cost_cents bigint check (unit_cost_cents >= 0),
  created_at timestamptz not null default now(),
  unique (house_id, id),
  foreign key (house_id, product_id) references public.products(house_id, id) on delete cascade,
  foreign key (house_id, location_id) references public.storage_locations(house_id, id) on delete set null (location_id)
);
create index stock_lots_product_idx on public.stock_lots(house_id, product_id);
create index stock_lots_expiry_idx on public.stock_lots(house_id, expires_on) where expires_on is not null;

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  lot_id uuid not null,
  delta numeric(12,3) not null check (delta <> 0),
  reason text not null check (reason in ('compra','consumo','ajuste','descarte','transferencia')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (house_id, lot_id) references public.stock_lots(house_id, id) on delete cascade
);
create index stock_movements_house_created_idx on public.stock_movements(house_id, created_at desc);

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (house_id, id)
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  list_id uuid not null,
  product_id uuid,
  name text not null check (length(trim(name)) between 1 and 200),
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit text not null default 'un',
  checked boolean not null default false,
  notes text,
  added_by uuid references auth.users(id),
  checked_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (house_id, list_id) references public.shopping_lists(house_id, id) on delete cascade,
  foreign key (house_id, product_id) references public.products(house_id, id)
);
create index shopping_items_list_idx on public.shopping_items(house_id, list_id, checked);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  store text,
  purchased_at timestamptz not null default now(),
  total_cents bigint not null check (total_cents >= 0),
  paid_by uuid references auth.users(id),
  category text not null default 'supermercado',
  payment_method text,
  receipt_path text,
  notes text,
  created_at timestamptz not null default now(),
  unique (house_id, id)
);
create index purchases_house_date_idx on public.purchases(house_id, purchased_at desc);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  purchase_id uuid not null,
  product_id uuid,
  description text not null check (length(trim(description)) between 1 and 200),
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  amount_cents bigint not null check (amount_cents >= 0),
  foreign key (house_id, purchase_id) references public.purchases(house_id, id) on delete cascade,
  foreign key (house_id, product_id) references public.products(house_id, id)
);

-- Convites de uso único: o token é devolvido apenas no instante da criação,
-- sua impressão digital fica no banco; não expor esta tabela diretamente pela API.
create table public.house_invites (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.create_house_invite(p_house_id uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_token text;
begin
  if (select auth.uid()) is null or not private.is_house_owner(p_house_id) then
    raise exception 'Apenas o responsável pela Casa pode criar convites';
  end if;
  v_token := gen_random_uuid()::text || gen_random_uuid()::text;
  insert into public.house_invites(house_id, token_hash, created_by, expires_at)
  values (
    p_house_id,
    encode(sha256(convert_to(v_token, 'UTF8')), 'hex'),
    (select auth.uid()),
    now() + interval '48 hours'
  );
  return v_token;
end;
$$;

create or replace function public.redeem_house_invite(p_token text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_invite_id uuid; v_house_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'É preciso entrar na conta';
  end if;
  select id, house_id into v_invite_id, v_house_id
  from public.house_invites
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and redeemed_by is null and expires_at > now()
  for update;
  if v_invite_id is null then
    raise exception 'Convite inválido ou expirado';
  end if;
  insert into public.house_members(house_id, user_id, role)
  values (v_house_id, (select auth.uid()), 'member')
  on conflict (house_id, user_id) do nothing;
  update public.house_invites
  set redeemed_by = (select auth.uid()), redeemed_at = now()
  where id = v_invite_id;
  return v_house_id;
end;
$$;

-- Movimentos atômicos: impede estoque negativo e alterações perdidas por concorrência.
create or replace function public.change_stock(
  p_lot_id uuid, p_delta numeric, p_reason text
)
returns numeric language plpgsql security definer set search_path = ''
as $$
declare v_house_id uuid; v_quantity numeric;
begin
  if (select auth.uid()) is null or p_delta is null or p_delta = 0
     or p_reason not in ('compra','consumo','ajuste','descarte','transferencia') then
    raise exception 'Movimento inválido';
  end if;
  select house_id, quantity into v_house_id, v_quantity
  from public.stock_lots where id = p_lot_id for update;
  if v_house_id is null or not private.is_house_member(v_house_id) then
    raise exception 'Estoque não encontrado';
  end if;
  if v_quantity + p_delta < 0 then
    raise exception 'Estoque insuficiente';
  end if;
  update public.stock_lots set quantity = quantity + p_delta where id = p_lot_id
  returning quantity into v_quantity;
  insert into public.stock_movements(house_id, lot_id, delta, reason, created_by)
  values (v_house_id, p_lot_id, p_delta, p_reason, (select auth.uid()));
  return v_quantity;
end;
$$;

-- RLS: todos os registros pertencem a uma Casa, inclusive as referências cruzadas.
alter table public.houses enable row level security;
alter table public.house_members enable row level security;
alter table public.storage_locations enable row level security;
alter table public.products enable row level security;
alter table public.stock_lots enable row level security;
alter table public.stock_movements enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.house_invites enable row level security;

create policy houses_select on public.houses for select to authenticated
  using (private.is_house_member(id));
create policy houses_insert on public.houses for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy houses_update on public.houses for update to authenticated
  using (private.is_house_owner(id)) with check (private.is_house_owner(id));
create policy houses_delete on public.houses for delete to authenticated
  using (private.is_house_owner(id));
create policy members_select on public.house_members for select to authenticated
  using (private.is_house_member(house_id));
-- Membership writes only through the owner trigger or redeem_house_invite RPC.

-- Usuários autenticados só leem e alteram registros de suas Casas.
do $$
declare t text;
begin
  foreach t in array array[
    'storage_locations', 'products', 'shopping_lists', 'shopping_items',
    'purchases', 'purchase_items'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (private.is_house_member(house_id))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.is_house_member(house_id))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (private.is_house_member(house_id)) with check (private.is_house_member(house_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (private.is_house_member(house_id))', t || '_delete', t);
  end loop;
end $$;

create policy stock_lots_select on public.stock_lots for select to authenticated
  using (private.is_house_member(house_id));
create policy stock_lots_insert on public.stock_lots for insert to authenticated
  with check (private.is_house_member(house_id) and quantity = 0);
create policy stock_lots_delete on public.stock_lots for delete to authenticated
  using (private.is_house_member(house_id) and quantity = 0);
-- Quantidade alterada exclusivamente pela RPC change_stock.
create policy stock_movements_select on public.stock_movements for select to authenticated
  using (private.is_house_member(house_id));

-- Convites não possuem SELECT/INSERT/UPDATE direto para authenticated; só RPCs.
revoke all on public.house_invites from anon, authenticated;
revoke all on function public.create_house_invite(uuid) from public, anon;
revoke all on function public.redeem_house_invite(text) from public, anon;
revoke all on function public.change_stock(uuid,numeric,text) from public, anon;
grant execute on function public.create_house_invite(uuid) to authenticated;
grant execute on function public.redeem_house_invite(text) to authenticated;
grant execute on function public.change_stock(uuid,numeric,text) to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_house_member(uuid) to authenticated;
grant execute on function private.is_house_owner(uuid) to authenticated;

-- Fotos de produtos e recibos: bucket privado com prefixo <house_id>/...
insert into storage.buckets(id, name, public)
values ('household-media', 'household-media', false)
on conflict (id) do nothing;

create or replace function private.can_access_house_media(p_path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1 from public.house_members m
    where m.user_id = (select auth.uid())
      and m.house_id::text = split_part(p_path, '/', 1)
  );
$$;
grant execute on function private.can_access_house_media(text) to authenticated;
create policy media_select on storage.objects for select to authenticated
  using (bucket_id = 'household-media' and private.can_access_house_media(name));
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'household-media' and private.can_access_house_media(name));
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'household-media' and private.can_access_house_media(name))
  with check (bucket_id = 'household-media' and private.can_access_house_media(name));
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'household-media' and private.can_access_house_media(name));
