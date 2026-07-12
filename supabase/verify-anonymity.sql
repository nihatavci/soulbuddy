-- supabase/verify-anonymity.sql
-- IDEN-04 automated proof for the re:sense identity backbone.
-- Runnable via Supabase MCP `execute_sql` (or psql). Asserts, as a single DO block
-- that RAISEs on any failure and finally returns `ok = true`:
--
--   1. public_profiles exposes EXACTLY the 4 allowed columns.
--   2. No identity/timestamp column (email, age_confirmed_at, trust_level,
--      created_at, updated_at) is reachable through public_profiles.
--   3. profiles has RLS enabled AND no permissive using(true) SELECT policy
--      (owner-only preserved).
--   4. `anon` has NO SELECT grant on public_profiles; `authenticated` DOES.
--   5. POSITIVE cross-user read: two DIFFERENT users' aliases are both visible
--      through public_profiles (count(distinct user_id) = 2). Synthetic rows are
--      inserted inside a plpgsql sub-block and rolled back via a sentinel
--      exception, so the script leaves NO data behind.
--
-- NOTE: MCP `execute_sql` runs as a privileged role that BYPASSES RLS, so the
-- security-definer view returns all rows here regardless of caller. The definitive
-- per-user check (a real authenticated session sees others' aliases but only its
-- OWN full profiles row, and never any email) is re-run in Plan 03's live
-- checkpoint against a real signed-in user.

do $$
declare
  v_view_cols   text[];
  v_leaked      text;
  v_rls         boolean;
  v_permissive  int;
  v_anon_grant  int;
  v_auth_grant  int;
  u1 uuid := '11111111-1111-1111-1111-111111111111';
  u2 uuid := '22222222-2222-2222-2222-222222222222';
  v_cross       int;
begin
  -- 1. exactly the 4 allowed columns
  select array_agg(column_name order by column_name) into v_view_cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'public_profiles';
  if v_view_cols is distinct from array['alias','boundaries','intent','user_id'] then
    raise exception 'ASSERT 1 FAILED: public_profiles columns = %', v_view_cols;
  end if;

  -- 2. no leaked identity/timestamp columns in the view
  select string_agg(column_name, ', ') into v_leaked
    from information_schema.columns
    where table_schema = 'public' and table_name = 'public_profiles'
      and column_name in ('email','age_confirmed_at','trust_level','created_at','updated_at');
  if v_leaked is not null then
    raise exception 'ASSERT 2 FAILED: leaked columns in public_profiles: %', v_leaked;
  end if;

  -- 3. RLS enabled on profiles AND no permissive using(true) SELECT policy
  select relrowsecurity into v_rls from pg_class where oid = 'public.profiles'::regclass;
  if v_rls is not true then
    raise exception 'ASSERT 3 FAILED: RLS not enabled on public.profiles';
  end if;
  select count(*) into v_permissive
    from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and cmd = 'SELECT' and qual = 'true';
  if v_permissive > 0 then
    raise exception 'ASSERT 3 FAILED: % permissive using(true) SELECT policy on profiles', v_permissive;
  end if;

  -- 4. anon has NO select grant on the view; authenticated does
  select count(*) into v_anon_grant
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'public_profiles'
      and grantee = 'anon' and privilege_type = 'SELECT';
  select count(*) into v_auth_grant
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'public_profiles'
      and grantee = 'authenticated' and privilege_type = 'SELECT';
  if v_anon_grant <> 0 then
    raise exception 'ASSERT 4 FAILED: anon has SELECT on public_profiles';
  end if;
  if v_auth_grant < 1 then
    raise exception 'ASSERT 4 FAILED: authenticated lacks SELECT on public_profiles';
  end if;

  -- 5. positive cross-user read — synthetic inserts rolled back via sentinel
  begin
    insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at)
    values
      ('00000000-0000-0000-0000-000000000000', u1, 'authenticated', 'authenticated', 'verify_u1@example.test', now(), now()),
      ('00000000-0000-0000-0000-000000000000', u2, 'authenticated', 'authenticated', 'verify_u2@example.test', now(), now());

    insert into public.profiles (user_id, alias, intent, boundaries)
    values
      (u1, 'verifyaliasone', array['date'], array['go_slow']),
      (u2, 'verifyaliastwo', array['conversation'], array['text_only']);

    select count(distinct user_id) into v_cross
      from public.public_profiles
      where user_id in (u1, u2);

    if v_cross <> 2 then
      raise exception 'ASSERT 5 FAILED: cross-user read via public_profiles saw % of 2 users', v_cross;
    end if;

    -- force rollback of the synthetic rows (leave no data)
    raise exception 'ROLLBACK_SENTINEL';
  exception
    when others then
      if sqlerrm <> 'ROLLBACK_SENTINEL' then
        raise; -- re-raise a real assertion failure (rolls the sub-block back too)
      end if;
      -- sentinel: synthetic inserts are now rolled back; continue
  end;

  raise notice 'IDEN-04 anonymity proof: ALL 5 ASSERTIONS PASSED';
end $$;

-- Reached only if the DO block above did not RAISE.
select true as ok, 'IDEN-04: 4-col view, no leaked cols, RLS owner-only, no anon grant, cross-user read=2' as detail;
