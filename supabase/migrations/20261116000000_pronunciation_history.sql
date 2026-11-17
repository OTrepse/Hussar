BEGIN;

-- Additive only: existing authentication and vocabulary tables are unchanged.
CREATE TABLE public.pronunciation_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id bigint NOT NULL REFERENCES public.practice_items(id),
    word_text text NOT NULL CHECK (length(btrim(word_text)) > 0),
    -- The existing evaluator returns transcription-match scores from 0 to 100.
    score double precision NOT NULL CHECK (score >= 0 AND score <= 100),
    feedback text,
    standard_score double precision CHECK (standard_score >= 0 AND standard_score <= 100),
    contextual_score double precision CHECK (contextual_score >= 0 AND contextual_score <= 100),
    attempted_at timestamptz NOT NULL CHECK (isfinite(attempted_at)),
    CONSTRAINT pronunciation_history_user_word_key UNIQUE (user_id, word_id)
);

CREATE INDEX pronunciation_history_user_latest_idx
    ON public.pronunciation_history (user_id, attempted_at DESC, word_id);

ALTER TABLE public.pronunciation_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.pronunciation_history FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.pronunciation_history TO authenticated;

CREATE POLICY pronunciation_history_select_own
    ON public.pronunciation_history FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY pronunciation_history_insert_own
    ON public.pronunciation_history FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY pronunciation_history_update_own
    ON public.pronunciation_history FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Upserts lock the conflicting row. Compare completion timestamps under that
-- lock so a delayed write from another request/tab/device cannot replace a
-- more recently completed evaluation. Equal timestamps are idempotent retries.
CREATE FUNCTION public.keep_latest_pronunciation_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
        OR NEW.word_id IS DISTINCT FROM OLD.word_id THEN
        RAISE EXCEPTION 'History ownership and word cannot be changed'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.attempted_at <= OLD.attempted_at THEN
        RETURN NULL;
    END IF;

    -- Keep the history record identifier stable across repeat attempts.
    NEW.id := OLD.id;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.keep_latest_pronunciation_history() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER pronunciation_history_keep_latest
    BEFORE UPDATE ON public.pronunciation_history
    FOR EACH ROW EXECUTE FUNCTION public.keep_latest_pronunciation_history();

COMMIT;
