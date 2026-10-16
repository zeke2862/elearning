# Supabase 設定教學（給學號對戰功能用，獨立新專案）

跟著做大概 10 分鐘，做完最後有兩樣東西要傳給我：**Project URL** 跟 **anon public key**。

---

## 第 1 步：建立新專案

1. 登入 **https://supabase.com/dashboard**
2. 點「New project」
3. 專案名稱建議取 `math-duel`（或您喜歡的名字），跟校務系統分開，一看就知道是哪個系統用的
4. 資料庫密碼隨便設一組（記下來備用，但這次對戰功能其實用不到要輸入密碼的地方）
5. 地區選離台灣近的（Singapore 通常最近）
6. 按「Create new project」，等它建立完成（大概 1~2 分鐘）

---

## 第 2 步：建立資料表

左側選單點「SQL Editor」→「New query」，把下面整段貼進去，按右下角「Run」執行：

```sql
-- 每位學生目前的戰力快照（挑戰別人時，用這張表查對方最新數值）
create table if not exists duel_users (
  student_number text primary key,
  name text,
  level int default 1,
  stats jsonb,
  updated_at timestamptz default now()
);

-- 對戰房間：一場對戰一筆
create table if not exists duel_battles (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'sync',
  a_id text not null,
  b_id text,
  a jsonb not null,
  b jsonb,
  turn text,
  over boolean not null default false,
  winner text,
  log jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 「有人在等我加入」的邀請清單
create table if not exists duel_pending (
  target_id text primary key,
  battle_id uuid references duel_battles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 每位學生的對戰總戰績
create table if not exists duel_records (
  student_number text primary key,
  wins int not null default 0,
  losses int not null default 0,
  draws int not null default 0
);

-- 三個「安全加分」函式，讓勝/敗/平手可以直接在資料庫裡原子性 +1，
-- 不用先讀出來、加一、再寫回去，比較不會因為很多人同時對戰而算錯。
create or replace function bump_duel_win(p_sid text) returns void as $$
  insert into duel_records(student_number, wins) values (p_sid, 1)
  on conflict (student_number) do update set wins = duel_records.wins + 1;
$$ language sql;

create or replace function bump_duel_loss(p_sid text) returns void as $$
  insert into duel_records(student_number, losses) values (p_sid, 1)
  on conflict (student_number) do update set losses = duel_records.losses + 1;
$$ language sql;

create or replace function bump_duel_draw(p_sid text) returns void as $$
  insert into duel_records(student_number, draws) values (p_sid, 1)
  on conflict (student_number) do update set draws = duel_records.draws + 1;
$$ language sql;
```

看到「Success. No rows returned」就是成功了。

---

## 第 3 步：開啟即時同步（Realtime）

左側選單「Database」→「Replication」，找到剛剛建立的 `duel_battles` 表，把右邊的開關打開（Enable）。這一步是讓「對戰中雙方畫面即時更新」能動起來，不開的話對戰畫面不會自動刷新。

`duel_pending` 表**不需要**開，我們是用一次性查詢＋即時通知兩種方式混合處理，程式碼裡已經設計好了。其實也可以順手一起開起來備用，開了不會有副作用。

---

## 第 4 步：先讓功能能動（測試用的簡單權限）

左側選單「Authentication」→「Policies」，或者最快的做法是回到「SQL Editor」貼上這段（這 4 張表都不開權限限制，因為這套系統跟現在遊戲本身一樣，沒有另外做帳號密碼登入）：

```sql
alter table duel_users disable row level security;
alter table duel_battles disable row level security;
alter table duel_pending disable row level security;
alter table duel_records disable row level security;
```

⚠️ 提醒您（跟之前 Firebase 版本一樣的老實話）：這樣設定表示只要知道網址，任何人都能讀寫這 4 張表的資料。以班級小遊戲來說風險可以接受、跟遊戲本身「學號自己填」的信任程度一致；之後如果想要「真正防作弊 / 權限控管」，可以加上 Supabase Auth 搭配 RLS 規則，是更大的工程，有需要再另外規劃。

---

## 第 5 步：拿到設定值

左側選單「Project Settings」（齒輪圖示）→「API」，會看到：

- **Project URL**：長得像 `https://xxxxxxxxxxxx.supabase.co`
- **anon public** 這一組 key（一長串英數字，不是 `service_role` 那組，那組不能外流）

**把這兩個值複製傳給我**，我就會填進 world-map.html 裡。

---

## 小提醒

- Supabase 免費額度對一個年級的使用量完全足夠
- `anon public` key 設計上就是要放在前端程式碼裡的（不是密碼），是安全的做法；真正要保護的是 `service_role` key，那組**絕對不要**放進網頁裡
