/**
 * __tests__/migration-021-fk-static-guard.test.ts
 *
 * T2.1 (N-5, STATIC half only) — nothing in the repo goes RED if
 * `private_spaces.signal_id`'s foreign key ever reverts to `ON DELETE
 * CASCADE` (the FEAT-2 headline bug). This file guards only the two static
 * facts that make the fix real:
 *
 *   1. `private_spaces_signal_id_fkey` is re-added with `on delete set null`,
 *      not `cascade`.
 *   2. `space_overview` LEFT JOINs `signals` — the second, independent
 *      mechanism by which a detached space (`signal_id: null`) would vanish
 *      from the Private tab for BOTH users even if the FK itself were fine.
 *
 * This is a STATIC guard on committed SQL only. It proves nothing about what
 * is LIVE on the production database — that needs a live DB connection,
 * which is explicitly out of scope for this repair (T2.1 brief). If a
 * future migration re-adds a CASCADE FK, or a future view edit reverts to
 * an INNER JOIN, this test goes RED the moment that SQL is committed,
 * regardless of whether it was ever applied.
 *
 * Each extractor is proven non-vacuous below against a SYNTHETIC fixture
 * before it is ever pointed at the real file — the same "detector self-test"
 * pattern __tests__/signal-delete-space-survival.test.ts already uses for
 * hasDanglingFromSignalLabel.
 */
import fs from 'fs';
import path from 'path';

const MIGRATION_021_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '021_resense_signal_delete_preserves_space.sql',
);

/**
 * Strips SQL line comments (`-- …` to end of line) before any pattern match
 * runs. P3-c: without this, a revert that kept a trailing
 * `-- was: left join` (or `-- was: on delete cascade`) comment on the
 * reverted line would still contain the literal substring the extractors
 * look for, and the guard would pass against a genuinely reverted file. Only
 * strips `--` comments (the sole style used in this migration file); does
 * not need to handle `/* … *\/` block comments, none of which appear here.
 */
function stripSqlLineComments(sql: string): string {
  return sql
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');
}

/**
 * Extracts the lowercase ON DELETE action of the
 * `private_spaces_signal_id_fkey` constraint, or null if the constraint
 * declaration is not found at all.
 */
function extractSignalIdFkOnDeleteAction(sql: string): string | null {
  const match = stripSqlLineComments(sql).match(
    /add constraint private_spaces_signal_id_fkey[\s\S]*?on delete (\w+(?:\s+\w+)?);/i,
  );
  return match ? match[1].toLowerCase() : null;
}

/**
 * Every line inside the `create or replace view public.space_overview`
 * statement (up to its terminating `;`) that references `public.signals`,
 * with SQL line comments stripped first (P3-c) so a comment-only revert
 * cannot evade the `left join` check below.
 */
function signalsJoinLines(sql: string): string[] {
  const uncommented = stripSqlLineComments(sql);
  const startIdx = uncommented.indexOf('create or replace view public.space_overview');
  if (startIdx === -1) return [];
  const viewSection = uncommented.slice(startIdx);
  const terminatorIdx = viewSection.search(/;\s*\n/);
  const scoped = terminatorIdx === -1 ? viewSection : viewSection.slice(0, terminatorIdx + 1);
  return scoped.split('\n').filter((line) => /\bpublic\.signals\b/i.test(line));
}

describe('detector self-test — proves the extractors are not vacuous', () => {
  it('extractSignalIdFkOnDeleteAction flags a synthetic CASCADE reversion', () => {
    const synthetic = `
      alter table public.private_spaces
        add constraint private_spaces_signal_id_fkey
        foreign key (signal_id) references public.signals(id)
        on delete cascade;
    `;
    expect(extractSignalIdFkOnDeleteAction(synthetic)).toBe('cascade');
  });

  it('extractSignalIdFkOnDeleteAction returns null when the constraint is absent entirely', () => {
    expect(extractSignalIdFkOnDeleteAction('-- no such constraint in this file')).toBeNull();
  });

  it('signalsJoinLines flags a synthetic reversion to an INNER JOIN', () => {
    const synthetic = `
create or replace view public.space_overview
with (security_invoker = false) as
select sp.id
from public.private_spaces sp
join public.signals s on s.id = sp.signal_id
where sp.user_a = auth.uid();
`;
    const lines = signalsJoinLines(synthetic);
    expect(lines.length).toBeGreaterThan(0);
    const anyBareJoin = lines.some((line) => !line.toLowerCase().includes('left join'));
    expect(anyBareJoin).toBe(true); // proves the detector would flag this synthetic reversion
  });

  it('signalsJoinLines returns no bare-join lines for a genuine LEFT JOIN', () => {
    const synthetic = `
create or replace view public.space_overview
with (security_invoker = false) as
select sp.id
from public.private_spaces sp
left join public.signals s on s.id = sp.signal_id
where sp.user_a = auth.uid();
`;
    const lines = signalsJoinLines(synthetic);
    expect(lines.length).toBeGreaterThan(0);
    const anyBareJoin = lines.some((line) => !line.toLowerCase().includes('left join'));
    expect(anyBareJoin).toBe(false);
  });

  it('P3-c: signalsJoinLines still flags a bare JOIN reversion that keeps a trailing "-- was: left join" comment on the same line', () => {
    // A revert that swaps the keyword but leaves the old comment behind —
    // exactly the evasion named in the brief. Before stripSqlLineComments
    // existed, the raw line contained the literal substring "left join"
    // (inside the comment) and this reversion would have evaded the guard.
    const synthetic = `
create or replace view public.space_overview
with (security_invoker = false) as
select sp.id
from public.private_spaces sp
join public.signals s on s.id = sp.signal_id   -- was: left join
where sp.user_a = auth.uid();
`;
    const lines = signalsJoinLines(synthetic);
    expect(lines.length).toBeGreaterThan(0);
    const anyBareJoin = lines.some((line) => !line.toLowerCase().includes('left join'));
    expect(anyBareJoin).toBe(true); // caught: the trailing comment cannot rescue a bare `join`
  });

  it('P3-c: extractSignalIdFkOnDeleteAction is not fooled by a "-- was: on delete set null;" comment placed BEFORE the real (reverted) ON DELETE CASCADE clause', () => {
    // Without comment-stripping, the extractor's lazy `[\s\S]*?on delete
    // (\w+...);` match finds the FIRST "on delete <word>;" text after the
    // constraint name — which is the one INSIDE this comment ("set null"),
    // not the real reverted clause below it ("cascade"). Measured directly:
    // the pre-fix extractor returns 'set null' (wrong — masks the
    // regression) against this exact input; the fix must return 'cascade'.
    const synthetic = `
      alter table public.private_spaces
        add constraint private_spaces_signal_id_fkey
        foreign key (signal_id) references public.signals(id)
        -- was: on delete set null;
        on delete cascade;
    `;
    expect(extractSignalIdFkOnDeleteAction(synthetic)).toBe('cascade');
  });
});

describe('migration 021 (real committed file) — private_spaces.signal_id FK stays ON DELETE SET NULL', () => {
  const sql = fs.readFileSync(MIGRATION_021_PATH, 'utf8');

  it('re-adds private_spaces_signal_id_fkey with ON DELETE SET NULL, not CASCADE', () => {
    expect(extractSignalIdFkOnDeleteAction(sql)).toBe('set null');
  });

  it('space_overview LEFT JOINs signals on every reference — a detached space must still surface for both users', () => {
    const lines = signalsJoinLines(sql);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line.toLowerCase()).toContain('left join');
    }
  });
});
