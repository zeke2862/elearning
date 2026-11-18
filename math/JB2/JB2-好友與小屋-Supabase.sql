-- JB2 好友 ＋ 參觀小屋：資料表（貼到 Supabase 左側「SQL Editor」→ New query → Run，只需要做一次）
-- 跟學號對戰（duel_*）用同一個專案，不會動到舊的表。可以重複執行，不會壞。

-- 1. 誰現在在線上（每 45 秒報到一次）
create table if not exists jb2_presence (
  student_number text primary key,
  name text,
  last_seen timestamptz not null default now()
);

-- 2. 好友關係：a＝送邀請的人，b＝被邀請的人；status：pending（等同意）／ok（已是好友）
create table if not exists jb2_friends (
  id bigserial primary key,
  a text not null,
  b text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (a, b)
);
create index if not exists jb2_friends_b on jb2_friends (b);

-- 3. 每位學生的小屋（給好友參觀）
create table if not exists jb2_homes (
  student_number text primary key,
  name text,
  eq jsonb,
  layout jsonb,
  updated_at timestamptz not null default now()
);

-- 4. 老師的開關：把 value 改成 '0' 就是關閉
create table if not exists jb2_settings (key text primary key, value text);
insert into jb2_settings (key, value) values ('friends_enabled', '1'), ('visit_enabled', '1')
on conflict (key) do nothing;

-- 5. 封鎖名單：被放進來的學號，不能報到、不能被加好友
create table if not exists jb2_blocked (student_number text primary key, reason text);

-- 6. 報到：時間由資料庫自己蓋（不會被學生電腦的時鐘影響）
create or replace function jb2_ping(p_sid text, p_name text) returns void language sql as $$
  insert into jb2_presence (student_number, name, last_seen) values (p_sid, p_name, now())
  on conflict (student_number) do update set name = excluded.name, last_seen = now();
$$;

-- 7. 我的好友名單（含在線狀態；100 秒內有報到＝在線上）
create or replace function jb2_friend_list(p_sid text)
returns table (friend text, name text, status text, direction text, online boolean, secs_ago int)
language sql as $$
  select case when f.a = p_sid then f.b else f.a end,
         p.name,
         f.status,
         case when f.a = p_sid then 'out' else 'in' end,
         coalesce(now() - p.last_seen < interval '100 seconds', false),
         extract(epoch from (now() - p.last_seen))::int
  from jb2_friends f
  left join jb2_presence p on p.student_number = case when f.a = p_sid then f.b else f.a end
  where f.a = p_sid or f.b = p_sid;
$$;

-- 8. 權限：跟學號對戰一樣，不另外做登入，所以不開 RLS（班級小遊戲可接受；
--    想要更嚴格防冒用，之後可以改成 Supabase Auth + RLS，是另一個工程）
alter table jb2_presence disable row level security;
alter table jb2_friends  disable row level security;
alter table jb2_homes    disable row level security;
alter table jb2_settings disable row level security;
alter table jb2_blocked  disable row level security;

-- ================= 老師常用指令（需要時再單獨執行） =================
-- 關閉全校好友功能：   update jb2_settings set value = '0' where key = 'friends_enabled';
-- 重新開啟：           update jb2_settings set value = '1' where key = 'friends_enabled';
-- 只關閉「參觀小屋」： update jb2_settings set value = '0' where key = 'visit_enabled';
-- 封鎖某位學生：       insert into jb2_blocked (student_number, reason) values ('學號', '原因');
-- 解除封鎖：           delete from jb2_blocked where student_number = '學號';
-- 看某位學生的好友：   select * from jb2_friends where a = '學號' or b = '學號';
-- 清掉某位學生的小屋： delete from jb2_homes where student_number = '學號';
