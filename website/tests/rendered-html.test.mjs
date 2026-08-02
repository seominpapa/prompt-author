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
  assert.match(html, /자율 실행·\/goal/);
  assert.match(html, /Codex·Claude Code에서 사용하기/);
  assert.match(html, /ChatGPT·Codex·Claude/);
  assert.match(html, /일반 대화·초안/);
  assert.match(html, /JSON 등 구조화된 출력/);
  assert.match(html, /코드 작성·설명/);
  assert.match(html, /Codex·Claude Code 에이전트 작업/);
  assert.match(html, /도구·API 사용/);
  assert.match(html, /기존 프롬프트 개선/);
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
  assert.match(page, /일반 대화·초안/);
  assert.match(page, /PPT 제작/);
  assert.match(page, /자율 실행·\/goal/);
  assert.match(page, /Codex·Claude Code에서 사용하기/);
  assert.match(page, /Codex에서는 <code>\$prompt-author<\/code>/);
  assert.match(page, /Claude Code에서는 <code>\/prompt-author<\/code>/);
  assert.match(page, /ChatGPT·Codex·Claude/);
  assert.match(page, /검증 명령과 결과를 대화에 남기세요/);
  assert.match(page, /practicePrompt\.length > 4000/);
  assert.match(page, /Claude Code의 \/goal 조건은 4,000자 이내로 줄여야 합니다/);
  assert.match(page, /if \(practiceMode === "code"\)/);
  assert.match(page, /if \(practiceMode === "eval"\)/);
  assert.match(page, /확인된 사실·불확실한 내용·가정을 구분/);
  assert.match(page, /사람의 최종 확인이 필요한 부분/);
  assert.doesNotMatch(page, /Codex에서 사용하기/);
  assert.doesNotMatch(page, /label: "Codex \/goal"/);
  assert.match(page, /getdesign\.md/);
  assert.match(page, /YouMind/);
  assert.match(page, /readDesignFile/);
  assert.match(page, /const \[guideMode, setGuideMode\] = useState<Mode>\("casual"\)/);
  assert.match(page, /const \[practiceMode, setPracticeMode\] = useState<Mode>\("casual"\)/);
  assert.match(page, /onClick=\{\(\) => setGuideMode\(key\)\}/);
  assert.match(page, /String\(i \+ 1\)\.padStart\(2, "0"\)/);
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

test("keeps the README, skill, patterns, and website terminology aligned", async () => {
  const [readme, skill, patterns, page] = await Promise.all([
    readFile(new URL("../../README.md", import.meta.url), "utf8"),
    readFile(new URL("../../SKILL.md", import.meta.url), "utf8"),
    readFile(new URL("../../references/prompt-patterns.md", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  for (const label of ["일반 대화·초안", "JSON 등 구조화된 출력", "코드 작성·설명", "Codex·Claude Code 에이전트 작업", "도구·API 사용", "기존 프롬프트 개선"]) {
    assert.match(readme, new RegExp(label));
    assert.match(page, new RegExp(label));
  }
  assert.match(readme, /\| 작성 상황 \| 언제 사용하는지 \| 제공되는 프롬프트 \|/);
  assert.match(readme, /확인된 사실·불확실한 내용·가정/);
  assert.match(readme, /사람의 최종 확인/);
  assert.match(skill, /\| `code` \| code writing, explanation, and review/);
  assert.match(skill, /verified facts, uncertainty, and assumptions/);
  assert.match(patterns, /## Code writing and explanation/);
  assert.match(patterns, /## Prompt evaluation and improvement/);
  assert.match(patterns, /does not replace casual, research, structured, code, coding-agent/);
});
