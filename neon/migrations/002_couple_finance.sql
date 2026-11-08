-- Neon Postgres migration; converted from Supabase schema. Media storage excluded: private photos need a different implementation.
-- Casa Nexo: finanças do casal (opção B) — proposta de migration.
-- Aplicar DEPOIS de 202611070001_shared_house_foundation.sql.
-- A aplicação ainda não executa estes fluxos; validar migration + RLS antes de merge.

-- 1. Um livro financeiro compartilhado por Casa e um pessoal por morador.
create table public.finance_ledgers (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references public.houses(id) on delete cascade,
  scope text not null check (scope in ('shared', 'personal')),
  owner_user_id uuid,
  name text not null check (length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  constraint finance_ledger_scope_owner check (
    (scope = 'shared' and owner_user_id is null)
    or (scope = 'personal' and owner_user_id is not null)
  ),
  foreign key (house_id, owner_user_id)
    references public.house_members(house_id, user_id),
  unique (house_id, id)
);
create unique index one_shared_finance_ledger_per_house
  on public.finance_ledgers(house_id) where scope = 'shared';
create unique index one_personal_finance_ledger_per_member
  on public.finance_ledgers(house_id, owner_user_id) where scope = 'personal';

create or replace function private.can_access_finance_ledger(p_house_id uuid, p_ledger_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.finance_ledgers l
    where l.house_id = p_house_id and l.id = p_ledger_id
      and private.is_house_member(l.house_id)
      and (l.scope = 'shared' or l.owner_user_id = (select auth.uid()))
  );
$$;
grant execute on function private.can_access_finance_ledger(uuid, uuid) to authenticated;

-- Impede tornar dados compartilhados privados, ou vice-versa, trocando o livro.
create or replace function private.finance_ledger_immutable_scope()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.house_id is distinct from old.house_id
    or new.scope is distinct from old.scope
    or new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'Não é permitido mudar a Casa, titular ou visibilidade de um livro';
  end if;
  return new;
end;
$$;
create trigger finance_ledger_immutable_scope
  before update on public.finance_ledgers
  for each row execute function private.finance_ledger_immutable_scope();

-- 2. Contas e categorias são sempre de um livro específico.
create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  ledger_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 100),
  kind text not null check (kind in ('income', 'expense')),
  created_at timestamptz not null default now(),
  foreign key (house_id, ledger_id)
    references public.finance_ledgers(house_id, id) on delete cascade,
  unique (house_id, ledger_id, id),
  unique (ledger_id, kind, name)
);

create table public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  ledger_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 100),
  kind text not null check (kind in ('bank', 'cash', 'credit_card', 'investment', 'loan', 'other')),
  initial_balance_cents bigint not null default 0,
  closing_day integer check (closing_day between 1 and 31),
  due_day integer check (due_day between 1 and 31),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  check (kind = 'credit_card' or (closing_day is null and due_day is null)),
  foreign key (house_id, ledger_id)
    references public.finance_ledgers(house_id, id) on delete cascade,
  unique (house_id, ledger_id, id)
);

