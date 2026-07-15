-- Migration: 013_resense_message_push_alias
-- Mirror of remote change to project qzaieykseghxufjfgsmf.
-- Enrich the message push: show the sender's alias and set a presence badge.
--   body  = 'New message from <sender alias>'   (alias-only; no message content)
--   badge = 1                                    (presence; client clears to 0 on read)
-- data.spaceId is unchanged (drives the notification-tap deep link to the thread).

create or replace function public.notify_message_push()
returns trigger language plpgsql security definer set search_path = public, net as $$
declare
  v_recipient uuid;
  v_alias     text;
  v_token     text;
begin
  select case when ps.user_a = new.sender_id then ps.user_b else ps.user_a end
    into v_recipient
  from public.private_spaces ps where ps.id = new.space_id;
  if v_recipient is null then return new; end if;

  select alias into v_alias from public.profiles where user_id = new.sender_id;
  v_alias := coalesce(nullif(btrim(v_alias), ''), 'someone');

  for v_token in select token from public.push_tokens where user_id = v_recipient loop
    perform net.http_post(
      url     := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object(
        'to',    v_token,
        'title', 're:sense',
        'body',  'New message from ' || v_alias,
        'sound', 'default',
        'badge', 1,
        'data',  jsonb_build_object('spaceId', new.space_id::text)
      )
    );
  end loop;
  return new;
end;
$$;

-- Keep the RPC surface locked down (migration 012); CREATE OR REPLACE preserves the
-- ACL, but re-assert defensively.
revoke execute on function public.notify_message_push() from public, anon, authenticated;
