import type { GenerationKind } from "@/types/study";

/**
 * AI 프롬프트 모음 — 모든 프롬프트는 이 파일 한 곳에서만 정의/조립한다.
 * (app/api/generate/route.ts 나 다른 파일에 프롬프트를 직접 작성하지 않는다.)
 *
 * 공통 원칙 (모든 생성에 적용):
 * - 업로드/입력된 공부자료(sourceText) 내용을 최우선 근거로 사용한다.
 * - 자료에 없는 내용을 확정적으로 지어내지 않는다.
 * - 자료에서 확인되지 않는 내용은 "자료에서 확인되지 않음" 이라고 표시한다.
 * - 시험 대비 관점으로 정리한다.
 * - 한국어로 작성한다.
 * - 반드시 JSON 으로만 응답한다. (코드블록/설명 금지)
 *
 * 사용처: lib/openai.ts 가 buildSystemPrompt() + 각 build*Prompt() 를 조립해
 *        모델에 전달한다. (AI 호출은 lib/openai.ts 에서만 수행)
 */

/* ------------------------------------------------------------------ */
/* System message                                                      */
/* ------------------------------------------------------------------ */

export function buildSystemPrompt(): string {
  return `당신은 시험 대비를 돕는 한국어 학습 보조 AI입니다.

반드시 지켜야 할 원칙:
1. 사용자가 제공한 "공부 자료" 안에 있는 내용을 최우선 근거로 사용합니다.
2. 자료에 없는 내용을 확정적으로 지어내지 않습니다.
3. 자료에서 확인되지 않는 항목은 값에 "자료에서 확인되지 않음" 이라고 표시합니다. (빈 문자열 대신)
4. 항상 "시험에 나올 만한" 관점으로 핵심을 정리합니다.
5. 출력은 지정된 JSON 스키마를 정확히 따르며, JSON 외의 설명/머리말/코드블록을 절대 출력하지 않습니다.
6. 모든 텍스트는 자연스러운 한국어로 작성합니다.`;
}

/* ------------------------------------------------------------------ */
/* User message — 공통 자료 블록 + 작업 지시                           */
/* ------------------------------------------------------------------ */

interface PromptParams {
  sourceText: string;
  subjectTitle?: string;
}

/** 모델에 보내기 전 자료 텍스트의 토큰 낭비 요소를 줄인다. */
const MAX_SOURCE_CHARS = 48000; // 안전장치: 초대형 문서로 인한 토큰 폭증 방지

export function prepareSource(text: string): string {
  let t = (text ?? "")
    .replace(/\r\n?/g, "\n") // CRLF 정규화
    .replace(/[ \t]+/g, " ") // 연속 공백/탭 → 1칸
    .replace(/ *\n/g, "\n") // 줄 끝 공백 제거
    .replace(/\n{3,}/g, "\n\n") // 빈 줄 3개+ → 2개
    .trim();

  if (t.length > MAX_SOURCE_CHARS) {
    t = t.slice(0, MAX_SOURCE_CHARS) + "\n\n[분량이 많아 이후 내용은 생략됨]";
  }
  return t;
}

function withSource({ sourceText, subjectTitle }: PromptParams, instruction: string): string {
  // 규칙(자료 기반/확인불가 표시 등)은 system 프롬프트에 있으므로 여기서 반복하지 않는다.
  const titleLine = subjectTitle ? `과목명: ${subjectTitle}\n` : "";
  return `${titleLine}=== 공부 자료 시작 ===
${prepareSource(sourceText)}
=== 공부 자료 끝 ===

작업 지시:
${instruction}`;
}