-- 3. Parcelamentos como planos; cada parcela gerará um lançamento vinculado.
create table public.finance_installment_plans (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  ledger_id uuid not null,
  account_id uuid,
  description text not null check (length(trim(description)) between 1 and 200),
  total_cents bigint not null check (total_cents > 0),
  installment_count integer not null check (installment_count between 1 and 360),
  first_due_on date not null,
  created_by uuid not null references neon_auth."user"(id) default auth.uid(),
  created_at timestamptz not null default now(),
  foreign key (house_id, ledger_id)
    references public.finance_ledgers(house_id, id) on delete cascade,
  foreign key (house_id, ledger_id, account_id)
    references public.finance_accounts(house_id, ledger_id, id),
  unique (house_id, ledger_id, id)
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  ledger_id uuid not null,
  account_id uuid,
  destination_account_id uuid,
  category_id uuid,
  installment_plan_id uuid,
  installment_number integer check (installment_number > 0),
  purchase_id uuid, -- vínculo opcional com compra compartilhada da Casa
  kind text not null check (kind in ('income', 'expense', 'transfer')),
  status text not null default 'planned' check (status in ('planned', 'posted', 'cancelled')),
  description text not null check (length(trim(description)) between 1 and 200),
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null default current_date,
  due_on date,
  paid_on date,
  paid_by uuid, -- quem pagou despesa compartilhada
  receipt_path text, -- bucket 'household-media' se shared; 'finance-private' se personal
  notes text,
  created_by uuid not null references neon_auth."user"(id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (
    (installment_plan_id is null and installment_number is null)
    or (installment_plan_id is not null and installment_number is not null)
  ),
  check (
    (kind = 'transfer' and account_id is not null
     and destination_account_id is not null and account_id <> destination_account_id)
    or (kind <> 'transfer' and destination_account_id is null)
  ),
  foreign key (house_id, ledger_id)
    references public.finance_ledgers(house_id, id) on delete cascade,
  foreign key (house_id, ledger_id, account_id)
    references public.finance_accounts(house_id, ledger_id, id),
  foreign key (house_id, ledger_id, destination_account_id)
    references public.finance_accounts(house_id, ledger_id, id),
  foreign key (house_id, ledger_id, category_id)
    references public.finance_categories(house_id, ledger_id, id),
  foreign key (house_id, ledger_id, installment_plan_id)
    references public.finance_installment_plans(house_id, ledger_id, id),
  foreign key (house_id, purchase_id)
    references public.purchases(house_id, id),
  foreign key (house_id, paid_by)
    references public.house_members(house_id, user_id),
  unique (house_id, ledger_id, id),
  unique (installment_plan_id, installment_number)
);
create index finance_transactions_ledger_due_idx
  on public.finance_transactions(ledger_id, due_on) where status = 'planned';
create index finance_transactions_ledger_occurred_idx
  on public.finance_transactions(ledger_id, occurred_on desc);
create unique index one_finance_transaction_per_house_purchase
  on public.finance_transactions(purchase_id) where purchase_id is not null;

-- 4. Compromissos recorrentes, orçamentos mensais e objetivos.
create table public.finance_recurring_rules (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  ledger_id uuid not null,
  account_id uuid,
  category_id uuid,
  description text not null check (length(trim(description)) between 1 and 200),
  kind text not null check (kind in ('income', 'expense')),
  amount_cents bigint not null check (amount_cents > 0),
  interval_months integer not null default 1 check (interval_months between 1 and 12),
  next_due_on date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (house_id, ledger_id)
    references public.finance_ledgers(house_id, id) on delete cascade,
  foreign key (house_id, ledger_id, account_id)
    references public.finance_accounts(house_id, ledger_id, id),
  foreign key (house_id, ledger_id, category_id)
    references public.finance_categories(house_id, ledger_id, id)
);

create table public.finance_budget_limits (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  ledger_id uuid not null,
  category_id uuid, -- null = orçamento geral do livro
  month_start date not null check (extract(day from month_start) = 1),
  limit_cents bigint not null check (limit_cents >= 0),
  created_at timestamptz not null default now(),
  foreign key (house_id, ledger_id)
    references public.finance_ledgers(house_id, id) on delete cascade,
  foreign key (house_id, ledger_id, category_id)
    references public.finance_categories(house_id, ledger_id, id)
);
create unique index finance_budget_category_unique
  on public.finance_budget_limits(ledger_id, category_id, month_start)
  where category_id is not null;
create unique index finance_budget_overall_unique
  on public.finance_budget_limits(ledger_id, month_start)
  where category_id is null;

create table public.finance_goals (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  ledger_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 100),
  target_cents bigint not null check (target_cents > 0),
  current_cents bigint not null default 0 check (current_cents >= 0),
  target_on date,
  created_at timestamptz not null default now(),
  foreign key (house_id, ledger_id)
    references public.finance_ledgers(house_id, id) on delete cascade
);

