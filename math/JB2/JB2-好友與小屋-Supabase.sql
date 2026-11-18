-- JB2＋保衛戰 好友／參觀小屋：資料表與安全函式（方案 B：不用帳號、不用密碼）
-- 貼到 Supabase 左側「SQL Editor」→ New query → Run。可重複執行。
--
-- 安全設計（用小學生都懂的說法）：
--  1. 每台裝置（手機／平板／電腦）第一次使用時，自己偷偷產生一串很長的「裝置暗號」，只存在那台裝置裡，學生不用記。
--  2. 學號第一次被某台裝置使用，就跟那台裝置的暗號綁在一起；別的裝置想冒用同一個學號，會被擋下來。
--  3. 想在第二台裝置用同一個學號：在原本的裝置按「新增另一台裝置」拿到 6 位數配對碼（5 分鐘有效），在新裝置輸入即可。
--  4. 資料表全部上鎖（RLS），外面的人只能透過下面這些「有檢查暗號的函式」存取。
--  5. 學生可一鍵刪除自己在雲端的所有資料；超過 60 天沒上線的資料會自動清掉。
--  只有「公開名片」放雲端：學號、勇者名、最後上線時間、好友關係、給好友參觀的小屋擺設。進度、金幣、存檔都只在本機。

-- ===== 資料表 =====
create table if not exists jb2_presence (student_number text primary key, name text, last_seen timestamptz not null default now());
create table if not exists jb2_friends (id bigserial primary key, a text not null, b text not null, status text not null default 'pending', created_at timestamptz not null default now(), unique (a, b));
create index if not exists jb2_friends_b on jb2_friends (b);
create table if not exists jb2_homes (student_number text primary key, name text, eq jsonb, layout jsonb, updated_at timestamptz not null default now());
create table if not exists jb2_settings (key text primary key, value text);
insert into jb2_settings (key, value) values ('friends_enabled', '1'), ('visit_enabled', '1') on conflict (key) do nothing;
create table if not exists jb2_blocked (student_number text primary key, reason text);
create table if not exists jb2_devices (student_number text not null, token_hash text not null, created_at timestamptz not null default now(), primary key (student_number, token_hash));
create table if not exists jb2_pair (student_number text primary key, code text not null, expires_at timestamptz not null, tries int not null default 0);

-- 舊版（沒有檢查暗號）的函式一律刪掉
drop function if exists jb2_ping(text, text);
drop function if exists jb2_friend_list(text);

-- ===== 小工具 =====
create or replace function jb2_hash(t text) returns text language sql immutable as $$
  select encode(sha256(convert_to(coalesce(t, ''), 'utf8')), 'hex')
$$;

create or replace function jb2_flag(k text) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select value <> '0' from jb2_settings where key = k), true)
$$;

-- 檢查：回傳 ok／taken（學號已被別台裝置綁定）／blocked／bad。沒有任何裝置綁定時，第一台自動綁定。
create or replace function jb2_auth(p_sid text, p_token text, p_claim boolean default true) returns text
language plpgsql security definer set search_path = public as $$
declare h text := jb2_hash(p_token); n int;
begin
  if coalesce(length(p_sid), 0) < 1 or length(p_sid) > 20 or coalesce(length(p_token), 0) < 16 then return 'bad'; end if;
  if exists (select 1 from jb2_blocked where student_number = p_sid) then return 'blocked'; end if;
  if exists (select 1 from jb2_devices where student_number = p_sid and token_hash = h) then return 'ok'; end if;
  select count(*) into n from jb2_devices where student_number = p_sid;
  if n = 0 and p_claim then insert into jb2_devices (student_number, token_hash) values (p_sid, h); return 'ok'; end if;
  return 'taken';
end $$;

-- ===== 對外函式（全部要帶學號＋裝置暗號） =====
create or replace function jb2_settings_get() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('friends', jb2_flag('friends_enabled'), 'visit', jb2_flag('visit_enabled'))
$$;

