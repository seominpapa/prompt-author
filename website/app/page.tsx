"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "casual" | "research" | "structured" | "code" | "coding" | "tool" | "image" | "video" | "presentation" | "goal" | "eval";

const modes: Record<Mode, { label: string; short: string; rule: string; example: string; fields: string[]; values: [string, string, string] }> = {
  casual: {
    label: "일반 대화·초안",
    short: "대화 · 초안 · 아이디어",
    rule: "목표·대상·결과 형식을 짧게 씁니다. 중요한 사실이나 판단이 있으면 근거를 확인하고, 확인된 사실·불확실한 내용·가정을 구분하며, 사람의 최종 확인이 필요한 부분을 표시합니다.",
    example: "기존 고객에게 서비스 이용에 감사하는 친근한 이메일을 150자 내외로 작성하세요. 사실 판단이 필요한 내용은 근거와 불확실성을 구분하고, 사람의 최종 확인이 필요한 부분을 표시하세요. 제목 1개와 본문을 반환하세요.",
    fields: ["작성 목표", "대상·말투", "분량·결과 형식"],
    values: ["고객에게 감사 이메일 작성", "기존 고객, 친근한 톤", "제목 1개와 150자 내외 본문"],
  },
  research: {
    label: "리서치",
    short: "최신 정보 · 출처",
    rule: "허용 출처와 최신성 기준을 정하고, 중요한 주장마다 인용을 요구합니다. 사실과 추론, 정보 공백을 분리합니다.",
    example: "2026년 한국 생성형 AI 시장을 조사하세요. 정부·기업 공식 자료를 우선하고, 각 핵심 주장에 출처를 붙이세요. 사실과 해석을 구분한 표로 반환하세요.",
    fields: ["조사 질문", "출처 범위", "보고서 형식"],
    values: ["2026년 한국 생성형 AI 시장 조사", "정부·기업 공식 자료를 우선", "출처를 포함한 사실·해석 구분 표"],
  },
  structured: {
    label: "JSON 등 구조화된 출력",
    short: "JSON · API 응답",
    rule: "프로그램이 바로 처리할 수 있도록 필드명·자료형·필수값·허용값·중첩 구조를 스키마로 정하고, 누락·오류 처리와 비즈니스 규칙 검증까지 지정합니다.",
    example: "고객 문의를 분류하세요. status, category, urgency, reason의 자료형·필수값·허용값을 정의한 JSON 스키마로 반환하고, 정보가 부족하면 status를 needs_input으로 설정해 누락 필드를 설명하세요.",
    fields: ["처리할 작업", "필드·자료형·허용값", "누락·오류 처리"],
    values: ["고객 문의 분류", "status·category·urgency·reason의 자료형·필수값·허용값", "정보 부족 시 needs_input과 누락 필드 반환"],
  },
  code: {
    label: "코드 작성·설명",
    short: "함수 · 리뷰 · 원인 설명",
    rule: "언어와 실행 환경, 입력·출력, 예외 상황, 성능·보안 제약을 먼저 정하고 실행 가능한 예제나 테스트로 확인하도록 요구합니다.",
    example: "TypeScript로 이메일 형식을 검증하는 함수를 작성하세요. 빈 값과 잘못된 도메인을 처리하고, 입력·출력 예시와 node:test 테스트를 함께 제공하세요.",
    fields: ["작성·설명할 코드", "언어·실행 환경", "입출력·테스트"],
    values: ["이메일 형식 검증 함수 작성", "TypeScript, Node.js 22", "빈 값·잘못된 도메인 테스트와 입력·출력 예시"],
  },
  coding: {
    label: "Codex·Claude Code 에이전트 작업",
    short: "수정 · 디버깅",
    rule: "저장소에서 수정할 범위와 보존할 동작을 고정합니다. 관련 코드와 호출 경로를 조사하고, 최소한의 근본 원인 수정 후 테스트·린트·빌드 결과를 보고하게 합니다.",
    example: "결제 API 타임아웃 오류를 수정하세요. checkout 서비스와 관련 테스트만 변경하고 기존 API 동작을 보존하세요. 호출 경로를 확인한 뒤 npm test와 lint로 검증하고, 변경 파일과 결과를 보고하세요.",
    fields: ["저장소 작업 목표", "허용 경로·보존 동작", "검증 명령"],
    values: ["결제 API 타임아웃 오류 수정", "checkout 서비스와 관련 테스트만 변경, 기존 API 동작 보존", "npm test와 lint 실행 후 변경 파일·결과 보고"],
  },
  tool: {
    label: "도구·API 사용",
    short: "API · 외부 작업",
    rule: "도구와 데이터 범위, 자동 조회와 승인 필요한 생성·수정·발송 작업을 분리합니다. 결과 검증, 오류·재시도 조건, 비밀키 보호와 최종 형식을 지정합니다.",
    example: "지원 티켓을 분석하세요. ticket_search 도구로 근거를 찾고, 고객에게 메일을 보내거나 데이터를 변경하기 전에는 승인을 요청하세요. 우선순위 목록으로 반환하세요.",
    fields: ["작업 목표", "도구·데이터 범위", "승인 작업·결과 형식"],
    values: ["지원 티켓 분석", "ticket_search로 티켓 조회", "메일 발송·데이터 변경 전 승인, 우선순위 목록 반환"],
  },
  image: {
    label: "이미지 제작",
    short: "장면 · 스타일 · 구도",
    rule: "무엇을 보여 줄지 먼저 정한 뒤, 시각 스타일·조명·구도와 비율을 구체적으로 지정합니다. 화면에 없어야 할 요소도 필요한 경우만 짧게 덧붙입니다.",
    example: "비 오는 밤 서울 골목의 작은 서점을 그리세요. 따뜻한 창문 불빛과 젖은 아스팔트 반사를 강조한 시네마틱 필름 사진 스타일, 낮은 시점의 와이드 구도, 16:9 비율. 읽을 수 있는 텍스트나 로고는 넣지 마세요.",
    fields: ["주제·피사체", "시각 스타일·구도", "비율·제약"],
    values: ["비 오는 밤 서울 골목의 작은 서점", "따뜻한 창문 불빛과 젖은 아스팔트 반사, 시네마틱 필름 사진, 낮은 시점 와이드 구도", "16:9 비율, 읽을 수 있는 텍스트·로고 제외"],
  },
  video: {
    label: "영상 제작",
    short: "장면 · 동작 · 촬영",
    rule: "한 장면에서 일어나는 행동을 명확히 쓰고, 카메라 움직임·속도·길이·소리를 지정합니다. 여러 장면을 한 프롬프트에 과도하게 섞지 않습니다.",
    example: "새벽의 한강 자전거 도로를 자전거 한 대가 천천히 지나갑니다. 카메라는 뒤에서 부드럽게 따라가고, 물안개와 잔잔한 바람을 담습니다. 8초, 16:9, 자연스러운 환경음만 사용하고 자막·로고는 넣지 마세요.",
    fields: ["장면·행동", "촬영·연출", "길이·형식"],
    values: ["새벽 한강 자전거 도로를 자전거 한 대가 천천히 지나감", "뒤에서 부드럽게 따라가는 카메라, 물안개와 잔잔한 바람", "8초, 16:9, 자연스러운 환경음만, 자막·로고 제외"],
  },
  presentation: {
    label: "PPT 제작",
    short: "메시지 · 슬라이드 · 디자인",
    rule: "청중과 한 줄 핵심 메시지를 먼저 정하고, 슬라이드별 제목·핵심 내용·시각 자료를 요구합니다. 디자인 기준이 있으면 design.md 내용을 그대로 참고하도록 포함합니다.",
    example: "스타트업 투자자에게 AI 고객지원 제품의 시드 투자를 설득하는 10장 발표 자료를 만드세요. 문제·해결책·시장·제품·성과·비즈니스 모델·경쟁·로드맵·팀·요청 순서로 구성하고, 각 장에 제목·핵심 메시지·권장 시각 자료를 제시하세요.",
    fields: ["발표 목표·청중", "핵심 메시지·구성", "분량·결과 형식"],
    values: ["스타트업 투자자에게 AI 고객지원 제품의 시드 투자를 설득", "문제·해결책·시장·제품·성과·비즈니스 모델·경쟁·로드맵·팀·요청", "10장, 슬라이드별 제목·핵심 메시지·권장 시각 자료"],
  },
  goal: {
    label: "자율 실행·/goal",
    short: "지속 작업 · 반복 검증",
    rule: "Codex와 Claude Code에서 공통으로 쓸 수 있도록 관찰 가능한 완료 조건, 작업 경계, 반복 정책, 차단 조건을 한 문장 계약으로 묶습니다. Claude Code에서는 한 세션에 목표 하나만 활성화되며 조건은 4,000자 이내여야 합니다.",
    example: "/goal 결제 API p95를 150ms 미만으로 낮추고, 공식 부하 테스트 5회와 전체 테스트 통과로 검증하세요. checkout 서비스와 관련 테스트만 사용하고, 실패 시 전략을 바꾸세요.",
    fields: ["완료 조건", "검증 방법", "허용 범위"],
    values: ["결제 API p95를 150ms 미만으로 낮추기", "공식 부하 테스트 5회와 전체 테스트 통과", "checkout 서비스와 관련 테스트만 사용"],
  },
  eval: {
    label: "기존 프롬프트 개선",
    short: "실패 분석 · 회귀 검증",
    rule: "기존 프롬프트와 실제·기대 결과를 비교합니다. 근거 없는 주장, 사실·추론 혼합, 불확실성 누락, 사람 확인이 필요한 판단을 점검하고 한 번에 한 원인만 수정합니다.",
    example: "아래 고객 답변 프롬프트를 개선하세요. 실제 답변에서 출처 없는 수치와 확정적인 표현이 반복됩니다. 근거·불확실성·사람 확인이 필요한 부분을 구분하도록 수정하고 정상·경계·실패 사례로 검증하세요.",
    fields: ["기존 프롬프트", "실제 문제·결과", "기대 결과·평가 기준"],
    values: ["고객 답변 생성 프롬프트", "출처 없는 수치와 불확실성을 숨긴 확정 표현", "근거·불확실성·사람 확인을 구분하고 정상·경계·실패 사례 통과"],
  },
};

