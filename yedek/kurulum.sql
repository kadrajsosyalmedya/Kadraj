-- Kadraj'ın Supabase yedeği: Firebase koparsa Kadraj sohbetlere buradan devam eder.
-- Supabase panelinde: SQL Editor › New query › bu dosyanın tamamını yapıştır › Run.
-- Bir kez çalıştırman yeterli; tekrar çalıştırırsan da zarar vermez.

-- haftalık uyandırma işi bunu çağırır (ücretsiz proje 7 gün boşta kalınca uyutulur)
create or replace function public.ping() returns text language sql stable as $$ select 'ok'::text $$;
grant execute on function public.ping() to anon, authenticated;

-- ===== tablolar ve kurallar =====
-- k_user: Kadraj hesabı ↔ Supabase hesabı eşlemesi (kuid = Kadraj/Firebase uid; ilk sahiplenen alır, değişmez).
create table if not exists public.k_user (
  sb uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  kuid text not null unique check (kuid ~ '^[A-Za-z0-9_-]{6,64}$'),
  un text check (un is null or un ~ '^[a-z0-9._]{1,30}$'),
  email text,
  name text not null default '' check (char_length(name) <= 60),
  av text check (av is null or (char_length(av) < 60000 and av like 'data:image/%')),
  child boolean not null default false,
  at timestamptz not null default now()
);
create index if not exists k_user_un_idx on public.k_user (un);

create or replace function public.k_my() returns text
language sql stable security definer set search_path = public as $$
  select kuid from public.k_user where sb = auth.uid();
$$;

create table if not exists public.k_chat (
  cid text primary key check (cid ~ '^[A-Za-z0-9_-]{1,80}$'),
  members text[] not null default '{}' check (cardinality(members) <= 100),
  grp boolean not null default false,
  name text check (name is null or char_length(name) <= 80),
  at timestamptz not null default now()
);
insert into public.k_chat (cid, members, grp, name) values ('meydan', '{}', true, 'Meydan') on conflict (cid) do nothing;

create or replace function public.k_member(c text) returns boolean
language sql stable security definer set search_path = public as $$
  select c = 'meydan' or exists(select 1 from public.k_chat where cid = c and public.k_my() = any(members));
$$;

create table if not exists public.k_msg (
  id bigint generated always as identity primary key,
  cid text not null references public.k_chat(cid) on delete cascade,
  kuid text not null default public.k_my(),
  sb uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null default '' check (char_length(text) <= 2000),
  img text check (img is null or (char_length(img) < 160000 and img like 'data:image/%')),
  at timestamptz not null default now(),
  check (text <> '' or img is not null)
);
create index if not exists k_msg_cid_idx on public.k_msg (cid, id);
create index if not exists k_msg_sb_idx on public.k_msg (sb);

create or replace function public.k_msg_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.k_chat set at = new.at where cid = new.cid;
  return new;
end $$;
drop trigger if exists k_msg_after_insert on public.k_msg;
create trigger k_msg_after_insert after insert on public.k_msg for each row execute function public.k_msg_after_insert();

-- acil girişte kullanıcı adından e-postayı bulur (Kadraj'daki unames gibi)
create or replace function public.k_mail(u text) returns text
language sql stable security definer set search_path = public as $$
  select email from public.k_user where un = lower(trim(u)) limit 1;
$$;

alter table public.k_user enable row level security;
alter table public.k_chat enable row level security;
alter table public.k_msg enable row level security;

-- e-posta sütunu başkalarına görünmez
revoke all on public.k_user from anon, authenticated;
grant select (sb, kuid, un, name, av, child, at) on public.k_user to authenticated;
grant insert (kuid, un, email, name, av, child) on public.k_user to authenticated;
grant update (un, email, name, av, child, at) on public.k_user to authenticated;
drop policy if exists ku_sel on public.k_user; create policy ku_sel on public.k_user for select to authenticated using (true);
drop policy if exists ku_ins on public.k_user; create policy ku_ins on public.k_user for insert to authenticated with check (sb = auth.uid());
drop policy if exists ku_upd on public.k_user; create policy ku_upd on public.k_user for update to authenticated using (sb = auth.uid()) with check (sb = auth.uid());

drop policy if exists kc_sel on public.k_chat; create policy kc_sel on public.k_chat for select to authenticated using (cid = 'meydan' or public.k_my() = any(members));
drop policy if exists kc_ins on public.k_chat; create policy kc_ins on public.k_chat for insert to authenticated with check (cid <> 'meydan' and public.k_my() = any(members));
drop policy if exists kc_upd on public.k_chat; create policy kc_upd on public.k_chat for update to authenticated using (cid <> 'meydan' and public.k_my() = any(members)) with check (public.k_my() = any(members));

drop policy if exists km_sel on public.k_msg; create policy km_sel on public.k_msg for select to authenticated using (public.k_member(cid));
drop policy if exists km_ins on public.k_msg; create policy km_ins on public.k_msg for insert to authenticated with check (sb = auth.uid() and kuid = public.k_my() and public.k_member(cid));
drop policy if exists km_del on public.k_msg; create policy km_del on public.k_msg for delete to authenticated using (sb = auth.uid());

revoke execute on function public.k_mail(text) from public;
grant execute on function public.k_mail(text) to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['k_chat','k_msg'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
