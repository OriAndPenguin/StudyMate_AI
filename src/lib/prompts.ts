import type { GenerationKind, QuestionGenerationOptions } from "@/types/study";

interface PromptParams {
  sourceText: string;
  subjectTitle?: string;
  questionOptions?: QuestionGenerationOptions;
}

const MAX_SOURCE_CHARS = 48000;

export function buildSystemPrompt(): string {
  return `당신은 시험 대비를 돕는 한국어 학습 보조 AI입니다.

반드시 지켜야 할 원칙:
1. 사용자가 제공한 공부 자료 안의 내용만 근거로 사용합니다.
2. 자료에 없는 내용은 추측하지 않습니다.
3. 자료에서 확인할 수 없는 값은 "자료에서 확인할 수 없음"이라고 씁니다.
4. 항상 시험에 나올 만한 관점으로 정리합니다.
5. 출력은 지정된 JSON 스키마만 정확히 따르고, JSON 밖 설명이나 코드블록은 출력하지 않습니다.
6. 모든 텍스트는 자연스러운 한국어로 작성합니다.`;
}

export function prepareSource(text: string): string {
  let t = (text ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (t.length > MAX_SOURCE_CHARS) {
    t = t.slice(0, MAX_SOURCE_CHARS) + "\n\n[분량이 많아 이후 내용은 생략됨]";
  }
  return t;
}

function withSource({ sourceText, subjectTitle }: PromptParams, instruction: string): string {
  const titleLine = subjectTitle ? `과목명: ${subjectTitle}\n` : "";
  return `${titleLine}=== 공부 자료 시작 ===
${prepareSource(sourceText)}
=== 공부 자료 끝 ===

작업 지시:
${instruction}`;
}

export function buildSummaryPrompt(params: PromptParams): string {
  return withSource(
    params,
    `강의 자료를 시험 대비용 Markdown 요약노트로 정리하세요.

작성 규칙:
- 최상위 제목은 "# 요약"으로 시작합니다.
- 단원은 "##", 핵심 개념은 "###"로 정리합니다.
- 암기 항목은 "- [ ]" 체크리스트로 정리합니다.
- 시험 포인트는 blockquote로 강조합니다.
- 문서 마지막에 "## 시험 대비 핵심 정리" 섹션을 만들고, 반드시 외울 개념과 헷갈리기 쉬운 비교를 포함합니다.
- 원문을 그대로 복사하지 말고 시험 공부용으로 재정리합니다.

다음 JSON 형식으로만 응답하세요.
{
  "title": "요약",
  "markdownContent": "# 요약\\n\\n...전체 Markdown...",
  "sections": [
    { "title": "단원명", "pageRange": "p.2~p.11", "summary": "단원 한 줄 요약" }
  ]
}`
  );
}

export function buildTermsPrompt(params: PromptParams): string {
  return withSource(
    params,
    `시험에 중요할 핵심 단어와 개념을 정리하세요.

다음 JSON 형식으로만 응답하세요.
{
  "terms": [
    {
      "term": "단어",
      "definition": "자료에 근거한 정의",
      "easyExplanation": "쉬운 비유나 풀어쓴 설명",
      "example": "자료 기반 예시",
      "examPoint": "시험 포인트"
    }
  ]
}`
  );
}

function normalizeQuestionOptions(
  options?: QuestionGenerationOptions
): QuestionGenerationOptions {
  const allowedTotals = [10, 20, 30, 40] as const;
  const totalCount = allowedTotals.includes(options?.totalCount as 10 | 20 | 30 | 40)
    ? options!.totalCount
    : 10;
  const essayCount = Math.min(5, Math.max(0, Math.floor(options?.essayCount ?? 0)));
  return { totalCount, essayCount: Math.min(essayCount, totalCount) };
}

export function buildQuestionsPrompt(params: PromptParams): string {
  const { totalCount, essayCount } = normalizeQuestionOptions(params.questionOptions);
  const multipleChoiceCount = totalCount - essayCount;

  return withSource(
    params,
    `예상문제를 생성하세요. 총 ${totalCount}문항을 생성합니다.

문항 구성:
- multipleChoice에는 객관식 ${multipleChoiceCount}문항을 넣습니다.
- 모든 객관식 문제는 반드시 choices 배열에 보기 4개만 포함합니다.
- 객관식 answer는 정답 보기의 텍스트와 정확히 일치해야 합니다.
- essay에는 서술형 ${essayCount}문항을 넣습니다.
- 서술형은 사용자가 요청한 경우에만 만들며 최대 5문항입니다.
- ox와 shortAnswer는 빈 배열로 반환합니다.
- 각 문제에는 정답(answer)과 해설(explanation)을 포함합니다.
- 문제는 자료 전체의 핵심 개념을 고르게 다루고, 서로 중복되지 않게 만듭니다.

다음 JSON 형식으로만 응답하세요.
{
  "multipleChoice": [
    { "type": "multiple_choice", "prompt": "문제", "choices": ["보기1","보기2","보기3","보기4"], "answer": "정답 보기 텍스트", "explanation": "해설" }
  ],
  "ox": [],
  "shortAnswer": [],
  "essay": [
    { "type": "essay", "prompt": "문제", "answer": "모범 답안", "explanation": "채점 포인트와 해설" }
  ]
}`
  );
}

export function buildFlashcardsPrompt(params: PromptParams): string {
  return withSource(
    params,
    `복습용 플래시카드를 생성하세요. 앞면(front)은 질문이나 단어, 뒷면(back)은 답과 설명입니다.

다음 JSON 형식으로만 응답하세요.
{
  "flashcards": [
    { "front": "앞면", "back": "뒷면" }
  ]
}`
  );
}

export function buildUserPrompt(kind: GenerationKind, params: PromptParams): string {
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