const flow = ["요청 분류", "계약 수집", "프롬프트 작성", "검증·전달"];

export default function Home() {
  const [guideMode, setGuideMode] = useState<Mode>("casual");
  const [practiceMode, setPracticeMode] = useState<Mode>("casual");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [format, setFormat] = useState("");
  const [referencePrompt, setReferencePrompt] = useState("");
  const [designBrief, setDesignBrief] = useState("");
  const [copied, setCopied] = useState(false);
  const designReadId = useRef(0);

  useEffect(() => {
    function cancelSmoothScroll() {
      const root = document.documentElement;
      root.style.scrollBehavior = "auto";
      window.scrollTo(window.scrollX, window.scrollY);
      window.requestAnimationFrame(() => root.style.removeProperty("scroll-behavior"));
    }

    function cancelSmoothScrollFromKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("input, textarea, select, [contenteditable='true']")) return;
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancelSmoothScroll();
    }

    window.addEventListener("wheel", cancelSmoothScroll, { passive: true });
    window.addEventListener("touchstart", cancelSmoothScroll, { passive: true });
    window.addEventListener("keydown", cancelSmoothScrollFromKey);
    return () => {
      window.removeEventListener("wheel", cancelSmoothScroll);
      window.removeEventListener("touchstart", cancelSmoothScroll);
      window.removeEventListener("keydown", cancelSmoothScrollFromKey);
    };
  }, []);

  const selected = modes[guideMode];
  const practiceSelected = modes[practiceMode];
  const practicePrompt = useMemo(() => {
    const goal = objective || "{{목표}}";
    const who = audience || "{{대상 또는 맥락}}";
    const output = format || "{{결과 형식}}";
    if (practiceMode === "goal") return `/goal ${goal}, ${who}로 검증하세요. ${output}만 사용하세요. 반복마다 실제 상태를 확인하고 실패하면 전략을 바꾸세요. 검증 명령과 결과를 대화에 남기세요. 완료 전 회귀·제약·비밀 노출을 검토하세요.`;
    if (practiceMode === "research") return `${goal}을(를) ${who}을 위해 조사하세요. 최신성이 필요한 주장은 확인하고, 각 핵심 주장에 출처를 붙이세요. 사실과 추론을 구분해 ${output}(으)로 반환하세요.`;
    if (practiceMode === "structured") return `작업: ${goal}\n필드·자료형·허용값: ${who}\n누락·오류 처리: ${output}\n필수값과 중첩 구조를 포함한 JSON 스키마를 정의하세요. 스키마와 비즈니스 규칙을 모두 검증하고, 잘못된 입력에는 status와 누락·오류 필드를 반환하세요.`;
    if (practiceMode === "code") return `코드 작업: ${goal}\n언어·실행 환경: ${who}\n입출력·검증: ${output}\n예외 상황과 성능·보안 제약을 설명하고, 실행 가능한 예제 또는 테스트를 함께 제공하세요.`;
    if (practiceMode === "coding") return `저장소 작업 목표: ${goal}\n허용 경로·보존 동작: ${who}\n검증 명령: ${output}\n관련 코드와 공유 동작의 호출 경로를 먼저 확인하고 기존 사용자 변경을 보존하세요. 가장 작은 근본 원인 수정 후 테스트·린트·빌드 중 해당하는 검증을 실행하세요. 외부 전송·배포·삭제·비용 발생 작업은 승인 전에 실행하지 말고, 변경 파일과 검증 결과를 보고하세요.`;
    if (practiceMode === "tool") return `작업 목표: ${goal}\n도구·데이터 범위: ${who}\n승인 작업·결과 형식: ${output}\n조회와 생성·수정·발송 작업을 구분하고 승인 필요한 작업은 실행 전에 확인하세요. 도구 결과를 검증하고, 오류 시 같은 작업을 그대로 반복하지 마세요. 비밀키를 노출하지 마세요.`;
    if (practiceMode === "eval") return `기존 프롬프트:\n${goal}\n\n실제 문제·결과: ${who}\n기대 결과·평가 기준: ${output}\n근거 없는 주장, 사실과 추론의 혼합, 불확실성 누락, 사람의 최종 확인이 필요한 부분을 점검하세요. 실패 원인을 한 번에 하나씩 수정하고 정상·경계·실패·회귀 사례로 검증하세요. 수정된 프롬프트와 변경 이유, 평가 결과, 남은 한계를 반환하세요.`;
    if (practiceMode === "image") return `이미지를 생성하세요.\n주제·피사체: ${goal}\n시각 스타일·구도: ${who}\n비율·제약: ${output}${referencePrompt ? `\n\n아래 레퍼런스 프롬프트의 분위기·구도·디테일을 참고하되, 피사체와 요청 조건에 맞게 새로 작성하세요.\n레퍼런스:\n${referencePrompt}` : ""}`;
    if (practiceMode === "video") return `영상을 생성하세요.\n장면·행동: ${goal}\n촬영·연출: ${who}\n길이·형식: ${output}${referencePrompt ? `\n\n아래 레퍼런스 프롬프트의 연출·카메라·리듬을 참고하되, 요청 조건에 맞게 새로 작성하세요.\n레퍼런스:\n${referencePrompt}` : ""}`;
    if (practiceMode === "presentation") return `프레젠테이션을 제작하세요.\n발표 목표·청중: ${goal}\n핵심 메시지·구성: ${who}\n분량·결과 형식: ${output}\n각 슬라이드에 제목, 한 줄 핵심 메시지, 본문 요점, 권장 시각 자료를 제시하세요.${designBrief ? `\n\n다음 design.md의 디자인 설명을 발표 자료의 색상·타이포그래피·간격·컴포넌트·톤에 반영하세요:\n${designBrief}` : ""}`;
    return `당신은 ${who}을 돕습니다.\n작업: ${goal}\n반환 형식: ${output}\n필요한 정보가 결과를 크게 바꾸면 짧게 질문하고, 그렇지 않으면 가정을 밝힌 뒤 작성하세요. 중요한 사실이나 판단이 포함되면 근거를 확인하고, 확인된 사실·불확실한 내용·가정을 구분하세요. 법률·의료·재무 판단이나 외부 실행처럼 사람의 최종 확인이 필요한 부분을 표시하세요.`;
  }, [practiceMode, objective, audience, format, referencePrompt, designBrief]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(practicePrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function loadExample() {
    setObjective(practiceSelected.values[0]);
    setAudience(practiceSelected.values[1]);
    setFormat(practiceSelected.values[2]);
  }

  function selectPracticeMode(nextMode: Mode) {
    if (nextMode === practiceMode) return;
    setPracticeMode(nextMode);
    setObjective("");
    setAudience("");
    setFormat("");
    setReferencePrompt("");
    setDesignBrief("");
    designReadId.current += 1;
    setCopied(false);
  }

  function readDesignFile(file: File | undefined) {
    if (!file) return;
    const readId = ++designReadId.current;
    const reader = new FileReader();
    reader.onload = () => {
      if (readId !== designReadId.current) return;
      setDesignBrief(String(reader.result ?? ""));
    };
    reader.readAsText(file);
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
          <article className="path-card skill-path"><p className="mono">PATH 01</p><span className="path-number">01</span><h3>스킬을 내려받아<br />Codex·Claude Code에서 사용하기</h3><p>저장소를 설치한 뒤 Codex에서는 <code>$prompt-author</code>, Claude Code에서는 <code>/prompt-author</code>로 상황에 맞는 프롬프트를 요청할 수 있습니다.</p><a href="https://github.com/seominpapa/prompt-author#설치-방법" target="_blank" rel="noreferrer">스킬 설치 방법 보기 <span>↗</span></a></article>
          <article className="path-card web-path"><p className="mono">PATH 02</p><span className="path-number">02</span><h3>웹에서 만들고<br />바로 붙여넣기</h3><p>조건을 입력해 프롬프트를 생성한 뒤 <strong>복사하기</strong>를 누르고, ChatGPT·Codex·Claude 등 원하는 곳에 붙여넣으세요.</p><a href="#workbench">웹에서 프롬프트 만들기 <span>→</span></a></article>
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
            {(Object.keys(modes) as Mode[]).map((key, i) => <button type="button" key={key} className={guideMode === key ? "active" : ""} onClick={() => setGuideMode(key)} role="tab" aria-selected={guideMode === key}><span>{String(i + 1).padStart(2, "0")}</span><strong>{modes[key].label}</strong><small>{modes[key].short}</small><i>↗</i></button>)}
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
        <div className="practice-heading"><p className="section-kicker">05 / TRY IT YOURSELF</p><h2>이제, 당신의<br /><em>조건을 넣어보세요.</em></h2><p>입력값이 비어 있으면 변수로 남습니다. 생성된 프롬프트는 <strong>복사하기</strong>를 눌러 ChatGPT·Codex·Claude 등 원하는 도구에 바로 붙여 넣을 수 있습니다.</p></div>
        <div className="workbench" id="workbench">
          <div className="form-panel">
            <div className="mode-choices" role="group" aria-label="상황">{(Object.keys(modes) as Mode[]).map((key) => <button type="button" key={key} className={practiceMode === key ? "active" : ""} onClick={() => selectPracticeMode(key)}>{modes[key].label}</button>)}</div>
            <label>{practiceSelected.fields[0]}<textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="무엇을 이루고 싶나요?" rows={3} /></label>
            <label>{practiceSelected.fields[1]}<input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="누구를 위한 것인가요?" /></label>
            <label>{practiceSelected.fields[2]}<input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="어떤 형태로 받을까요?" /></label>
            {(practiceMode === "image" || practiceMode === "video") && <><p className="reference-help">레퍼런스가 필요하면 <a href="https://youmind.com/ko-KR/gpt-image-2-prompts/explore?categories=profile-avatar" target="_blank" rel="noreferrer">YouMind</a> 또는 <a href="https://prompts3.com/" target="_blank" rel="noreferrer">Prompts3</a>에서 마음에 드는 프롬프트를 찾아 복사해 붙여 넣으세요.</p><label>레퍼런스 프롬프트<textarea value={referencePrompt} onChange={(e) => setReferencePrompt(e.target.value)} placeholder="참고할 프롬프트를 붙여 넣으세요." rows={4} /></label></>}
            {practiceMode === "presentation" && <><p className="reference-help"><a href="https://getdesign.md/" target="_blank" rel="noreferrer">getdesign.md</a>에서 디자인 기준을 찾거나, 가진 design.md 파일을 선택하세요. 내용은 이 브라우저에서만 읽습니다.</p><label>design.md 업로드<input type="file" accept=".md,text/markdown,text/plain" onChange={(e) => readDesignFile(e.target.files?.[0])} /></label>{designBrief && <p className="file-status">design.md 디자인 설명을 프롬프트에 반영합니다.</p>}</>}
            <button className="ghost" onClick={loadExample}>예시 조건 채우기 <span>↗</span></button>
          </div>
          <div className="output-panel"><div className="output-top"><span className="mono">YOUR PROMPT</span><button onClick={copyPrompt}>{copied ? "복사됨!" : "복사하기"}</button></div><pre>{practicePrompt}</pre><p className="output-note">{practiceMode === "goal" && practicePrompt.length > 4000 ? "Claude Code의 /goal 조건은 4,000자 이내로 줄여야 합니다." : objective && audience && format ? "조건이 모두 채워졌습니다. 이 프롬프트를 사용해 보세요." : "빈 조건은 {{변수}}로 남겨 두었습니다."}</p></div>
        </div>
      </section>

      <footer><a className="brand" href="#top">prompt<span>author</span></a><p>Write less. Specify better.</p><a href="https://github.com/seominpapa/prompt-author" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </main>
  );
}
