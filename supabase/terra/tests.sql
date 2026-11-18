\set ON_ERROR_STOP on
\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set B '''bbbbbbbb-0000-0000-0000-00000000000b'''
\set C '''cccccccc-0000-0000-0000-00000000000c'''
insert into auth.users(id, email) values (:A, 'a@x'), (:B, 'b@x'), (:C, 'c@x');

-- C also uses Pauci: their sign-in must survive a re:sense account deletion.
select portfolio.join_app(:C, 'pauci');

-- 1. profiles; a profile joins the shared registry
select set_config('request.jwt.claim.sub', :A, false); set role authenticated;
insert into resense.profiles(user_id, alias, intent, boundaries) values (:A, 'alice', '{date}', '{go_slow}');
select set_config('request.jwt.claim.sub', :B, false);
insert into resense.profiles(user_id, alias, intent, boundaries) values (:B, 'bobby', '{date}', '{go_slow}');
select set_config('request.jwt.claim.sub', :C, false);
insert into resense.profiles(user_id, alias, intent, boundaries) values (:C, 'carol', '{date}', '{go_slow}');
reset role;
select t.assert((select count(*) from portfolio.app_memberships where app_slug = 'resense') = 3, 'three resense memberships');
select t.assert((select count(*) from portfolio.app_memberships where user_id = :C) = 2, 'C is in pauci and resense');

-- 2. anon has no access at all
set role anon;
do $$ begin
  begin perform 1 from resense.public_signals; raise exception 'anon read public_signals';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- 3. signal -> board -> reply -> one space -> push to the author
select set_config('request.jwt.claim.sub', :A, false); set role authenticated;
select resense.claim_push_token('ExponentPushToken[A]', 'ios');
insert into resense.signals(text, format) values ('the smell of rain', 'feeling');
insert into resense.signals(text, format) values ('a second one', 'thought');
select set_config('request.jwt.claim.sub', :B, false);
select t.assert((select count(*) from resense.public_signals) = 2, 'B sees both signals');
select t.assert((select count(*) from resense.signals) = 0, 'B cannot read the base table');
insert into resense.replies(signal_id, text) select id, 'petrichor' from resense.public_signals where text = 'the smell of rain';
select t.assert((select count(*) from resense.space_overview) = 1, 'B has one space');
reset role;
select t.assert((select count(*) from resense.private_spaces) = 1, 'exactly one space');
select t.assert((select count(*) from net.calls where body ->> 'to' = 'ExponentPushToken[A]') = 1, 'author got a push');

-- 4. messages: member can send, push goes to the other side
select set_config('request.jwt.claim.sub', :B, false); set role authenticated;
insert into resense.messages(space_id, text) select id, 'hello' from resense.space_overview;
reset role;
select t.assert((select count(*) from net.calls where body ->> 'body' like 'New message from bobby') = 1, 'message push uses the alias');

-- 5. reports: only via submit_report, with a snapshot; clients cannot read them
select set_config('request.jwt.claim.sub', :B, false); set role authenticated;
select resense.submit_report('spam', (select id from resense.public_signals where text = 'a second one'));
do $$ begin
  begin perform 1 from resense.reports; raise exception 'client read reports';
  exception when insufficient_privilege then null; end;
  begin insert into resense.reports(reporter_id, reported_user_id, signal_id, reason)
        select auth.uid(), auth.uid(), id, 'spam' from resense.public_signals limit 1;
        raise exception 'client inserted a report';
  exception when insufficient_privilege then null; end;
end $$;
select resense.submit_report('harassment', null, (select id from resense.space_overview), 'rude');
reset role;
select t.assert((select content_snapshot from resense.reports where reason = 'spam') = 'a second one', 'signal snapshot saved');
select t.assert((select content_snapshot from resense.reports where reason = 'harassment') = 'hello', 'space snapshot saved');
select t.assert((select reported_user_id from resense.reports where reason = 'harassment') = :A::uuid, 'space report names the other person');
-- not a member / own content
select set_config('request.jwt.claim.sub', :C, false); set role authenticated;
do $$ declare s uuid; begin
  select id into s from resense.private_spaces limit 1; -- RLS hides it from C: s is null
  begin perform resense.submit_report('spam', null, (select id from resense.private_spaces limit 1)); raise exception 'C reported a space they are not in';
  exception when others then if sqlerrm like 'C reported%' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub', :A, false); set role authenticated;
