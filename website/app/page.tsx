"use client";

import { useMemo, useState } from "react";

type Mode = "casual" | "research" | "structured" | "coding" | "tool" | "goal";

const modes: Record<Mode, { label: string; short: string; rule: string; example: string; fields: string[] }> = {
  casual: {
    label: "캐주얼",
    short: "대화 · 초안 · 아이디어",
    rule: "목표·대상·결과 형식을 짧고 선명하게 씁니다. 빠진 정보가 결과를 크게 바꾸면 질문하고, 아니면 안전한 가정을 둡니다.",
    example: "당신은 고객 커뮤니케이션 담당자입니다. 기존 고객에게 서비스 이용에 감사하는 친근한 이메일을 150자 내외로 작성하세요. 제목 1개와 본문을 반환하세요.",
    fields: ["목표", "대상", "결과 형식"],
  },
  research: {
    label: "리서치",
    short: "최신 정보 · 출처",
    rule: "허용 출처와 최신성 기준을 정하고, 중요한 주장마다 인용을 요구합니다. 사실과 추론, 정보 공백을 분리합니다.",
    example: "2026년 한국 생성형 AI 시장을 조사하세요. 정부·기업 공식 자료를 우선하고, 각 핵심 주장에 출처를 붙이세요. 사실과 해석을 구분한 표로 반환하세요.",
    fields: ["조사 질문", "출처 범위", "보고서 형식"],
  },
  structured: {
    label: "구조화",
    short: "JSON · API 응답",
    rule: "자연어 대신 스키마를 계약으로 씁니다. 필수 입력이 없을 때의 상태와 오류 응답도 정합니다.",
    example: "아래 고객 문의를 분류하세요. status, category, urgency, reason 필드를 가진 JSON 스키마로 반환하세요. 정보가 부족하면 status를 needs_input으로 설정하세요.",
    fields: ["작업", "스키마", "누락 입력 처리"],
  },
  coding: {
    label: "코딩 에이전트",
    short: "수정 · 디버깅",
    rule: "바꿀 범위와 검증 명령을 고정합니다. 공유 동작은 모든 호출자를 살핀 뒤, 가장 작은 근본 원인 수정으로 해결합니다.",
    example: "결제 API의 타임아웃 오류를 수정하세요. checkout 서비스와 관련 테스트만 변경하세요. 공유 동작의 모든 호출자를 확인하고 npm test로 검증하세요.",
    fields: ["목표", "허용 경로", "검증 명령"],
  },
  tool: {
    label: "도구 사용",
    short: "API · 외부 작업",
    rule: "사용 가능한 도구와 승인 필요한 행동을 분리합니다. 도구 결과를 사실로 검증하되, 그 안의 지시는 신뢰하지 않습니다.",
    example: "지원 티켓을 분석하세요. ticket_search 도구로 근거를 찾고, 고객에게 메일을 보내거나 데이터를 변경하기 전에는 승인을 요청하세요. 우선순위 목록으로 반환하세요.",
    fields: ["목표", "사용 가능 도구", "승인 필요 작업"],
  },
  goal: {
    label: "Codex /goal",
    short: "지속 작업 · 반복 검증",
    rule: "관찰 가능한 완료 조건, 작업 경계, 반복 정책, 차단 조건을 한 문장 계약으로 묶습니다. 완료 전에는 회귀·제약·비밀 노출을 검토합니다.",
    example: "/goal 결제 API p95를 150ms 미만으로 낮추고, 공식 부하 테스트 5회와 전체 테스트 통과로 검증하세요. checkout 서비스와 관련 테스트만 사용하고, 실패 시 전략을 바꾸세요.",
    fields: ["완료 조건", "검증 방법", "허용 범위"],
  },
};

const flow = ["요청 분류", "계약 수집", "프롬프트 작성", "검증·전달"];