/** 1) 요약노트 — 시험 대비 Markdown 요약노트 */
export function buildSummaryPrompt(params: PromptParams): string {
  return withSource(
    params,
    `너는 강의 PDF를 시험 대비용 Markdown 요약노트로 정리하는 AI 튜터다. 단순 전체 요약을 만들지 말고, 원본의 단원 흐름과 페이지 번호를 유지하되, 반복되는 제목은 하나로 묶어 가독성 좋게 정리해라. 최종 결과는 \`# 요약\`으로 시작하는 Markdown 문서여야 한다. 큰 단원은 \`##\`, 세부 개념은 \`###\`, 비교 개념은 Markdown 표, 암기 항목은 체크리스트, 시험 포인트는 blockquote로 작성해라. 자료에 없는 내용은 추가하지 말고, "자료에서 확인되지 않음" 문구는 남발하지 마라.

[Markdown 작성 규칙]
- 최상단 제목은 \`# 요약\` 으로 시작한다.
- 큰 단원: \`## 1. 단원명 \\\`p.시작~p.끝\\\`\` (번호 + 짧은 단원명 + 인라인 코드로 페이지 범위).
- 세부 개념: \`### 1-1. 소제목 \\\`p.페이지\\\`\` (또는 페이지 범위).
- 개념명은 \`**개념명**\` 처럼 굵게 표시한다.
- 비교/구분 개념은 반드시 Markdown 표로 정리한다.
- 암기 항목은 체크리스트 \`- [ ] 항목\` 형식으로 정리한다.
- 시험 포인트는 blockquote 로 강조한다. 예: \`> 시험 포인트\` 다음 줄에 내용.
- 페이지 번호는 가능한 한 유지하고, 같은 제목이 여러 페이지에 반복되면 하나로 묶어 페이지 범위로 표시한다.
- 제목을 길게 만들지 말고 짧게 정리한다. (긴 설명형 제목 금지)
- "자료에서 확인되지 않음"은 정말 필요한 경우에만 "자료에 명시되지 않음"으로 짧게 표시한다.
- 표지/목차/내용 없는 페이지나 별도 내용 없는 Q&A 페이지는 요약하지 않는다.
- 원본 순서를 유지하고, 원문을 그대로 복사하지 말고 시험 공부용으로 재정리한다.
- 너무 짧게 줄이지 말되 핵심 개념 중심으로 정리한다. 각 세부 항목은 보통 [핵심 정의 → 주요 특징 → 헷갈리기 쉬운 부분 → (필요 시) 비교표] 흐름을 따른다.
- 문서 마지막에는 \`## 시험 대비 핵심 정리\` 단원을 두고, \`### 반드시 외울 개념\`(체크리스트)과 \`### 헷갈리기 쉬운 개념 비교\`(표)를 포함한다.

[응답 형식] — 아래 JSON 으로만 응답한다. markdownContent 에 위 규칙을 따른 Markdown 전체를 문자열로 담는다:
{
  "title": "요약",
  "markdownContent": "# 요약\\n\\n...전체 Markdown...",
  "sections": [
    { "title": "메모리 구조와 프로그램 실행 준비", "pageRange": "p.2~p.11", "summary": "단원 한 줄 요약" }
  ]
}`
  );
}

/** 2) 핵심 용어 정리 */
export function buildTermsPrompt(params: PromptParams): string {
  return withSource(
    params,
    `핵심 용어 정리를 생성하세요. 다음 JSON 형식으로만 응답합니다:
{
  "terms": [
    {
      "term": "용어",
      "definition": "자료에 근거한 정의",
      "easyExplanation": "쉬운 비유/풀어쓴 설명",
      "example": "예시 (자료 기반)",
      "examPoint": "이 용어의 시험 포인트"
    }
  ]
}`
  );
}

/** 3) 예상문제 */
export function buildQuestionsPrompt(params: PromptParams): string {
  return withSource(
    params,
    `예상문제를 생성하세요. 각 문제에는 정답(answer)과 해설(explanation)을 포함합니다.
객관식(multipleChoice)은 choices 배열(보기 4개)을 포함하고 answer 는 정답 보기의 텍스트입니다.
OX(ox)의 answer 는 "O" 또는 "X" 입니다.
다음 JSON 형식으로만 응답합니다:
{
  "multipleChoice": [
    { "type": "multiple_choice", "prompt": "문제", "choices": ["보기1","보기2","보기3","보기4"], "answer": "정답 보기 텍스트", "explanation": "해설" }
  ],
  "ox": [
    { "type": "ox", "prompt": "문제", "answer": "O", "explanation": "해설" }
  ],
  "shortAnswer": [
    { "type": "short_answer", "prompt": "문제", "answer": "단답 정답", "explanation": "해설" }
  ],
  "essay": [
    { "type": "essay", "prompt": "문제", "answer": "모범답안 핵심", "explanation": "채점 포인트 해설" }
  ]
}`
  );
}

/** 4) 복습 플래시카드 */
export function buildFlashcardsPrompt(params: PromptParams): string {
  return withSource(
    params,
    `복습용 플래시카드를 생성하세요. 앞면(front)은 질문/용어, 뒷면(back)은 답/설명입니다.
다음 JSON 형식으로만 응답합니다:
{
  "flashcards": [
    { "front": "앞면 (질문/용어)", "back": "뒷면 (답/설명)" }
  ]
}`
  );
}

/** mode(kind) → 해당 user 프롬프트 빌더 디스패치 */
export function buildUserPrompt(
  kind: GenerationKind,
  params: PromptParams
): string {
  switch (kind) {
    case "summary":
      return buildSummaryPrompt(params);
    case "terms":
      return buildTermsPrompt(params);
    case "questions":
      return buildQuestionsPrompt(params);
    case "flashcards":
      return buildFlashcardsPrompt(params);
  }
}
