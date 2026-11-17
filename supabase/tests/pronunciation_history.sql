-- Run AFTER the migration, as postgres in the Supabase SQL Editor or psql.
-- Requires at least two existing vocabulary items. All fixture rows roll back.
BEGIN;

DO $$
BEGIN
    IF (SELECT count(*) FROM (SELECT id FROM public.practice_items LIMIT 2) words) < 2 THEN
        RAISE EXCEPTION 'These checks require two existing practice_items';
    END IF;
END;
$$;

SELECT set_config('history_test.user_a', gen_random_uuid()::text, true);
SELECT set_config('history_test.user_b', gen_random_uuid()::text, true);
SELECT set_config('history_test.word_a', (SELECT id::text FROM public.practice_items ORDER BY id LIMIT 1), true);
SELECT set_config('history_test.word_b', (SELECT id::text FROM public.practice_items ORDER BY id LIMIT 1 OFFSET 1), true);

INSERT INTO auth.users (id, aud, role)
VALUES (current_setting('history_test.user_a')::uuid, 'authenticated', 'authenticated'),
       (current_setting('history_test.user_b')::uuid, 'authenticated', 'authenticated');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('history_test.user_a'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('history_test.user_a'), 'role', 'authenticated')::text, true);

INSERT INTO public.pronunciation_history (user_id, word_id, word_text, score, feedback, attempted_at)
VALUES (auth.uid(), current_setting('history_test.word_a')::bigint, 'Cześć', 65, 'First completed evaluation', '2026-11-16 10:00:00+00');

SELECT set_config('history_test.record_id', (SELECT id::text FROM public.pronunciation_history WHERE user_id = auth.uid()), true);

-- Same operation used by Supabase upsert: never DELETE then INSERT.
INSERT INTO public.pronunciation_history (user_id, word_id, word_text, score, feedback, attempted_at)
VALUES (auth.uid(), current_setting('history_test.word_a')::bigint, 'Cześć', 91, 'Latest completed evaluation', '2026-11-16 10:02:00+00')
ON CONFLICT (user_id, word_id) DO UPDATE SET
    id = EXCLUDED.id, word_text = EXCLUDED.word_text, score = EXCLUDED.score,
    feedback = EXCLUDED.feedback, attempted_at = EXCLUDED.attempted_at;

-- A delayed older completion must not replace 91, even with an upsert.
INSERT INTO public.pronunciation_history (user_id, word_id, word_text, score, feedback, attempted_at)
VALUES (auth.uid(), current_setting('history_test.word_a')::bigint, 'Cześć', 82, 'Delayed older evaluation', '2026-11-16 10:01:00+00')
ON CONFLICT (user_id, word_id) DO UPDATE SET
    score = EXCLUDED.score, feedback = EXCLUDED.feedback, attempted_at = EXCLUDED.attempted_at;

-- Equal completion timestamps cannot replace the current completed result.
INSERT INTO public.pronunciation_history (user_id, word_id, word_text, score, feedback, attempted_at)
VALUES (auth.uid(), current_setting('history_test.word_a')::bigint, 'Cześć', 1, 'Equal timestamp', '2026-11-16 10:02:00+00')
ON CONFLICT (user_id, word_id) DO UPDATE SET
    score = EXCLUDED.score, feedback = EXCLUDED.feedback, attempted_at = EXCLUDED.attempted_at;

DO $$
DECLARE entry public.pronunciation_history;
BEGIN
    SELECT * INTO STRICT entry FROM public.pronunciation_history WHERE user_id = auth.uid();
    IF entry.score <> 91 OR entry.feedback <> 'Latest completed evaluation'
        OR entry.id <> current_setting('history_test.record_id')::uuid THEN
        RAISE EXCEPTION 'Repeat attempt or stale-write guard failed';
    END IF;

    BEGIN
        INSERT INTO public.pronunciation_history (user_id, word_id, word_text, score, attempted_at)
        VALUES (auth.uid(), current_setting('history_test.word_a')::bigint, 'Cześć', 10, now());
        RAISE EXCEPTION 'Duplicate user/word unexpectedly allowed';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;

    BEGIN
        INSERT INTO public.pronunciation_history (user_id, word_id, word_text, score, attempted_at)
        VALUES (current_setting('history_test.user_b')::uuid, current_setting('history_test.word_a')::bigint, 'Cześć', 70, now());
        RAISE EXCEPTION 'Insert for another user unexpectedly allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    BEGIN
        UPDATE public.pronunciation_history SET score = NULL, attempted_at = '2026-11-16 10:03:00+00' WHERE user_id = auth.uid();
        RAISE EXCEPTION 'Null score unexpectedly allowed';
    EXCEPTION WHEN not_null_violation THEN NULL;
    END;

    BEGIN
        UPDATE public.pronunciation_history SET score = 'NaN'::double precision, attempted_at = '2026-11-16 10:03:00+00' WHERE user_id = auth.uid();
        RAISE EXCEPTION 'Invalid score unexpectedly allowed';
    EXCEPTION WHEN check_violation THEN NULL;
    END;

    BEGIN
        UPDATE public.pronunciation_history SET user_id = current_setting('history_test.user_b')::uuid WHERE user_id = auth.uid();
        RAISE EXCEPTION 'Ownership change unexpectedly allowed';
    EXCEPTION WHEN check_violation OR insufficient_privilege THEN NULL;
    END;
