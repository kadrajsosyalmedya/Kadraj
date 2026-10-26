-- Orbit (Kadraj'ın yedek uygulaması) için Supabase kurulumu.
-- Supabase panelinde: SQL Editor › New query › bu dosyanın tamamını yapıştır › Run.
-- Bir kez çalıştırman yeterli; tekrar çalıştırırsan da zarar vermez.

-- ===== tablolar =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  un text not null unique check (un ~ '^[a-z0-9._]{3,20}$'),
  name text not null check (char_length(name) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 150),
  ph text check (ph is null or (char_length(ph) < 60000 and ph like 'data:image/%')),
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower uuid not null references public.profiles(id) on delete cascade,
  followee uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);

create table if not exists public.stories (
  uid uuid primary key references public.profiles(id) on delete cascade,
  img text not null check (char_length(img) < 160000 and img like 'data:image/%'),
  created_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  members uuid[] not null check (cardinality(members) between 1 and 50),
  is_group boolean not null default false,
  title text check (title is null or char_length(title) <= 60),
  dm_key text unique,
  created_by uuid not null default auth.uid(),
  last jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  chat_id uuid not null references public.chats(id) on delete cascade,
  uid uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text','img','inv')),
  body text not null default '' check (char_length(body) <= 2000),
  img text check (img is null or (char_length(img) < 100000 and img like 'data:image/%')),
  likes uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists messages_chat_idx on public.messages (chat_id, id);

create table if not exists public.seen (
  chat_id uuid not null references public.chats(id) on delete cascade,
  uid uuid not null references public.profiles(id) on delete cascade,
  at timestamptz not null default now(),
  primary key (chat_id, uid)
);

create table if not exists public.games (
  chat_id uuid primary key references public.chats(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.reels (
  id bigint generated always as identity primary key,
  uid uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  url text not null check (url like 'https://res.cloudinary.com/%'),
  caption text not null default '' check (char_length(caption) <= 100),
  likes uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ===== yardımcı fonksiyonlar =====
create or replace function public.is_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.chats where id = cid and auth.uid() = any(members));
$$;

-- yeni mesaj gelince sohbetin son mesajını ve zamanını günceller
create or replace function public.msg_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.chats set last = jsonb_build_object('u', new.uid, 'k', new.kind, 'x', left(new.body, 60), 'at', new.created_at),
    updated_at = new.created_at where id = new.chat_id;
  return new;
end $$;
drop trigger if exists msg_after_insert on public.messages;
create trigger msg_after_insert after insert on public.messages for each row execute function public.msg_after_insert();

-- mesaja / Spark'a kalp (yalnızca kendi kalbini ekler ya da kaldırır)
create or replace function public.toggle_msg_like(mid bigint) returns uuid[]
language plpgsql security definer set search_path = public as $$
declare r uuid[];
begin
  update public.messages set likes = case when auth.uid() = any(likes) then array_remove(likes, auth.uid()) else array_append(likes, auth.uid()) end
    where id = mid and public.is_member(chat_id) returning likes into r;
  return r;
end $$;

create or replace function public.toggle_reel_like(rid bigint) returns uuid[]
language plpgsql security definer set search_path = public as $$
declare r uuid[];
begin
  if auth.uid() is null then return null; end if;
  update public.reels set likes = case when auth.uid() = any(likes) then array_remove(likes, auth.uid()) else array_append(likes, auth.uid()) end
    where id = rid returning likes into r;
  return r;
end $$;

-- gruptan ayrıl
create or replace function public.leave_chat(cid uuid) returns void
language sql security definer set search_path = public as $$
  update public.chats set members = array_remove(members, auth.uid()) where id = cid and is_group and auth.uid() = any(members);
$$;

-- hesabı sil (profil, mesajlar, takipler… hepsi zincirleme silinir)
create or replace function public.delete_me() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then return; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- haftalık uyandırma işi bunu çağırır (proje uyutulmasın diye)
create or replace function public.ping() returns text language sql stable as $$ select 'ok'::text $$;

-- ===== güvenlik kuralları (RLS) =====
alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.stories enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.seen enable row level security;
alter table public.games enable row level security;
alter table public.reels enable row level security;

drop policy if exists p_sel on public.profiles; create policy p_sel on public.profiles for select to authenticated using (true);
drop policy if exists p_ins on public.profiles; create policy p_ins on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists p_upd on public.profiles; create policy p_upd on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists f_sel on public.follows; create policy f_sel on public.follows for select to authenticated using (true);
drop policy if exists f_ins on public.follows; create policy f_ins on public.follows for insert to authenticated with check (follower = auth.uid());
drop policy if exists f_del on public.follows; create policy f_del on public.follows for delete to authenticated using (follower = auth.uid());

drop policy if exists s_sel on public.stories; create policy s_sel on public.stories for select to authenticated using (true);
drop policy if exists s_ins on public.stories; create policy s_ins on public.stories for insert to authenticated with check (uid = auth.uid());
drop policy if exists s_upd on public.stories; create policy s_upd on public.stories for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid());
drop policy if exists s_del on public.stories; create policy s_del on public.stories for delete to authenticated using (uid = auth.uid());

drop policy if exists c_sel on public.chats; create policy c_sel on public.chats for select to authenticated using (auth.uid() = any(members));
drop policy if exists c_ins on public.chats; create policy c_ins on public.chats for insert to authenticated with check (auth.uid() = any(members) and created_by = auth.uid());
drop policy if exists c_upd on public.chats; create policy c_upd on public.chats for update to authenticated using (auth.uid() = any(members)) with check (auth.uid() = any(members));

drop policy if exists m_sel on public.messages; create policy m_sel on public.messages for select to authenticated using (public.is_member(chat_id));
drop policy if exists m_ins on public.messages; create policy m_ins on public.messages for insert to authenticated with check (uid = auth.uid() and public.is_member(chat_id) and likes = '{}');
drop policy if exists m_del on public.messages; create policy m_del on public.messages for delete to authenticated using (uid = auth.uid());

drop policy if exists sn_sel on public.seen; create policy sn_sel on public.seen for select to authenticated using (public.is_member(chat_id));
drop policy if exists sn_ins on public.seen; create policy sn_ins on public.seen for insert to authenticated with check (uid = auth.uid() and public.is_member(chat_id));
drop policy if exists sn_upd on public.seen; create policy sn_upd on public.seen for update to authenticated using (uid = auth.uid()) with check (uid = auth.uid() and public.is_member(chat_id));

drop policy if exists g_sel on public.games; create policy g_sel on public.games for select to authenticated using (public.is_member(chat_id));
drop policy if exists g_ins on public.games; create policy g_ins on public.games for insert to authenticated with check (public.is_member(chat_id));
drop policy if exists g_upd on public.games; create policy g_upd on public.games for update to authenticated using (public.is_member(chat_id)) with check (public.is_member(chat_id));
drop policy if exists g_del on public.games; create policy g_del on public.games for delete to authenticated using (public.is_member(chat_id));

drop policy if exists r_sel on public.reels; create policy r_sel on public.reels for select to authenticated using (true);
drop policy if exists r_ins on public.reels; create policy r_ins on public.reels for insert to authenticated with check (uid = auth.uid() and likes = '{}');
drop policy if exists r_del on public.reels; create policy r_del on public.reels for delete to authenticated using (uid = auth.uid());

revoke execute on function public.delete_me() from public, anon;
revoke execute on function public.leave_chat(uuid) from public, anon;
revoke execute on function public.toggle_msg_like(bigint) from public, anon;
revoke execute on function public.toggle_reel_like(bigint) from public, anon;
grant execute on function public.delete_me(), public.leave_chat(uuid), public.toggle_msg_like(bigint), public.toggle_reel_like(bigint) to authenticated;
grant execute on function public.ping() to anon, authenticated;

-- ===== canlı güncellemeler (Realtime) =====
alter table public.follows replica identity full;
alter table public.stories replica identity full;
do $$
declare t text;
begin
  foreach t in array array['profiles','follows','stories','chats','messages','seen','games','reels'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- =====================================================================
-- ===== Kadraj acil modu (Firebase koparsa Kadraj buraya geçer) =====
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
