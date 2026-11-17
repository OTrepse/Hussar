// Run from the repository root: node --experimental-vm-modules --test frontend/tests/history_api.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(
    await readFile(new URL("../src/api/history_api.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } },
).outputText;

async function setup({ client = true } = {}) {
    const calls = [];
    const events = [];
    const state = { userId: "user-a", sessionError: null, writeError: null, readError: null, records: [], sessionGate: null };
    const supabase = {
        auth: { async getSession() {
            if (state.sessionGate) await state.sessionGate;
            return { data: { session: state.userId ? { user: { id: state.userId } } : null }, error: state.sessionError };
        } },
        from(table) {
            assert.equal(table, "pronunciation_history");
            const query = { filters: [], orders: [] };
            return {
                async upsert(row, options) {
                    calls.push({ row, options });
                    return { error: state.writeError };
                },
                select(columns, options) { query.columns = columns; query.options = options; return this; },
                eq(...filter) { query.filters.push(filter); return this; },
                order(...order) { query.orders.push(order); return this; },
                async range(from, to) {
                    calls.push({ ...query, from, to });
                    // Deliberately cap responses below the requested page size.
                    return { data: state.records.slice(from, Math.min(to + 1, from + 2)), count: state.records.length, error: state.readError };
                },
            };
        },
    };
    const context = vm.createContext({
        Date: class extends Date { static now() { return 1_800_000_000_000; } },
        Event,
        window: { dispatchEvent(event) { events.push(event.type); } },
    });
    const dependency = new vm.SyntheticModule(["supabase"], function () { this.setExport("supabase", client ? supabase : null); }, { context });
    const module = new vm.SourceTextModule(source, { context });
    await module.link(name => { assert.equal(name, "./supabase_client"); return dependency; });
    await module.evaluate();
    return { api: module.namespace, state, calls, events };
}

const result = (score = 82) => ({
    expectedText: "Cześć",
    evaluation: { score, feedback: "Good match. Keep practicing!", standardScore: 80, contextualScore: 88 },
    results: [],
});

test("completed results use atomic user/word upsert and preserve evaluation values", async () => {
    const { api, calls, events } = await setup();
    await api.savePronunciationHistory("user-a", 101, result());
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.onConflict, "user_id,word_id");
    assert.equal(calls[0].row.user_id, "user-a");
    assert.equal(calls[0].row.word_id, 101);
    assert.equal(calls[0].row.word_text, "Cześć");
    assert.equal(calls[0].row.score, 82);
    assert.equal(calls[0].row.standard_score, 80);
    assert.equal(calls[0].row.contextual_score, 88);
    assert.equal(calls[0].row.feedback, result().evaluation.feedback);
    assert.deepEqual(events, ["pronunciation-history-saved"]);
});

test("invalid and incomplete evaluations never write; zero is valid", async () => {
    const { api, calls } = await setup();
    for (const score of [null, undefined, NaN, Infinity, -1, 101, "85"]) {
        const invalid = result();
        invalid.evaluation.score = score;
        await api.savePronunciationHistory("user-a", 101, invalid);
    }
    for (const wordId of [0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1]) {
        await api.savePronunciationHistory("user-a", wordId, result());
    }
    await api.savePronunciationHistory(undefined, 101, result());
    await api.savePronunciationHistory("user-a", 101, { ...result(), expectedText: " " });
    await api.savePronunciationHistory("user-a", 101, { ...result(), evaluation: null });
    assert.equal(calls.length, 0);
    await api.savePronunciationHistory("user-a", 101, result(0));
    assert.equal(calls[0].row.score, 0);
});

test("missing optional feedback and sub-scores remain absent", async () => {
    const { api, calls } = await setup();
    await api.savePronunciationHistory("user-a", 101, { ...result(), evaluation: { score: 75 } });
    assert.equal(calls[0].row.feedback, null);
    assert.equal(calls[0].row.standard_score, null);
    assert.equal(calls[0].row.contextual_score, null);
});

test("logout and account switches discard an in-flight account's result", async () => {
    const { api, state, calls } = await setup();
    state.userId = null;
    await api.savePronunciationHistory("user-a", 101, result());
    state.userId = "user-b";
    await api.savePronunciationHistory("user-a", 101, result());
    assert.equal(calls.length, 0);
    await api.savePronunciationHistory("user-b", 101, result(70));
    assert.equal(calls[0].row.user_id, "user-b");
});

test("completion timestamps survive out-of-order saves and same-millisecond results", async () => {
    const { api, state, calls } = await setup();
    let release;
    state.sessionGate = new Promise(resolve => { release = resolve; });
    const earlier = api.savePronunciationHistory("user-a", 101, result(65));
    state.sessionGate = null;
    await api.savePronunciationHistory("user-a", 101, result(91));
    release();
    await earlier;
    assert.equal(calls[0].row.score, 91);
    assert.equal(calls[1].row.score, 65);
    assert.ok(calls[1].row.attempted_at < calls[0].row.attempted_at);
});

test("storage and session errors reject without announcing a successful save", async () => {
    const { api, state, events } = await setup();
    state.writeError = new Error("Database unavailable");
    await assert.rejects(api.savePronunciationHistory("user-a", 101, result()), /Database unavailable/);
    state.sessionError = new Error("Session unavailable");
    await assert.rejects(api.savePronunciationHistory("user-a", 101, result()), /Session unavailable/);
    assert.deepEqual(events, []);
    const missing = await setup({ client: false });
    await assert.rejects(missing.api.savePronunciationHistory("user-a", 101, result()), /not configured/);
});

test("reads filter the owner, sort newest first, and retrieve every page", async () => {
    const { api, state, calls } = await setup();
    state.records = Array.from({ length: 5 }, (_, id) => ({ id }));
    const entries = await api.listPronunciationHistory("user-a");
    assert.equal(entries.length, 5);
    assert.deepEqual(calls.map(call => call.from), [0, 2, 4]);
    for (const call of calls) {
        assert.equal(call.filters[0][0], "user_id");
        assert.equal(call.filters[0][1], "user-a");
        assert.equal(call.orders[0][0], "attempted_at");
        assert.equal(call.orders[0][1].ascending, false);
    }
});

test("empty history and read errors are distinguishable", async () => {
    const { api, state } = await setup();
    assert.equal((await api.listPronunciationHistory("user-a")).length, 0);
    state.readError = new Error("History unavailable");
    await assert.rejects(api.listPronunciationHistory("user-a"), /History unavailable/);
});
