-- JB2 Google 登入雲端存檔（Supabase 專案 math）
-- 設計重點：
--  * 學生端「不能」直接寫資料表（沒有 insert/update 權限），只能呼叫下面兩個函式，由伺服器檢查後才寫入。
--  * 一個 Google 帳號只能綁一個學號；一個學號只能被一個 Google 帳號綁定。
--  * 伺服器端檢查：格式、大小、星數 0~5／總星數上限、經驗不超過作答題數上限、數靈幣範圍、
--    以及「兩次存檔之間不可能增加那麼多」（星數、收入的速率上限）。可疑的存檔會被拒絕並記在 flags。
--  * 每次存檔會把上一版留在 prev（可由老師在後台回復）。
-- 老師管理（在 Supabase 後台 SQL Editor 執行）：
--   看誰綁了哪個學號：  select s.student_no, u.email, s.stars, s.updated_at, s.flags from jb2_cloud_saves s join auth.users u on u.id = s.user_id order by s.updated_at desc;
--   解除綁定（學號綁錯／被冒用）：  delete from jb2_cloud_saves where student_no = '學號';
--   回復上一版：  update jb2_cloud_saves set data = prev, updated_at = now() where student_no = '學號' and prev is not null;

create table if not exists public.jb2_cloud_saves (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  student_no text not null unique,
  data       jsonb not null,
  prev       jsonb,
  stars      int  not null default 0,
  earned     bigint not null default 0,
  flags      jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jb2_cloud_saves enable row level security;
drop policy if exists "jb2 own select" on public.jb2_cloud_saves;
create policy "jb2 own select" on public.jb2_cloud_saves for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.jb2_cloud_saves from anon, authenticated;
grant select on public.jb2_cloud_saves to authenticated;

-- 內部檢查：回傳 null＝通過，否則回傳原因（規則對應 jb2-seal.js 的 vCh／vHub）
create or replace function public.jb2_check(p jsonb) returns text
language plpgsql immutable set search_path = public as $$
declare n text; d jsonb; k text; s jsonb; q jsonb; qk text; total int := 0; anyt boolean; expsum bigint; nsum bigint; cnt int; h jsonb; st jsonb; iv text;
begin
  if p is null or jsonb_typeof(p) <> 'object' then return '格式'; end if;
  if (p->>'v') is distinct from '1' then return '版本'; end if;
  if octet_length(p::text) > 700000 then return '資料太大'; end if;
  if jsonb_typeof(p->'ch') <> 'object' then return '章節資料'; end if;
  for n in select jsonb_object_keys(p->'ch') loop
    if n !~ '^[1-6]$' then return '未知的章 ' || n; end if;
    d := p->'ch'->n;
    if jsonb_typeof(d) <> 'object' then return '章節資料格式'; end if;
    anyt := false; expsum := 0;
    for k, s in select key, value from jsonb_each(d) loop
      if left(k, 1) = '_' then continue; end if;
      if k !~ '^[1-6]-[1-3]-[1-3]$' or left(k, 1) <> n then return '未知的關卡 ' || k; end if;
      if jsonb_typeof(s) <> 'object' then return '關卡資料格式 ' || k; end if;
      if s ? 'stars' then
        if jsonb_typeof(s->'stars') <> 'number' or (s->>'stars') !~ '^[0-5]$' then return '星數不合理 ' || k; end if;
        total := total + (s->>'stars')::int;
      end if;
      if s ? 'exp' and (jsonb_typeof(s->'exp') <> 'number' or (s->>'exp') !~ '^\d{1,9}$') then return '經驗不合理 ' || k; end if;
      if s ? 'best' and (jsonb_typeof(s->'best') <> 'number' or (s->>'best') !~ '^\d{1,5}$' or (s->>'best')::int > 60000) then return '分數不合理 ' || k; end if;
      if s ? 'eb' and (jsonb_typeof(s->'eb') <> 'number' or (s->>'eb') !~ '^\d{1,4}$' or (s->>'eb')::int > 5000) then return '無極限紀錄不合理 ' || k; end if;
      if s ? 'tries' then
        if jsonb_typeof(s->'tries') <> 'number' or (s->>'tries') !~ '^\d{1,7}$' then return '挑戰次數不合理 ' || k; end if;
        if (s->>'tries')::int > 0 then anyt := true; end if;
      end if;
      if s ? 'exp' then expsum := expsum + (s->>'exp')::bigint; end if;
    end loop;
    if anyt then   -- 新版資料：有星星一定有挑戰紀錄
      for k, s in select key, value from jsonb_each(d) loop
        if left(k, 1) = '_' then continue; end if;
        if coalesce((s->>'stars')::int, 0) > 0 and coalesce((s->>'tries')::int, 0) <= 0 then return '有星星卻沒有挑戰紀錄 ' || k; end if;
      end loop;
    end if;
    q := d->'_q'; nsum := 0; cnt := 0;
    if q is not null and jsonb_typeof(q) = 'object' then
      for qk, s in select key, value from jsonb_each(q) loop
        if jsonb_typeof(s) <> 'object' or (s->>'n') !~ '^\d{1,9}$' or (s->>'ok') !~ '^\d{1,9}$' or (s->>'ok')::bigint > (s->>'n')::bigint then return '作答統計不合理'; end if;
        nsum := nsum + (s->>'n')::bigint; cnt := cnt + 1;
      end loop;
    end if;
    if cnt > 0 and expsum > nsum * 10 + 300 then return '經驗超過作答題數能得到的上限'; end if;
  end loop;
  if total > 155 then return '總星數不合理'; end if;
  h := p->'hub';
  if h is not null then
    if jsonb_typeof(h) <> 'object' then return '小屋資料格式'; end if;
    if h ? 'gold' and (jsonb_typeof(h->'gold') <> 'number' or (h->>'gold') !~ '^\d{1,7}$' or (h->>'gold')::int > 2000000) then return '數靈幣不合理'; end if;
    st := h->'stat';
    if st is not null and jsonb_typeof(st) = 'object' then
      for k in select unnest(array['earned', 'spent']) loop
        if st ? k and (jsonb_typeof(st->k) <> 'number' or (st->>k) !~ '^\d{1,10}$') then return '收支不合理'; end if;
      end loop;
    end if;
  end if;
  return null;
end $$;
revoke all on function public.jb2_check(jsonb) from public, anon, authenticated;

create or replace function public.jb2_stars_of(p jsonb) returns int
language sql immutable set search_path = public as $$
  select coalesce(sum(case when (s.value->>'stars') ~ '^[0-5]$' then (s.value->>'stars')::int else 0 end), 0)::int
  from jsonb_each(coalesce(p->'ch', '{}'::jsonb)) c, jsonb_each(case when jsonb_typeof(c.value) = 'object' then c.value else '{}'::jsonb end) s
  where left(s.key, 1) <> '_' and jsonb_typeof(s.value) = 'object';
$$;
revoke all on function public.jb2_stars_of(jsonb) from public, anon, authenticated;

-- 讀取自己的雲端存檔
create or replace function public.jb2_cloud_load() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r public.jb2_cloud_saves;
begin
  if uid is null then return jsonb_build_object('ok', false, 'err', 'login'); end if;
  select * into r from public.jb2_cloud_saves where user_id = uid;
  if not found then return jsonb_build_object('ok', true, 'exists', false); end if;
  return jsonb_build_object('ok', true, 'exists', true, 'student_no', r.student_no, 'data', r.data, 'stars', r.stars, 'updated_at', r.updated_at);
end $$;

-- 存檔：p_base＝這台裝置上次看到的雲端更新時間（別台裝置在這之後存過 → 回傳 conflict 讓學生選）；p_force＝學生選了「用這台」
create or replace function public.jb2_cloud_save(p_student text, p_data jsonb, p_base timestamptz default null, p_force boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r public.jb2_cloud_saves; why text; ns int; ne bigint := 0; mins numeric; now_ts timestamptz := now(); fl jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'err', 'login'); end if;
  if p_student is null or p_student !~ '^[A-Za-z0-9_-]{2,12}$' then return jsonb_build_object('ok', false, 'err', 'student'); end if;
  why := public.jb2_check(p_data);
  if why is not null then
    update public.jb2_cloud_saves set flags = (flags || jsonb_build_array(jsonb_build_object('at', now_ts, 'why', why)))  where user_id = uid;
    return jsonb_build_object('ok', false, 'err', 'invalid', 'why', why);
  end if;
  ns := public.jb2_stars_of(p_data);
  if (p_data #>> '{hub,stat,earned}') ~ '^\d{1,10}$' then ne := (p_data #>> '{hub,stat,earned}')::bigint; end if;
  select * into r from public.jb2_cloud_saves where user_id = uid for update;
  if found then
    if r.student_no <> p_student then return jsonb_build_object('ok', false, 'err', 'student_mismatch', 'student_no', r.student_no); end if;
    if not p_force and p_base is not null and r.updated_at > p_base + interval '1 second' then
      return jsonb_build_object('ok', false, 'err', 'conflict', 'updated_at', r.updated_at, 'stars', r.stars);
    end if;
    mins := least(43200, extract(epoch from (now_ts - r.updated_at)) / 60);
    if ns - r.stars > 6 + 3 * mins or ne - r.earned > 4000 + 400 * mins then
      fl := (r.flags || jsonb_build_array(jsonb_build_object('at', now_ts, 'why', '增加太快', 'stars', ns, 'was', r.stars, 'earned', ne, 'wasEarned', r.earned, 'mins', round(mins, 1))));
      update public.jb2_cloud_saves set flags = (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select x from jsonb_array_elements(fl) x order by x->>'at' desc limit 20) t) where user_id = uid;
      return jsonb_build_object('ok', false, 'err', 'implausible');
    end if;
    update public.jb2_cloud_saves set prev = data, data = p_data, stars = ns, earned = ne, updated_at = now_ts where user_id = uid;
  else
    if exists (select 1 from public.jb2_cloud_saves where student_no = p_student) then return jsonb_build_object('ok', false, 'err', 'student_taken'); end if;
    insert into public.jb2_cloud_saves(user_id, student_no, data, stars, earned, updated_at) values (uid, p_student, p_data, ns, ne, now_ts);
  end if;
  return jsonb_build_object('ok', true, 'updated_at', now_ts, 'stars', ns);
end $$;

revoke all on function public.jb2_cloud_load() from public, anon;
revoke all on function public.jb2_cloud_save(text, jsonb, timestamptz, boolean) from public, anon;
grant execute on function public.jb2_cloud_load() to authenticated;
grant execute on function public.jb2_cloud_save(text, jsonb, timestamptz, boolean) to authenticated;
