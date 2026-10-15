-- 賽季排行榜資料表（請老師在 Supabase 的 SQL Editor 執行一次）
create table if not exists duel_season (
  season text not null,
  student_number text not null,
  name text,
  wins int not null default 0,
  losses int not null default 0,
  draws int not null default 0,
  updated_at timestamptz default now(),
  primary key (season, student_number)
);
alter table duel_season enable row level security;
drop policy if exists "season read" on duel_season;
create policy "season read" on duel_season for select using (true);

create or replace function bump_duel_season(p_season text, p_sid text, p_name text, p_field text)
returns void language plpgsql security definer as $$
begin
  insert into duel_season(season, student_number, name, wins, losses, draws)
  values (p_season, p_sid, p_name, (p_field='wins')::int, (p_field='losses')::int, (p_field='draws')::int)
  on conflict (season, student_number) do update set
    name = coalesce(excluded.name, duel_season.name),
    wins = duel_season.wins + (p_field='wins')::int,
    losses = duel_season.losses + (p_field='losses')::int,
    draws = duel_season.draws + (p_field='draws')::int,
    updated_at = now();
end $$;
grant execute on function bump_duel_season(text,text,text,text) to anon;
