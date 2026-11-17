// Run from the repository root: node frontend/tests/history_browser.mjs
// Isolated mocked services; no real credentials, recordings, or account data.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

const origin = "http://127.0.0.1:5193";
process.env.VITE_SUPABASE_URL = "https://hussar-history-test.supabase.co";
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_history_test";
process.env.VITE_API_BASE_URL = "http://localhost:8080";
const server = await createServer({ root: resolve("frontend"), configFile: false, plugins: [react()], server: { host: "127.0.0.1", port: 5193, strictPort: true } });
await server.listen();
const profile = await mkdtemp(join(tmpdir(), "hussar-history-browser-"));
const chrome = spawn(process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", [
    "--headless=new", "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--remote-debugging-pipe",
    `--user-data-dir=${profile}`, "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "about:blank",
], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"], windowsHide: true });
let nextId = 0, buffer = "", sid;
const pending = new Map(), events = new Map(), browserErrors = [], checks = [], requests = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function send(method, params = {}, sessionId = sid) {
    return new Promise((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
        pending.set(id, { resolve, reject, timer });
        chrome.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + "\0");
    });
}
chrome.on("error", error => { for (const call of pending.values()) { clearTimeout(call.timer); call.reject(error); } });
chrome.stdio[4].on("data", chunk => {
    buffer += chunk.toString();
    let end;
    while ((end = buffer.indexOf("\0")) !== -1) {
        const message = JSON.parse(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
        if (message.id) {
            const call = pending.get(message.id);
            if (!call) continue;
            clearTimeout(call.timer); pending.delete(message.id);
            message.error ? call.reject(new Error(JSON.stringify(message.error))) : call.resolve(message.result);
        } else for (const handler of events.get(message.method) ?? []) Promise.resolve(handler(message)).catch(error => browserErrors.push(error.message));
    }
});
function on(name, handler) { events.set(name, [...(events.get(name) ?? []), handler]); }
const users = ["a", "b"].map((letter, index) => ({
    id: `11111111-1111-4111-8111-11111111111${index + 1}`, email: `${letter}@example.test`,
    aud: "authenticated", role: "authenticated", created_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(), app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, identities: [],
}));
function session(user) {
    const now = Math.floor(Date.now() / 1000);
    const encode = data => Buffer.from(JSON.stringify(data)).toString("base64url");
    return { user, access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", role: "authenticated", exp: now + 3600, iat: now })}.test`, refresh_token: user.id, expires_in: 3600, expires_at: now + 3600, token_type: "bearer" };
}
const words = [
    { id: 101, polishText: "Cześć", englishText: "Hello" },
    { id: 102, polishText: "Dziękuję", englishText: "Thank you" },
].map(word => ({ ...word, courses: ["Polish 101"], category: "lesson-1", difficulty: "beginner", phoneticPronunciationText: "", referenceAudio: "" }));
const records = new Map();
let nextScore = 65, failEvaluation = false, failWrite = false, failRead = false, holdWrites = false, heldWrite;
on("Fetch.requestPaused", async ({ params, sessionId }) => {
    const { requestId, request } = params;
    const url = new URL(request.url);
    if (request.method !== "OPTIONS") requests.push({ method: request.method, path: url.pathname });
    let body = null;
    try { body = JSON.parse(request.postData ?? "null"); } catch {}
    let status = 200, response = {}, total;
    const authorization = Object.entries(request.headers).find(([name]) => name.toLowerCase() === "authorization")?.[1];
    const userId = authorization?.startsWith("Bearer ") && authorization.split(".").length === 3
        ? JSON.parse(Buffer.from(authorization.split(".")[1], "base64url").toString()).sub : null;
    if (request.method === "OPTIONS") status = 204;
    else if (url.pathname === "/auth/v1/token") response = session(users.find(user => user.email === body.email || user.id === body.refresh_token) ?? users[0]);
    else if (url.pathname === "/auth/v1/user") response = users.find(user => user.id === userId);
    else if (url.pathname === "/auth/v1/logout") status = 204;
    else if (url.pathname === "/api/practice-items") response = words;
    else if (url.pathname === "/api/speech/transcribe") {
        status = failEvaluation ? 500 : 200;
        // The existing upload sends practiceItemId as multipart form data.
        const id = Number(request.postData?.match(/name="practiceItemId"\r?\n\r?\n(\d+)/)?.[1] ?? 101);
        response = failEvaluation ? { message: "Evaluation failed" } : {
            expectedText: words.find(word => word.id === id).polishText,
            evaluation: { score: nextScore, feedback: "Existing evaluation feedback", standardScore: nextScore, contextualScore: null }, results: [],
        };
    } else if (url.pathname === "/rest/v1/pronunciation_history") {
        if (request.method === "POST") {
            if (holdWrites) await new Promise(resolve => { heldWrite = resolve; });
            if (failWrite) { status = 500; response = { message: "Storage unavailable" }; }
            else {
                assert.equal(body.user_id, userId);
                assert.equal(url.searchParams.get("on_conflict"), "user_id,word_id");
                const key = `${body.user_id}:${body.word_id}`, previous = records.get(key);
                if (!previous || body.attempted_at > previous.attempted_at) records.set(key, { id: previous?.id ?? `record-${records.size}`, ...body });
                status = 201; response = null;
            }
        } else {
            if (failRead) { status = 500; response = { message: "Read unavailable" }; }
            else {
                assert.equal(url.searchParams.get("user_id"), `eq.${userId}`);
                response = [...records.values()].filter(row => row.user_id === userId).sort((a, b) => b.attempted_at.localeCompare(a.attempted_at));
                total = response.length;
            }
        }
    } else throw new Error(`Unexpected request: ${request.method} ${url.href}`);
    await send("Fetch.fulfillRequest", { requestId, responseCode: status, responseHeaders: [
        { name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: "*" },
        { name: "Access-Control-Allow-Headers", value: "*" }, { name: "Access-Control-Allow-Methods", value: "*" },
        { name: "Access-Control-Expose-Headers", value: "Content-Range" },
        ...(total !== undefined ? [{ name: "Content-Range", value: total ? `0-${total - 1}/${total}` : "*/0" }] : []),
    ], body: status === 204 ? "" : Buffer.from(JSON.stringify(response)).toString("base64") }, sessionId);
});
async function evaluate(expression) {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
}
async function wait(expression, description = expression) {
    for (let i = 0; i < 180; i++) { if (await evaluate(expression)) return; await delay(60); }
    throw new Error(`Timed out: ${description}\n${await evaluate("document.body.innerText")}\n${browserErrors.join("\n")}`);
}
async function click(text) {
    await wait(`[...document.querySelectorAll('button,a')].some(el => el.textContent.trim() === ${JSON.stringify(text)} && !el.disabled)`);
    await evaluate(`[...document.querySelectorAll('button,a')].find(el => el.textContent.trim() === ${JSON.stringify(text)}).click()`);
}
async function field(name, value) {
    await evaluate(`(() => { const el = document.querySelector('input[name="${name}"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
}
async function login(index) {
    await wait("document.querySelector('input[name=email]') !== null");
    await field("email", users[index].email); await field("password", "TestPassword123!");
    await evaluate("document.querySelector('button[type=submit]').click()");
    await wait("location.pathname === '/' && [...document.querySelectorAll('button')].some(el => el.textContent.trim() === 'Logout')");
}
async function practice(score, index = 0) {
    nextScore = score;
    await click("Courses");
    await wait("[...document.querySelectorAll('button')].some(el => el.getAttribute('aria-label') === 'Practice Polish 101')");
    await evaluate("document.querySelector('[aria-label=\"Practice Polish 101\"]').click()");
    const card = `[...document.querySelectorAll('.practiceCard')][${index}]`;
    await wait(`Boolean(${card}?.querySelector('button'))`);
    await evaluate(`${card}.querySelectorAll('button')[1].click()`);
    await wait(`[...${card}.querySelectorAll('button')].some(el => el.textContent.trim() === 'Stop')`);
    await delay(180);
    await evaluate(`[...${card}.querySelectorAll('button')].find(el => el.textContent.trim() === 'Stop').click()`);
    await wait(failEvaluation ? "document.body.innerText.includes('Transcription failed (500)')" : "document.body.innerText.includes('Experimental transcription-match score')");
}
function pass(message) { checks.push(message); console.log(`PASS ${message}`); }
try {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    ({ sessionId: sid } = await send("Target.attachToTarget", { targetId, flatten: true }));
    on("Runtime.exceptionThrown", ({ params }) => browserErrors.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text));
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send("Fetch.enable", { patterns: [{ urlPattern: "*hussar-history-test.supabase.co/*" }, { urlPattern: "http://localhost:8080/*" }] });
    await send("Page.navigate", { url: `${origin}/history` });
    await wait("location.pathname === '/login'");
    pass("Unauthenticated History access redirects to existing login");
    await login(0); await click("History");
    await wait("document.body.innerText.includes('No pronunciation history yet.')");
    assert.equal(requests.filter(request => request.method === "POST" && request.path.endsWith("pronunciation_history")).length, 0);
    pass("Empty History shows the required text and creates no records");
    await click("Courses");
    await wait("document.querySelector('[aria-label=\"Practice Polish 101\"]') !== null");
    await evaluate("document.querySelector('[aria-label=\"Practice Polish 101\"]').click()");
    await wait("document.querySelectorAll('.practiceCard').length === 2");
    await evaluate("document.querySelector('.practiceCard button').click()");
    await delay(150);
    assert.equal(records.size, 0);
    await evaluate("document.querySelector('.practiceCard').querySelectorAll('button')[1].click()");
    await wait("document.querySelector('[aria-label=\"Stop recording Cześć\"]') !== null");
    await click("History");
    await wait("document.body.innerText.includes('No pronunciation history yet.')");
    await delay(150);
    assert.equal(requests.filter(request => request.path === "/api/speech/transcribe").length, 0);
    assert.equal(records.size, 0);
    pass("Listening and canceling a recording by navigating away create no evaluation or history");
    await practice(65);
    await wait("!document.body.innerText.includes('Evaluating pronunciation...')");
    await click("History");
    await wait("document.body.innerText.includes('Latest Score: 65%')");
    assert.equal(records.size, 1);
    pass("Existing recorder and result display create the first history record");
    await practice(91); await click("History");
    await wait("document.body.innerText.includes('Latest Score: 91%')");
    assert.equal(records.size, 1);
    pass("Repeating a word replaces its score without adding a second row");
    await practice(0, 1); await click("History");
    await wait("document.querySelectorAll('ul[aria-label=\"Latest pronunciation attempts\"] > li').length === 2");
    assert.equal(await evaluate("document.querySelector('ul[aria-label=\"Latest pronunciation attempts\"] h2').textContent"), "Dziękuję");
    pass("Different words remain separate; zero scores and newest-first sorting work");
    await send("Page.reload");
    await wait("document.body.innerText.includes('Latest Score: 91%') && document.body.innerText.includes('Latest Score: 0%')");
    pass("Browser refresh restores the authenticated user's saved history");
    failEvaluation = true; await practice(20); failEvaluation = false;
    await click("History"); await wait("document.body.innerText.includes('Latest Score: 91%')");
    assert.equal(records.size, 2);
    await practice(null); await click("History"); await wait("document.body.innerText.includes('Latest Score: 91%')");
    pass("Failed and unevaluable recordings preserve the previous completed attempt");
    failWrite = true; await practice(82);
    await wait("document.body.innerText.includes('could not be saved to History')");
    assert.equal(await evaluate("document.body.innerText.includes('82%')"), true);
    failWrite = false; await click("History"); await wait("document.body.innerText.includes('Latest Score: 91%')");
    pass("Storage errors show a warning while pronunciation results remain visible");
    holdWrites = true; await practice(94); await click("History");
    await wait("document.body.innerText.includes('Latest Score: 91%')");
    holdWrites = false; heldWrite();
    await wait("document.body.innerText.includes('Latest Score: 94%')");
    pass("History refreshes when a pending background save finishes after navigation");
    failRead = true; await send("Page.reload");
    await wait("document.body.innerText.includes(\"We couldn't load your pronunciation history.\")");
    failRead = false; await click("Try again"); await wait("document.body.innerText.includes('Latest Score: 94%')");
    pass("Read failures show a working retry action");
    await click("Logout"); await wait("location.pathname === '/login'");
    await login(1); await click("History"); await wait("document.body.innerText.includes('No pronunciation history yet.')");
    await practice(70); await click("History"); await wait("document.body.innerText.includes('Latest Score: 70%')");
    assert.equal(await evaluate("document.body.innerText.includes('Latest Score: 94%')"), false);
    assert.equal(records.size, 3);
    pass("Two accounts practicing the same word have separate histories");
    await click("Logout"); await wait("location.pathname === '/login'"); await login(0); await click("History");
    await wait("document.body.innerText.includes('Latest Score: 94%') && document.body.innerText.includes('Latest Score: 0%')");
    pass("Logging out and back in restores the original account's history");
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 860, deviceScaleFactor: 1, mobile: true });
    assert.equal(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), true);
    assert.equal(await evaluate("document.querySelector('time')?.hasAttribute('datetime')"), true);
    pass("Mobile History has no horizontal overflow and uses semantic date markup");
    assert.deepEqual(browserErrors, []);
    pass("No uncaught browser exceptions");
} finally {
    await mkdir(resolve("tmp"), { recursive: true });
    await writeFile(resolve("tmp/history-browser-results.json"), JSON.stringify({ checks, browserErrors }, null, 2));
    try { await send("Browser.close"); } catch {}
    chrome.kill(); await server.close();
}
