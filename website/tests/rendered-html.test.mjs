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
  const [page, layout, packageJson, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /"use client"/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /const modes/);
  assert.match(page, /values: \["2026년 한국 생성형 AI 시장 조사", "정부·기업 공식 자료를 우선", "출처를 포함한 사실·해석 구분 표"\]/);
  assert.match(page, /setObjective\(practiceSelected\.values\[0\]\)/);
  assert.match(page, /캐주얼/);
  assert.match(page, /PPT 제작/);
  assert.match(page, /getdesign\.md/);
  assert.match(page, /YouMind/);
  assert.match(page, /readDesignFile/);
  assert.match(page, /const \[guideMode, setGuideMode\] = useState<Mode>\("casual"\)/);
  assert.match(page, /const \[practiceMode, setPracticeMode\] = useState<Mode>\("casual"\)/);
  assert.match(page, /onClick=\{\(\) => setGuideMode\(key\)\}/);
  assert.match(page, /className="mode-choices"/);
  assert.match(page, /function selectPracticeMode\(nextMode: Mode\)/);
  assert.match(page, /if \(nextMode === practiceMode\) return/);
  assert.match(page, /setObjective\(""\)/);
  assert.match(page, /setAudience\(""\)/);
  assert.match(page, /setFormat\(""\)/);
  assert.match(page, /setReferencePrompt\(""\)/);
  assert.match(page, /setDesignBrief\(""\)/);
  assert.match(page, /const designReadId = useRef\(0\)/);
  assert.match(page, /designReadId\.current \+= 1/);
  assert.match(page, /const readId = \+\+designReadId\.current/);
  assert.match(page, /if \(readId !== designReadId\.current\) return/);
  assert.match(page, /onClick=\{\(\) => selectPracticeMode\(key\)\}/);
  assert.doesNotMatch(page, /const \[mode, setMode\]/);
  assert.match(page, /href="#workbench"/);
  assert.match(page, /function cancelSmoothScroll\(\)/);
  assert.match(page, /addEventListener\("wheel", cancelSmoothScroll/);
  assert.match(page, /addEventListener\("touchstart", cancelSmoothScroll/);
  assert.match(page, /addEventListener\("keydown", cancelSmoothScrollFromKey/);
  assert.match(page, /window\.scrollTo\(window\.scrollX, window\.scrollY\)/);
  assert.match(css, /html\s*\{[^}]*scroll-behavior:\s*smooth/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[^{]*\{[^}]*html\s*\{[^}]*scroll-behavior:\s*auto/);
  assert.match(layout, /lang="ko"/);
  assert.match(layout, /Prompt Author — 더 나은 조건, 더 나은 프롬프트/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.doesNotMatch(css, /\.practice[^}]*overflow-y:\s*auto/);
});

test("writes a static entry page for Vercel", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
});
