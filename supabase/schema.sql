-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

-- Each scored prompt, owned by the user who ran it
create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  goal text,
  goal_detail text,
  context text,
  tool text,
  prompt_snippet text,
  prompt_quality jsonb,
  tool_fit jsonb,
  overall int,
  label text
);
alter table results enable row level security;
create policy "select own results" on results for select using (auth.uid() = user_id);
create policy "insert own results" on results for insert with check (auth.uid() = user_id);
-- api/score.js writes with the service-role key, which bypasses RLS. The
-- policies above matter for the sidebar list, which reads straight from the
-- browser using the anon key + the logged-in user's session.

-- Per-user token/cost totals. No RLS policies are defined on purpose, which
-- means the anon key cannot read or write this table at all — it is only
-- reachable via the service-role key used server-side in api/admin-usage.js.
create table if not exists usage_totals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  sessions int not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cost numeric not null default 0
);
alter table usage_totals enable row level security;

-- Single-row table tracking total platform spend and alert state
create table if not exists global_usage (
  id smallint primary key default 1,
  total_cost numeric not null default 0,
  alert_threshold numeric not null default 0.10,
  alert_fired boolean not null default false
);
alter table global_usage enable row level security;
insert into global_usage (id) values (1) on conflict (id) do nothing;

-- Atomic increment + threshold check, called once per scored prompt
create or replace function increment_usage(
  p_user_id uuid, p_email text, p_input bigint, p_output bigint, p_cost numeric
) returns table(new_total numeric, threshold numeric, crossed_now boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev_fired boolean;
  v_new_total numeric;
  v_threshold numeric;
  v_crossed boolean;
begin
  insert into usage_totals (user_id, email, sessions, input_tokens, output_tokens, cost)
  values (p_user_id, p_email, 1, p_input, p_output, p_cost)
  on conflict (user_id) do update set
    sessions = usage_totals.sessions + 1,
    input_tokens = usage_totals.input_tokens + p_input,
    output_tokens = usage_totals.output_tokens + p_output,
    cost = usage_totals.cost + p_cost,
    email = p_email;

  select alert_fired, alert_threshold into v_prev_fired, v_threshold
    from global_usage where id = 1 for update;

  update global_usage set total_cost = total_cost + p_cost where id = 1
    returning total_cost into v_new_total;

  v_crossed := (not v_prev_fired) and (v_new_total >= v_threshold);
  if v_crossed then
    update global_usage set alert_fired = true where id = 1;
  end if;

  return query select v_new_total, v_threshold, v_crossed;
end;
$$;
