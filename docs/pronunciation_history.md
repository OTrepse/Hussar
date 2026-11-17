# Pronunciation History

The existing `/history` page now reads the signed-in user's saved pronunciation results from the existing Supabase project. It shows one entry per practiced word, newest first, with the original percentage score, feedback, optional standard/contextual scores, and local date/time. Loading, empty, error/retry, and mobile layouts use the existing theme and application layout.

Only successful evaluations with a finite score from 0 to 100 are saved. `0` is valid; `null` means the existing evaluator could not evaluate the recording and is not saved. Displaying a word, listening, starting/canceling a recording, and failed evaluations do not create or replace history. Audio and raw Speechmatics transcripts are not stored.

## Supabase setup

1. Open the **existing Supabase project** used by `frontend/.env` and the backend vocabulary database. No new project or keys are needed.
2. Run the complete [migration](../supabase/migrations/20261116000000_pronunciation_history.sql) once in the Supabase SQL Editor, or apply it with your existing Supabase migration workflow. The existing `public.practice_items` table and Supabase Auth must already exist. The repository contains no equivalent history table. If the live database already has one, inspect it before applying this migration; the migration deliberately fails rather than silently reusing an unknown schema.
3. Keep the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Use only a publishable/legacy anon key in the browser. Authentication code and configuration are unchanged.
4. Confirm the project's Data API exposes `public`, as required for `.from("pronunciation_history")`. The migration explicitly grants authenticated users SELECT/INSERT/UPDATE, enables RLS, and restricts each operation to `auth.uid() = user_id`. Anonymous access and client deletes are not granted.
5. Deploy the frontend after the migration, then complete one pronunciation evaluation and open History. Existing evaluations performed before this feature cannot be recovered.

The migration creates only `pronunciation_history`, its index, policies, and its update-trigger function. It does not alter existing tables or data. `word_id` is a `bigint` foreign key to the existing `practice_items.id`; `user_id` references `auth.users.id`. Deleting an Auth user removes that user's history. Vocabulary referenced by history keeps the database's default foreign-key deletion protection.

## Latest attempt and account isolation

The database enforces `UNIQUE (user_id, word_id)`. The frontend uses Supabase `.upsert(..., { onConflict: "user_id,word_id" })`, preserving a stable row identifier and replacing the existing score, feedback, sub-scores, and timestamp atomically.

Completion timestamps are captured immediately when evaluation results arrive, before asynchronous session lookup or storage. A trigger compares the timestamp while PostgreSQL holds the conflicting row lock and skips older or equal timestamps. Delayed writes cannot replace rows with later completion timestamps. Same-millisecond completions in one browser receive increasing timestamps. Cross-device ordering uses device clocks, which should be synchronized; the backend response does not provide a trusted completion timestamp. Equal cross-device timestamps retain the first stored result.

The evaluation's original account is captured by the existing React session. Before saving, the service checks that the current Supabase session still belongs to that account. RLS also protects against account changes between session lookup and the write. History data is keyed to its account in React, and obsolete read responses are ignored.

Saving runs in the background after the existing result state is updated. Storage failures leave previous records and pronunciation results intact and show a dismissible warning. Failed saves are not queued offline; practice again to save a new result. History refreshes when a background save finishes in the same tab and when the tab regains focus. An already-open History page in another device updates on refresh/focus; Realtime is not required.

## Files

New implementation files:

- `frontend/src/api/history_api.ts`: Supabase validation, session check, upsert, timestamps, and paginated history reads.
- `frontend/src/hooks/use_pronunciation_history.ts`: nonblocking save integration and scoped failure warnings.
- `supabase/migrations/20261116000000_pronunciation_history.sql`: table, uniqueness, RLS, grants, and stale-write guard.

Modified existing files:

- `frontend/src/pages/history_page.tsx`: replaces the placeholder with the functional History page.
- `frontend/src/pages/pronunciation_page.tsx`: four additive lines import/connect the history hook, save after receiving a result, and display its warning.

New verification/documentation files:

- `frontend/tests/history_api.test.mjs`
- `frontend/tests/history_browser.mjs`
- `supabase/tests/pronunciation_history.sql`
- `docs/pronunciation_history.md`

No dependencies, backend files, Speechmatics code, recording component, scoring logic, authentication files, existing routes/navigation, or shared styles are changed.

## Verification

From the repository root (use `npm.cmd` in Windows PowerShell if execution policy blocks `npm.ps1`):

```text
npm run typecheck
npm run build
node --experimental-vm-modules --test frontend/tests/history_api.test.mjs
node frontend/tests/history_browser.mjs
```

The service tests use Node's built-in test runner and the existing TypeScript compiler. They cover atomic upsert payloads, original evaluation values, invalid/null/zero scores, account changes, completion ordering, storage errors, and complete paginated reads.

The browser checks use headless Chrome, the existing Vite installation, and isolated mocked Auth, vocabulary, evaluation, and history services. The default Chrome path is for Windows; set `CHROME_PATH` for another installation. They verify the real frontend recording/result flow, replacement without duplicates, separate words/accounts, refresh and login/logout persistence, failed/invalid evaluations, storage/read failures, in-flight saves during navigation, mobile overflow, and browser exceptions. Mocks are confined to the harness and never included in application code. Results are written to ignored `tmp/history-browser-results.json`.

After applying the migration, run [the SQL verification script](../supabase/tests/pronunciation_history.sql) as `postgres` in the SQL Editor or via `psql -v ON_ERROR_STOP=1 -f supabase/tests/pronunciation_history.sql`. It requires at least two existing vocabulary items, creates two temporary test accounts within a transaction, checks uniqueness/upserts/stale writes and real RLS as `authenticated`/`anon`, and rolls back all fixture rows. Use a development project if custom Auth-user triggers have external side effects. A failed assertion raises an exception; roll back the transaction before retrying if your SQL client keeps it open.

Live Supabase RLS, cross-device persistence, and real Speechmatics calls require the migration and configured services. Mocked browser checks do not establish those live-service results.

Implementation checks completed on November 16, 2026:

- TypeScript check and production build passed. Vite reported a JavaScript chunk larger than 500 kB; no unrelated bundling changes were made.
- All eight service tests and all 15 mocked browser checks passed, including listening/canceling without creating an evaluation or history.
- No uncaught browser exceptions; mobile History stayed within a 320-pixel viewport.
- `git diff --check` passed. No tracked backend or Speechmatics files changed; the two pre-existing untracked backend files were left untouched.
- The migration and SQL verification script have not been executed against the live project. Apply the migration and run the SQL checks to verify live RLS and database behavior.

References: [Supabase upsert](https://supabase.com/docs/reference/javascript/upsert), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL trigger behavior](https://www.postgresql.org/docs/current/trigger-definition.html).