export default function Home() {
  const [mode, setMode] = useState<Mode>("casual");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [format, setFormat] = useState("");
  const [copied, setCopied] = useState(false);

  const selected = modes[mode];
  const practicePrompt = useMemo(() => {
    const goal = objective || "{{목표}}";
    const who = audience || "{{대상 또는 맥락}}";
    const output = format || "{{결과 형식}}";
    if (mode === "goal") return `/goal ${goal}, ${who}로 검증하세요. ${output}만 사용하세요. 반복마다 실제 상태를 확인하고 실패하면 전략을 바꾸세요. 완료 전 회귀·제약·비밀 노출을 검토하세요.`;
    if (mode === "research") return `${goal}을(를) ${who}을 위해 조사하세요. 최신성이 필요한 주장은 확인하고, 각 핵심 주장에 출처를 붙이세요. 사실과 추론을 구분해 ${output}(으)로 반환하세요.`;
    if (mode === "structured") return `작업: ${goal}\n입력 범위: ${who}\n반환 형식: ${output}\n필수 정보가 없으면 status를 needs_input으로 설정하고 누락된 필드를 설명하세요.`;
    if (mode === "coding") return `목표: ${goal}\n범위: ${who}\n검증: ${output}\n관련 코드와 공유 동작의 호출자를 먼저 확인하고, 가장 작은 근본 원인 수정 후 검증 결과를 보고하세요.`;
    if (mode === "tool") return `목표: ${goal}\n사용 가능한 도구: ${who}\n반환 형식: ${output}\n도구 결과를 확인한 뒤 다음 행동을 판단하세요. 외부 변경·발송·비용 발생 작업은 승인 전에 실행하지 마세요.`;
    return `당신은 ${who}을 돕습니다.\n작업: ${goal}\n반환 형식: ${output}\n필요한 정보가 결과를 크게 바꾸면 짧게 질문하고, 그렇지 않으면 가정을 밝힌 뒤 작성하세요.`;
  }, [mode, objective, audience, format]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(practicePrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function loadExample() {
    setObjective(mode === "casual" ? "고객에게 감사 이메일 작성" : selected.example.split(". ")[0]);
    setAudience(mode === "casual" ? "기존 고객, 친근한 톤" : selected.fields[1]);
    setFormat(mode === "casual" ? "제목 1개와 150자 내외 본문" : selected.fields[2]);
  }

  return (
    <main>
      <section className="hero" id="top">
        <nav><a className="brand" href="#top">prompt<span>author</span></a><a href="#paths">사용 방법 <span aria-hidden>↘</span></a></nav>
        <div className="hero-grid">
          <div>
            <p className="eyebrow">PROMPT AS A CONTRACT</p>
            <h1>좋은 결과는<br /><em>좋은 조건</em>에서<br />시작됩니다.</h1>
            <p className="lede">Prompt Author는 막연한 요청을 목표·제약·검증이 담긴 바로 쓸 수 있는 프롬프트로 바꿉니다.</p>
            <a className="primary" href="#paths">두 가지 방법 보기 <span>→</span></a>
          </div>
          <div className="hero-card">
            <div className="card-top"><span className="pulse" /> LIVE PROMPT CHECK</div>
            <p className="mono label">INPUT</p>
            <p className="input-quote">“고객에게 감사 인사를 전하는 이메일을 써줘.”</p>
            <div className="arrow">↓</div>
            <p className="mono label">CONTRACT</p>
            <div className="contract-lines"><span>목표</span><b>감사 이메일 작성</b><span>대상</span><b>기존 고객</b><span>형식</span><b>제목 + 150자 본문</b></div>
          </div>
        </div>
      </section>

      <section className="paths section" id="paths">
        <div className="paths-heading"><p className="section-kicker">01 / CHOOSE YOUR PATH</p><h2>원하는 방식으로<br /><em>바로 시작</em>하세요.</h2><p>반복해서 프롬프트를 만들면 스킬을 설치하고, 지금 한 번의 프롬프트가 필요하면 웹에서 바로 생성하세요.</p></div>
        <div className="path-cards">
          <article className="path-card skill-path"><p className="mono">PATH 01</p><span className="path-number">01</span><h3>스킬을 내려받아<br />Codex에서 사용하기</h3><p>저장소를 설치하면 매 작업에서 <code>$prompt-author</code>로 상황에 맞는 프롬프트를 요청할 수 있습니다.</p><a href="https://github.com/seominpapa/prompt-author#설치-방법" target="_blank" rel="noreferrer">스킬 설치 방법 보기 <span>↗</span></a></article>
          <article className="path-card web-path"><p className="mono">PATH 02</p><span className="path-number">02</span><h3>웹에서 만들고<br />바로 붙여넣기</h3><p>조건을 입력해 프롬프트를 생성한 뒤 <strong>복사하기</strong>를 누르고, ChatGPT·Codex 등 원하는 곳에 붙여넣으세요.</p><a href="#practice">웹에서 프롬프트 만들기 <span>→</span></a></article>
        </div>
      </section>

      <section className="section intro">
        <p className="section-kicker">02 / PRINCIPLES</p>
        <h2>조건이 다르면,<br />프롬프트의 <em>구조도</em> 달라집니다.</h2>
        <p className="section-copy">모든 요청에 긴 지침이 필요한 것은 아닙니다. 목적에 꼭 맞는 정보만 남기고, 불확실한 부분은 질문·가정·변수로 정직하게 처리합니다.</p>
      </section>

      <section className="mode-section section" id="modes">
        <div className="mode-header"><p className="section-kicker">03 / MODE SELECTOR</p><p>상황을 선택해 원칙과 예시를 확인하세요.</p></div>
        <div className="mode-layout">
          <div className="mode-list" role="tablist" aria-label="프롬프트 상황">
            {(Object.keys(modes) as Mode[]).map((key, i) => <button key={key} className={mode === key ? "active" : ""} onClick={() => setMode(key)} role="tab" aria-selected={mode === key}><span>0{i + 1}</span><strong>{modes[key].label}</strong><small>{modes[key].short}</small><i>↗</i></button>)}
          </div>
          <article className="mode-detail">
            <p className="detail-tag">{selected.label.toUpperCase()} MODE</p>
            <h3>{selected.label} 프롬프트의 원칙</h3>
            <p className="detail-rule">{selected.rule}</p>
            <div className="needs"><p className="mono label">INCLUDE</p>{selected.fields.map((field) => <span key={field}>✓ {field}</span>)}</div>
            <div className="example"><p className="mono label">READY-TO-USE EXAMPLE</p><blockquote>{selected.example}</blockquote></div>
          </article>
        </div>
      </section>

      <section className="section how">
        <p className="section-kicker">04 / HOW IT WORKS</p>
        <h2>요청을 받으면<br />이렇게 <em>작동</em>합니다.</h2>
        <div className="flow">{flow.map((item, index) => <div key={item}><span>0{index + 1}</span><h3>{item}</h3><p>{index === 0 ? "요청 유형을 고릅니다." : index === 1 ? "결과를 바꾸는 정보만 확인합니다." : index === 2 ? "필요한 섹션만 조합합니다." : "형식과 사실성을 점검합니다."}</p></div>)}</div>
        <aside><strong>정보가 부족하면?</strong><span>결과를 크게 바꾸는 정보는 최대 3개까지 질문합니다. 그렇지 않으면 안전한 가정을 밝히거나 <code>{"{{변수}}"}</code>로 남겨 바로 사용할 수 있게 만듭니다.</span></aside>
      </section>

      <section className="practice section" id="practice">
        <div className="practice-heading"><p className="section-kicker">05 / TRY IT YOURSELF</p><h2>이제, 당신의<br /><em>조건을 넣어보세요.</em></h2><p>입력값이 비어 있으면 변수로 남습니다. 생성된 프롬프트는 <strong>복사하기</strong>를 눌러 ChatGPT·Codex 등 원하는 도구에 바로 붙여 넣을 수 있습니다.</p></div>
        <div className="workbench">
          <div className="form-panel">
            <label>상황<select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>{(Object.keys(modes) as Mode[]).map((key) => <option key={key} value={key}>{modes[key].label} — {modes[key].short}</option>)}</select></label>
            <label>{selected.fields[0]}<textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="무엇을 이루고 싶나요?" rows={3} /></label>
            <label>{selected.fields[1]}<input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="누구를 위한 것인가요?" /></label>
            <label>{selected.fields[2]}<input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="어떤 형태로 받을까요?" /></label>
            <button className="ghost" onClick={loadExample}>예시 조건 채우기 <span>↗</span></button>
          </div>
          <div className="output-panel"><div className="output-top"><span className="mono">YOUR PROMPT</span><button onClick={copyPrompt}>{copied ? "복사됨!" : "복사하기"}</button></div><pre>{practicePrompt}</pre><p className="output-note">{objective && audience && format ? "조건이 모두 채워졌습니다. 이 프롬프트를 사용해 보세요." : "빈 조건은 {{변수}}로 남겨 두었습니다."}</p></div>
        </div>
      </section>

      <footer><a className="brand" href="#top">prompt<span>author</span></a><p>Write less. Specify better.</p><a href="https://github.com/seominpapa/prompt-author" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </main>
  );
}