END;
$$;

INSERT INTO public.pronunciation_history (user_id, word_id, word_text, score, attempted_at)
VALUES (auth.uid(), current_setting('history_test.word_b')::bigint, 'Dziękuję', 0, '2026-11-16 10:03:00+00');

DO $$
BEGIN
    IF (SELECT count(*) FROM public.pronunciation_history WHERE user_id = auth.uid()) <> 2
        OR (SELECT score FROM public.pronunciation_history WHERE word_id = current_setting('history_test.word_a')::bigint) <> 91 THEN
        RAISE EXCEPTION 'Practicing a different word changed another entry';
    END IF;
END;
$$;

-- A second account can use the same word without seeing or changing A's rows.
SELECT set_config('request.jwt.claim.sub', current_setting('history_test.user_b'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('history_test.user_b'), 'role', 'authenticated')::text, true);

DO $$
DECLARE affected integer;
BEGIN
    IF EXISTS (SELECT 1 FROM public.pronunciation_history) THEN
        RAISE EXCEPTION 'Second user can read another user history';
    END IF;
    UPDATE public.pronunciation_history SET score = 10, attempted_at = now()
    WHERE user_id = current_setting('history_test.user_a')::uuid;
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> 0 THEN RAISE EXCEPTION 'Second user changed another user history'; END IF;

    BEGIN
        INSERT INTO public.pronunciation_history (user_id, word_id, word_text, score, attempted_at)
        VALUES (current_setting('history_test.user_a')::uuid, current_setting('history_test.word_a')::bigint, 'Cześć', 10, now())
        ON CONFLICT (user_id, word_id) DO UPDATE SET score = EXCLUDED.score, attempted_at = EXCLUDED.attempted_at;
        RAISE EXCEPTION 'Cross-account upsert unexpectedly allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END;
$$;

INSERT INTO public.pronunciation_history (user_id, word_id, word_text, score, attempted_at)
VALUES (auth.uid(), current_setting('history_test.word_a')::bigint, 'Cześć', 70, '2026-11-16 10:04:00+00');

DO $$
BEGIN
    IF (SELECT count(*) FROM public.pronunciation_history) <> 1
        OR (SELECT score FROM public.pronunciation_history) <> 70 THEN
        RAISE EXCEPTION 'Second account history is not separate';
    END IF;
END;
$$;

-- An authenticated role with no valid user claim cannot see any records.
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{}', true);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.pronunciation_history) THEN
        RAISE EXCEPTION 'Missing user claim can read history';
    END IF;
END;
$$;

SET LOCAL ROLE anon;
DO $$
BEGIN
    BEGIN
        PERFORM 1 FROM public.pronunciation_history;
        RAISE EXCEPTION 'Anonymous read unexpectedly allowed';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    IF has_table_privilege('anon', 'public.pronunciation_history', 'INSERT')
        OR has_table_privilege('anon', 'public.pronunciation_history', 'UPDATE')
        OR has_table_privilege('authenticated', 'public.pronunciation_history', 'DELETE') THEN
        RAISE EXCEPTION 'Unexpected write/delete privileges';
    END IF;
END;
$$;

RESET ROLE;
DO $$
BEGIN
    IF (SELECT count(*) FROM public.pronunciation_history WHERE user_id IN
        (current_setting('history_test.user_a')::uuid, current_setting('history_test.user_b')::uuid)) <> 3 THEN
        RAISE EXCEPTION 'Expected exactly three isolated history records';
    END IF;
    RAISE NOTICE 'PASS: uniqueness, latest upsert, stale writes, valid scores, account isolation, and anonymous access';
END;
$$;

ROLLBACK;