create or replace function jb2_ping(p_sid text, p_name text, p_token text) returns text
language plpgsql security definer set search_path = public as $$
declare s text;
begin
  s := jb2_auth(p_sid, p_token); if s <> 'ok' then return s; end if;
  if not jb2_flag('friends_enabled') then return 'off'; end if;
  insert into jb2_presence (student_number, name, last_seen) values (p_sid, left(coalesce(p_name, p_sid), 12), now())
  on conflict (student_number) do update set name = excluded.name, last_seen = now();
  if random() < 0.02 then   -- 順手清理：60 天沒上線的人與他的好友關係、小屋、裝置綁定
    delete from jb2_presence where last_seen < now() - interval '60 days';
    delete from jb2_homes where updated_at < now() - interval '60 days';
    delete from jb2_devices d where not exists (select 1 from jb2_presence p where p.student_number = d.student_number);
    delete from jb2_friends f where not exists (select 1 from jb2_presence p where p.student_number = f.a) or not exists (select 1 from jb2_presence p where p.student_number = f.b);
    delete from jb2_pair where expires_at < now();
  end if;
  return 'ok';
end $$;

create or replace function jb2_friend_list(p_sid text, p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s text; r jsonb;
begin
  s := jb2_auth(p_sid, p_token); if s <> 'ok' then return jsonb_build_object('status', s, 'friends', '[]'::jsonb); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'friend', case when f.a = p_sid then f.b else f.a end,
      'name', p.name, 'status', f.status,
      'direction', case when f.a = p_sid then 'out' else 'in' end,
      'online', coalesce(now() - p.last_seen < interval '100 seconds', false),
      'secs_ago', extract(epoch from (now() - p.last_seen))::int)), '[]'::jsonb)
    into r
  from jb2_friends f left join jb2_presence p on p.student_number = case when f.a = p_sid then f.b else f.a end
  where f.a = p_sid or f.b = p_sid;
  return jsonb_build_object('status', 'ok', 'friends', r);
end $$;

create or replace function jb2_friend_add(p_sid text, p_token text, p_target text) returns text
language plpgsql security definer set search_path = public as $$
declare s text;
begin
  s := jb2_auth(p_sid, p_token); if s <> 'ok' then return s; end if;
  if not jb2_flag('friends_enabled') then return 'off'; end if;
  if p_target is null or p_target = p_sid then return 'self'; end if;
  if not exists (select 1 from jb2_presence where student_number = p_target) then return 'notfound'; end if;
  if exists (select 1 from jb2_blocked where student_number = p_target) then return 'blocked_target'; end if;
  if exists (select 1 from jb2_friends where (a = p_sid and b = p_target) or (a = p_target and b = p_sid)) then return 'exists'; end if;
  if (select count(*) from jb2_friends where a = p_sid or b = p_sid) >= 60 then return 'full'; end if;
  insert into jb2_friends (a, b, status) values (p_sid, p_target, 'pending');
  return 'ok';
end $$;

-- p_accept = true：同意別人送來的邀請；false：拒絕／取消／刪除好友
create or replace function jb2_friend_respond(p_sid text, p_token text, p_other text, p_accept boolean) returns text
language plpgsql security definer set search_path = public as $$
declare s text;
begin
  s := jb2_auth(p_sid, p_token); if s <> 'ok' then return s; end if;
  if p_accept then update jb2_friends set status = 'ok' where a = p_other and b = p_sid and status = 'pending';
  else delete from jb2_friends where (a = p_sid and b = p_other) or (a = p_other and b = p_sid); end if;
  return 'ok';
end $$;

