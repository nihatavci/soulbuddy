-- Migration: 011_resense_message_push_tokens
-- Mirror of remote migration resense_message_push_tokens (project qzaieykseghxufjfgsmf).
-- Push foundation: store device push tokens + notify the other space member on a
-- new message via Expo's push service (pg_net POST — Expo relays to APNs).

create extension if not exists pg_net;

create table public.push_tokens (
  user_id    uuid not null references auth.users(id) on delete cascade,
  token      text not null,
  platform   text not null default 'ios',
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.push_tokens enable row level security;
create policy "push_tokens_select_own" on public.push_tokens for select using (auth.uid() = user_id);
create policy "push_tokens_insert_own" on public.push_tokens for insert with check (auth.uid() = user_id);
create policy "push_tokens_update_own" on public.push_tokens for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push_tokens_delete_own" on public.push_tokens for delete using (auth.uid() = user_id);

create or replace function public.notify_message_push()
returns trigger language plpgsql security definer set search_path = public, net as $$
declare
  v_recipient uuid;
  v_token     text;
begin
  select case when ps.user_a = new.sender_id then ps.user_b else ps.user_a end
    into v_recipient
  from public.private_spaces ps where ps.id = new.space_id;
  if v_recipient is null then return new; end if;

  for v_token in select token from public.push_tokens where user_id = v_recipient loop
    perform net.http_post(
      url     := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object(
        'to',    v_token,
        'title', 're:sense',
        'body',  'New message in your private space',
        'sound', 'default',
        'data',  jsonb_build_object('spaceId', new.space_id::text)
      )
    );
  end loop;
  return new;
end;
$$;

create trigger messages_notify_push
  after insert on public.messages
  for each row execute function public.notify_message_push();