-- 5. Quem é responsável por cada parte de uma despesa compartilhada?
create table public.finance_expense_splits (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  ledger_id uuid not null,
  transaction_id uuid not null,
  member_user_id uuid not null,
  share_cents bigint not null check (share_cents >= 0),
  created_at timestamptz not null default now(),
  foreign key (house_id, ledger_id, transaction_id)
    references public.finance_transactions(house_id, ledger_id, id) on delete cascade,
  foreign key (house_id, member_user_id)
    references public.house_members(house_id, user_id),
  unique (transaction_id, member_user_id)
);

create table public.finance_settlements (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null,
  ledger_id uuid not null,
  from_user_id uuid not null,
  to_user_id uuid not null,
  amount_cents bigint not null check (amount_cents > 0),
  settled_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id),
  foreign key (house_id, ledger_id)
    references public.finance_ledgers(house_id, id) on delete cascade,
  foreign key (house_id, from_user_id)
    references public.house_members(house_id, user_id),
  foreign key (house_id, to_user_id)
    references public.house_members(house_id, user_id)
);

-- Confirma que rateios são só de despesas da Casa; acertos também só nela.
create or replace function private.finance_shared_only_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'finance_expense_splits' then
    if not exists(
      select 1 from public.finance_transactions t
      join public.finance_ledgers l on (l.house_id = t.house_id and l.id = t.ledger_id)
      where t.house_id = new.house_id and t.ledger_id = new.ledger_id
        and t.id = new.transaction_id and t.kind = 'expense' and l.scope = 'shared'
    ) then
      raise exception 'Rateio só é permitido em despesas da Casa';
    end if;
  elsif tg_table_name = 'finance_settlements' then
    if not exists(
      select 1 from public.finance_ledgers l
      where l.house_id = new.house_id and l.id = new.ledger_id and l.scope = 'shared'
    ) then
      raise exception 'Acerto só é permitido em finanças compartilhadas';
    end if;
  end if;
  return new;
end;
$$;
create trigger finance_shared_only_splits
  before insert or update on public.finance_expense_splits
  for each row execute function private.finance_shared_only_guard();
create trigger finance_shared_only_settlements
  before insert or update on public.finance_settlements
  for each row execute function private.finance_shared_only_guard();

-- Imutabilidade de vínculos e autoria; pagamentos/datas/valores podem ser editados por
-- quem tenha permissão. Audit trail completo de edições ainda é requisito de produção.
create or replace function private.finance_immutable_parent()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.house_id is distinct from new.house_id
     or old.ledger_id is distinct from new.ledger_id then
    raise exception 'Não é permitido transferir registro entre livros ou Casas';
  end if;
  return new;
end;
$$;
do $$
declare t text;
begin
  foreach t in array array[
    'finance_categories', 'finance_accounts', 'finance_installment_plans',
    'finance_transactions', 'finance_recurring_rules', 'finance_budget_limits',
    'finance_goals', 'finance_expense_splits', 'finance_settlements'
  ] loop
    execute format(
      'create trigger finance_immutable_parent before update on public.%I
       for each row execute function private.finance_immutable_parent()', t
    );
  end loop;
end $$;