create or replace function jb2_home_put(p_sid text, p_token text, p_name text, p_eq jsonb, p_layout jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare s text;
begin
  s := jb2_auth(p_sid, p_token); if s <> 'ok' then return s; end if;
  if not jb2_flag('friends_enabled') then return 'off'; end if;
  if length(coalesce(p_layout::text, '')) > 60000 or length(coalesce(p_eq::text, '')) > 2000 then return 'toobig'; end if;
  insert into jb2_homes (student_number, name, eq, layout, updated_at) values (p_sid, left(coalesce(p_name, p_sid), 12), p_eq, p_layout, now())
  on conflict (student_number) do update set name = excluded.name, eq = excluded.eq, layout = excluded.layout, updated_at = now();
  return 'ok';
end $$;

create or replace function jb2_home_get(p_sid text, p_token text, p_target text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s text; h jsonb;
begin
  s := jb2_auth(p_sid, p_token); if s <> 'ok' then return jsonb_build_object('status', s); end if;
  if not jb2_flag('visit_enabled') then return jsonb_build_object('status', 'off'); end if;
  if not exists (select 1 from jb2_friends where status = 'ok' and ((a = p_sid and b = p_target) or (a = p_target and b = p_sid))) then return jsonb_build_object('status', 'notfriend'); end if;
  select jsonb_build_object('student_number', student_number, 'name', name, 'eq', eq, 'layout', layout) into h from jb2_homes where student_number = p_target;
  if h is null then return jsonb_build_object('status', 'nohome'); end if;
  return jsonb_build_object('status', 'ok', 'home', h);
end $$;

-- 一鍵刪除：我在雲端的所有資料（好友關係、小屋、報到、裝置綁定）
create or replace function jb2_delete_me(p_sid text, p_token text) returns text
language plpgsql security definer set search_path = public as $$
declare s text;
begin
  s := jb2_auth(p_sid, p_token, false); if s <> 'ok' then return s; end if;
  delete from jb2_friends where a = p_sid or b = p_sid;
  delete from jb2_homes where student_number = p_sid;
  delete from jb2_presence where student_number = p_sid;
  delete from jb2_pair where student_number = p_sid;
  delete from jb2_devices where student_number = p_sid;
  return 'ok';
end $$;

-- 新增另一台裝置：先在「已綁定的裝置」產生配對碼，再到新裝置輸入
create or replace function jb2_pair_create(p_sid text, p_token text) returns text
language plpgsql security definer set search_path = public as $$
declare s text; c text;
begin
  s := jb2_auth(p_sid, p_token, false); if s <> 'ok' then return null; end if;
  c := lpad(floor(random() * 1000000)::int::text, 6, '0');
  insert into jb2_pair (student_number, code, expires_at, tries) values (p_sid, c, now() + interval '5 minutes', 0)
  on conflict (student_number) do update set code = excluded.code, expires_at = excluded.expires_at, tries = 0;
  return c;
end $$;

create or replace function jb2_pair_use(p_sid text, p_code text, p_token text) returns text
language plpgsql security definer set search_path = public as $$
declare r jb2_pair%rowtype;
begin
  if coalesce(length(p_token), 0) < 16 then return 'bad'; end if;
  if exists (select 1 from jb2_blocked where student_number = p_sid) then return 'blocked'; end if;
  select * into r from jb2_pair where student_number = p_sid;
  if not found or r.expires_at < now() or r.tries >= 5 then delete from jb2_pair where student_number = p_sid; return 'badcode'; end if;
  if r.code <> p_code then update jb2_pair set tries = tries + 1 where student_number = p_sid; return 'badcode'; end if;
  if (select count(*) from jb2_devices where student_number = p_sid) >= 5 then return 'toomany'; end if;
  insert into jb2_devices (student_number, token_hash) values (p_sid, jb2_hash(p_token)) on conflict do nothing;
  delete from jb2_pair where student_number = p_sid;
  return 'ok';
end $$;

-- ===== 上鎖：資料表不給外人直接碰，只能走上面的函式 =====
alter table jb2_presence enable row level security;
alter table jb2_friends  enable row level security;
alter table jb2_homes    enable row level security;
alter table jb2_settings enable row level security;
alter table jb2_blocked  enable row level security;
alter table jb2_devices  enable row level security;
alter table jb2_pair     enable row level security;
revoke all on jb2_presence, jb2_friends, jb2_homes, jb2_settings, jb2_blocked, jb2_devices, jb2_pair from anon, authenticated;
-- 內部小工具不開放給外人直接呼叫
revoke execute on function jb2_auth(text, text, boolean) from anon, authenticated, public;
revoke execute on function jb2_hash(text) from anon, authenticated, public;
revoke execute on function jb2_flag(text) from anon, authenticated, public;

-- ================= 老師常用指令（在 SQL Editor 單獨執行；老師的後台不受上鎖限制） =================
-- 關閉全校好友功能：   update jb2_settings set value = '0' where key = 'friends_enabled';
-- 重新開啟：           update jb2_settings set value = '1' where key = 'friends_enabled';
-- 只關閉「參觀小屋」： update jb2_settings set value = '0' where key = 'visit_enabled';
-- 封鎖某位學生：       insert into jb2_blocked (student_number, reason) values ('學號', '原因');
-- 解除封鎖：           delete from jb2_blocked where student_number = '學號';
-- 學生換了手機／清除資料，需要重新認領學號：  delete from jb2_devices where student_number = '學號';
-- 看某位學生的好友：   select * from jb2_friends where a = '學號' or b = '學號';