do $$ begin
  begin perform resense.submit_report('spam', (select id from resense.signals limit 1)); raise exception 'A reported themself';
  exception when others then if sqlerrm like 'A reported%' then raise; end if; end;
end $$;
reset role;

-- 6. block: A blocks B => both sides lose each other everywhere
select set_config('request.jwt.claim.sub', :A, false); set role authenticated;
insert into resense.blocks(blocked_id) values (:B);
insert into resense.blocks(blocked_id) values (:B) on conflict do nothing;  -- blocking twice is fine
select t.assert((select count(*) from resense.space_overview) = 0, 'A: space hidden after block');
select set_config('request.jwt.claim.sub', :B, false);
select t.assert((select count(*) from resense.public_signals) = 0, 'B: A''s signals hidden after block');
select t.assert((select count(*) from resense.space_overview) = 0, 'B: space hidden after block');
do $$ begin
  begin insert into resense.messages(space_id, text) values ((select id from resense.private_spaces limit 1), 'hi again');
        raise exception 'B messaged across a block';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', :C, false);
select t.assert((select count(*) from resense.public_signals) = 2, 'C still sees A''s signals');
reset role;
select set_config('request.jwt.claim.sub', :B, false); set role authenticated;
select t.assert((select count(*) from resense.blocks) = 0, 'B cannot see that A blocked them');
reset role;

-- 7. reveals stay mutual (A sees nothing of B until A has revealed too)
-- (space is blocked, so use a fresh pair: C and A)
select set_config('request.jwt.claim.sub', :C, false); set role authenticated;
insert into resense.replies(signal_id, text) select id, 'hello from C' from resense.public_signals where text = 'a second one';
insert into resense.space_reveals(space_id, first_name) select id, 'Carol' from resense.space_overview;
select set_config('request.jwt.claim.sub', :A, false);
select t.assert((select count(*) from resense.space_reveals) = 0, 'A sees no reveal before revealing');
insert into resense.space_reveals(space_id, first_name) select id, 'Alice' from resense.space_overview;
select t.assert((select count(*) from resense.space_reveals) = 2, 'A sees both after revealing');
reset role;

-- 8. account deletion on a shared sign-in
select set_config('request.jwt.claim.sub', :C, false); set role authenticated;
select t.assert(resense.delete_my_account() = false, 'C keeps their sign-in (still in pauci)');
reset role;
select t.assert((select count(*) from auth.users where id = :C) = 1, 'C auth user still exists');
select t.assert((select count(*) from resense.profiles where user_id = :C) = 0, 'C profile gone');
select t.assert((select count(*) from resense.private_spaces where user_a = :C or user_b = :C) = 0, 'C spaces gone');
select t.assert((select count(*) from portfolio.app_memberships where user_id = :C and app_slug = 'resense') = 0, 'C left resense');
select t.assert((select count(*) from portfolio.app_memberships where user_id = :C and app_slug = 'pauci') = 1, 'C still in pauci');

select set_config('request.jwt.claim.sub', :B, false); set role authenticated;
select t.assert(resense.delete_my_account() = true, 'B was only in resense: sign-in deleted too');
reset role;
select t.assert((select count(*) from auth.users where id = :B) = 0, 'B auth user deleted');
select t.assert((select count(*) from resense.blocks) = 0, 'blocks involving B gone');

-- 9. nothing exposed that should not be
select t.assert(not exists (select 1 from information_schema.role_table_grants where grantee = 'anon' and table_schema in ('resense','resense_private')), 'anon has no table grants');
select t.assert(not has_function_privilege('anon', 'resense.submit_report(text,uuid,uuid,text)', 'execute'), 'anon cannot call submit_report');
select t.assert(not has_function_privilege('authenticated', 'resense_private.open_space()', 'execute'), 'trigger functions not callable');
select t.assert((select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'resense') = 5, 'five realtime tables');
\echo ALL CHECKS PASSED
