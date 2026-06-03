import type { GenerationKind } from "@/types/study";

/**
 * AI 프롬프트 모음
 *
 * 공통 원칙 (모든 생성에 적용):
 * - 사용자가 입력한 자료(sourceText) 안의 내용만 우선 사용한다.
 * - 자료에서 확인되지 않는 내용은 임의로 지어내지 않는다.
 * - 시험 대비 관점으로 정리한다.
 * - 반드시 JSON 으로만 응답한다. (코드블록/설명 금지)
 * - 한국어로 작성한다.
 */

export const SYSTEM_PROMPT = `당신은 시험 대비를 돕는 한국어 학습 보조 AI입니다.

반드시 지켜야 할 원칙:
1. 사용자가 제공한 "공부 자료" 안에 있는 내용만 사용합니다.
2. 자료에서 확인되지 않는 사실은 추측하거나 지어내지 않습니다. 자료가 부족하면 해당 항목을 비워 두거나 적게 만듭니다.
3. 항상 "시험에 나올 만한" 관점으로 핵심을 정리합니다.
4. 출력은 지정된 JSON 스키마를 정확히 따르며, JSON 외의 설명/머리말/코드블록을 절대 출력하지 않습니다.
5. 모든 텍스트는 자연스러운 한국어로 작성합니다.`;

/** kind 별 JSON 스키마 안내 + 지시문 */
const KIND_INSTRUCTIONS: Record<GenerationKind, string> = {
  summary: `요약노트를 생성하세요. 다음 JSON 형식으로만 응답합니다:
{
  "overview": ["전체 핵심 요약을 항목별 문장으로", "..."],
  "examPoints": ["시험에 출제될 가능성이 높은 포인트", "..."],
  "memorizeChecklist": ["반드시 암기해야 할 항목(짧게)", "..."],
  "confusingConcepts": [
    { "concept": "헷갈리기 쉬운 개념", "clarification": "어떻게 구분하는지 설명" }
  ]
}`,

  terms: `핵심 용어 정리를 생성하세요. 다음 JSON 형식으로만 응답합니다:
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
}`,

  questions: `예상문제를 생성하세요. 각 문제에는 정답(answer)과 해설(explanation)을 포함합니다.
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
}`,

  flashcards: `복습용 플래시카드를 생성하세요. 앞면(front)은 질문/용어, 뒷면(back)은 답/설명입니다.
다음 JSON 형식으로만 응답합니다:
{
  "flashcards": [
    { "front": "앞면 (질문/용어)", "back": "뒷면 (답/설명)" }
  ]
}`,
};

export function buildUserPrompt(params: {
  kind: GenerationKind;
  sourceText: string;
  subjectTitle?: string;
}): string {
  const { kind, sourceText, subjectTitle } = params;
  const titleLine = subjectTitle ? `과목명: ${subjectTitle}\n` : "";

  return `${titleLine}아래는 사용자가 제공한 공부 자료입니다. 이 자료 안의 내용만 근거로 사용하세요.

=== 공부 자료 시작 ===
${sourceText}
=== 공부 자료 끝 ===

작업 지시:
${KIND_INSTRUCTIONS[kind]}`;
}
