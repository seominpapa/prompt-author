import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Prompt Author learning page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Prompt Author — 더 나은 조건, 더 나은 프롬프트<\/title>/);
  assert.match(html, /좋은 결과는/);
  assert.match(html, /상황별 프롬프트 제공 방식|MODE SELECTOR/);
  assert.match(html, /TRY IT YOURSELF/);
  assert.match(html, /YOUR PROMPT/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|react-loading-skeleton/);
});

test("ships the interactive practice tool without starter preview code", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /"use client"/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /const modes/);
  assert.match(page, /캐주얼/);
  assert.match(layout, /lang="ko"/);
  assert.match(layout, /Prompt Author — 더 나은 조건, 더 나은 프롬프트/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("writes a static entry page for Vercel", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
});
