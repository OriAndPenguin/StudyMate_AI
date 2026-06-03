import OpenAI from "openai";
import { AppError } from "./errors";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type {
  Flashcard,
  GenerationKind,
  Question,
  QuestionSet,
  SummaryNote,
  TermItem,
} from "@/types/study";

/**
 * AI(OpenAI 호환) 호출 계층 — 서버 전용.
 *
 * 환경변수 (.env.local 에서만 읽음, 클라이언트로 노출되지 않음):
 *  - OPENAI_API_KEY  (필수) : OpenAI 공식 키 또는 학교 제공 키
 *  - OPENAI_BASE_URL (선택) : OpenAI 호환 학교 API 의 baseURL
 *  - OPENAI_MODEL    (선택) : 사용할 모델명 (기본 gpt-4o-mini)
 */

const DEFAULT_MODEL = "gpt-4o-mini";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "OPENAI_API_KEY가 설정되어 있지 않습니다. 프로젝트 루트의 .env.local 에 키를 추가한 뒤 개발 서버를 재시작해 주세요.",
      500
    );
  }
  if (!_client) {
    const baseURL = process.env.OPENAI_BASE_URL?.trim();
    _client = new OpenAI({
      apiKey,
      // 학교 제공 OpenAI 호환 API 사용 시 baseURL 지정. 없으면 공식 API.
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return _client;
}

function getModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

/** 느슨한 JSON 파싱: 그대로 → 코드블록/잡텍스트 제거 후 {..} 구간 재시도 */
function looseParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** 모델 호출 → 원문 문자열 반환 */
async function callModel(
  kind: GenerationKind,
  sourceText: string,
  subjectTitle?: string
): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: getModel(),
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt({ kind, sourceText, subjectTitle }) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new AppError("AI 응답이 비어 있습니다.", 502);
  return raw;
}

/* ------------------------------------------------------------------ */
/* 각 생성기 — JSON 파싱 실패 시에도 화면이 깨지지 않도록 fallback 처리 */
/* ------------------------------------------------------------------ */

export async function generateSummary(
  sourceText: string,
  subjectTitle?: string
): Promise<SummaryNote> {
  const raw = await callModel("summary", sourceText, subjectTitle);
  const data = looseParse<Partial<SummaryNote>>(raw);
  if (!data) {
    // 파싱 실패 → 원문을 요약 영역에 보존
    return {
      overview: [raw.trim()],
      examPoints: [],
      memorizeChecklist: [],
      confusingConcepts: [],
    };
  }
  return {
    overview: data.overview ?? [],
    examPoints: data.examPoints ?? [],
    memorizeChecklist: data.memorizeChecklist ?? [],
    confusingConcepts: data.confusingConcepts ?? [],
  };
}

export async function generateTerms(
  sourceText: string,
  subjectTitle?: string
): Promise<TermItem[]> {
  const raw = await callModel("terms", sourceText, subjectTitle);
  const data = looseParse<{ terms?: TermItem[] }>(raw);
  return data?.terms ?? [];
}

export async function generateQuestions(
  sourceText: string,
  subjectTitle?: string
): Promise<QuestionSet> {
  const raw = await callModel("questions", sourceText, subjectTitle);
  const data = looseParse<Partial<QuestionSet>>(raw);
  const withIds = (arr: Question[] = [], prefix: string): Question[] =>
    arr.map((q, i) => ({ ...q, id: `${prefix}-${i}` }));

  return {
    multipleChoice: withIds(data?.multipleChoice, "mc"),
    ox: withIds(data?.ox, "ox"),
    shortAnswer: withIds(data?.shortAnswer, "sa"),
    essay: withIds(data?.essay, "es"),
  };
}

export async function generateFlashcards(
  sourceText: string,
  subjectTitle?: string
): Promise<Flashcard[]> {
  const raw = await callModel("flashcards", sourceText, subjectTitle);
  const data = looseParse<{ flashcards?: Omit<Flashcard, "id">[] }>(raw);
  return (data?.flashcards ?? []).map((c, i) => ({ ...c, id: `fc-${i}` }));
}