-- Impede falsificação do autor e vínculos equivocados a comprovantes pessoais.
create or replace function private.finance_transaction_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_scope text; v_owner uuid;
begin
  select scope, owner_user_id into v_scope, v_owner
  from public.finance_ledgers where house_id = new.house_id and id = new.ledger_id;
  if v_scope is null then raise exception 'Livro financeiro inválido'; end if;
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  elsif old.created_by is distinct from new.created_by then
    raise exception 'Não é permitido alterar a autoria';
  end if;
  if new.created_by is null then raise exception 'Entre na conta'; end if;

  if new.purchase_id is not null and (v_scope <> 'shared' or new.kind <> 'expense') then
    raise exception 'Compra da Casa deve vincular-se a despesa compartilhada';
  end if;
  if new.receipt_path is not null then
    if v_scope = 'personal' and left(new.receipt_path, length(v_owner::text || '/' || new.house_id::text || '/'))
      <> v_owner::text || '/' || new.house_id::text || '/' then
      raise exception 'Comprovante pessoal deve usar pasta privada do titular';
    elsif v_scope = 'shared' and left(new.receipt_path, length(new.house_id::text || '/'))
      <> new.house_id::text || '/' then
      raise exception 'Comprovante compartilhado deve usar pasta da Casa';
    end if;
  end if;
  return new;
end;
$$;
create trigger finance_transaction_guard
  before insert or update on public.finance_transactions
  for each row execute function private.finance_transaction_guard();

-- 6. RLS: proprietário da Casa NÃO tem acesso a livro pessoal do outro.
alter table public.finance_ledgers enable row level security;
create policy finance_ledgers_select on public.finance_ledgers
  for select to authenticated
  using (private.is_house_member(house_id)
    and (scope = 'shared' or owner_user_id = (select auth.uid())));
create policy finance_ledgers_insert on public.finance_ledgers
  for insert to authenticated
  with check (private.is_house_member(house_id)
    and ((scope = 'shared' and owner_user_id is null)
      or (scope = 'personal' and owner_user_id = (select auth.uid()))));
create policy finance_ledgers_update on public.finance_ledgers
  for update to authenticated
  using (private.is_house_member(house_id)
    and (scope = 'shared' or owner_user_id = (select auth.uid())))
  with check (private.is_house_member(house_id)
    and (scope = 'shared' or owner_user_id = (select auth.uid())));
create policy finance_ledgers_delete on public.finance_ledgers
  for delete to authenticated
  using (private.is_house_member(house_id) and
    ((scope = 'shared' and private.is_house_owner(house_id))
      or (scope = 'personal' and owner_user_id = (select auth.uid()))));

do $$
declare t text;
begin
  foreach t in array array[
    'finance_categories', 'finance_accounts', 'finance_installment_plans',
    'finance_transactions', 'finance_recurring_rules', 'finance_budget_limits',
    'finance_goals', 'finance_expense_splits', 'finance_settlements'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated
      using (private.can_access_finance_ledger(house_id, ledger_id))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated
      with check (private.can_access_finance_ledger(house_id, ledger_id))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated
      using (private.can_access_finance_ledger(house_id, ledger_id))
      with check (private.can_access_finance_ledger(house_id, ledger_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated
      using (private.can_access_finance_ledger(house_id, ledger_id))', t || '_delete', t);
  end loop;
end $$;

-- Autores e permissões de inserção dos planos parcelados.
create or replace function private.finance_installment_creator_guard()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  elsif new.created_by is distinct from old.created_by then
    raise exception 'Não é permitido alterar o criador';
  end if;
  if new.created_by is null then raise exception 'Entre na conta'; end if;
  return new;
end;
$$;
create trigger finance_installment_creator_guard
  before insert or update on public.finance_installment_plans
  for each row execute function private.finance_installment_creator_guard();

grant select, insert, update, delete on public.finance_ledgers,
  public.finance_categories, public.finance_accounts,
  public.finance_installment_plans, public.finance_transactions,
  public.finance_recurring_rules, public.finance_budget_limits,
  public.finance_goals, public.finance_expense_splits,
  public.finance_settlements to authenticated;

-- A geração automática de parcelas, divisões que totalizam o gasto e sincronização
-- compra+estoque+lançamento exigem RPCs transacionais + testes antes do lançamento.
-- Sem tais RPCs, as linhas representam o modelo, NÃO um financeiro pronto para uso.
