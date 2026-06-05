import OpenAI from "openai";
import { AppError } from "./errors";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import type {
  Flashcard,
  GenerationKind,
  Question,
  QuestionSet,
  SummaryNote,
  SummarySection,
  TermItem,
} from "@/types/study";

/**
 * AI(OpenAI 호환) 호출 계층 — 서버 전용. AI 호출은 오직 이 파일에서만 한다.
 *
 * 환경변수 (.env.local 에서만 읽음, 클라이언트로 노출되지 않음):
 *  - OPENAI_API_KEY   (필수) : OpenAI 공식 키 또는 학교 게이트웨이 키
 *  - OPENAI_BASE_URL  (선택) : OpenAI 호환 게이트웨이의 baseURL.
 *                              설정 시 반드시 이 주소로 요청한다(공식 URL 사용 안 함).
 *  - OPENAI_MODEL     (선택) : 사용할 모델명 (없으면 기본값 gpt-5.5)
 *  - OPENAI_TRANSPORT (선택) : "sdk"(기본) | "fetch"
 *                              게이트웨이가 OpenAI SDK 와 호환되지 않을 때 "fetch" 로 전환.
 */

const DEFAULT_MODEL = "gpt-5.5";

/**
 * 사용할 모델명 — OPENAI_MODEL 이 있으면 그 값, 없으면 기본값(gpt-5.5).
 * 모델명은 이 함수가 유일한 출처이며, 다른 곳(예: API 라우트)에서 하드코딩하지 않는다.
 */
export function openaiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

const AUTH_ERROR_MESSAGE =
  "AI API 인증에 실패했습니다. .env.local 의 OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL 값과 게이트웨이 호출 방식을 확인해 주세요.";

interface AiConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
  transport: "sdk" | "fetch";
}

/** 환경변수를 읽어 설정을 구성한다. (apiKey 없으면 명확한 에러) */
function readConfig(): AiConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError(
      "OPENAI_API_KEY가 설정되어 있지 않습니다. 프로젝트 루트의 .env.local 에 키를 추가한 뒤 개발 서버를 재시작해 주세요.",
      500
    );
  }
  const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;
  const model = openaiModel();
  const transport = process.env.OPENAI_TRANSPORT?.trim() === "fetch" ? "fetch" : "sdk";
  return { apiKey, baseURL, model, transport };
}

/** 디버깅용 1회 로그 — API Key 원문은 절대 출력하지 않는다(앞 4글자만). */
let _logged = false;
function logConfigOnce(cfg: AiConfig) {
  if (_logged) return;
  _logged = true;
  console.log(
    "[AI] transport:",
    cfg.transport,
    "| baseURL set:",
    cfg.baseURL ? `yes (${cfg.baseURL})` : "no (공식 OpenAI)",
    "| model:",
    cfg.model,
    "| key:",
    cfg.apiKey.slice(0, 4) + "****"
  );
}

let _client: OpenAI | null = null;

/** OpenAI SDK 클라이언트 — baseURL 이 있으면 반드시 그 주소를 사용. */
function getSdkClient(cfg: AiConfig): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: cfg.apiKey,
      ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}),
    });
  }
  return _client;
}

/** 401(인증 실패) 여부 판별 */
function isAuthError(err: unknown): boolean {
  if (err instanceof OpenAI.APIError && err.status === 401) return true;
  if (typeof err === "object" && err !== null && "status" in err) {
    return (err as { status?: number }).status === 401;
  }
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  return msg.includes("401") || msg.includes("incorrect api key") || msg.includes("unauthorized");
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

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/** 모델 호출 → 응답 본문 문자열 반환. 전송 방식(SDK/fetch)을 분기한다. */
async function callModel(
  kind: GenerationKind,
  sourceText: string,
  subjectTitle?: string
): Promise<string> {
  const cfg = readConfig();
  logConfigOnce(cfg);

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: buildUserPrompt(kind, { sourceText, subjectTitle }) },
  ];

  try {
    return cfg.transport === "fetch"
      ? await chatViaFetch(cfg, messages)
      : await chatViaSdk(cfg, messages);
  } catch (err) {
    if (isAuthError(err)) {
      throw new AppError(AUTH_ERROR_MESSAGE, 401);
    }
    throw err;
  }
}

/** [전송 1] OpenAI SDK 사용 (baseURL 있으면 게이트웨이로 요청) */
async function chatViaSdk(cfg: AiConfig, messages: ChatMessage[]): Promise<string> {
  const client = getSdkClient(cfg);
  const completion = await client.chat.completions.create({
    model: cfg.model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages,
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new AppError("AI 응답이 비어 있습니다.", 502);
  return raw;
}

/**
 * [전송 2] fetch 직접 호출 — 게이트웨이가 OpenAI SDK 와 호환되지 않을 때 대비.
 * baseURL 뒤에 /chat/completions 를 붙여 호출한다.
 * (인증 헤더 방식이 다르면 이 함수의 headers 만 수정하면 된다)
 */
async function chatViaFetch(cfg: AiConfig, messages: ChatMessage[]): Promise<string> {
  const base = (cfg.baseURL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const url = `${base}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 기본: Authorization Bearer. 게이트웨이가 x-api-key 방식이면 아래 줄로 교체:
      //   "x-api-key": cfg.apiKey,
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    const err = new AppError(
      status === 401 ? AUTH_ERROR_MESSAGE : `게이트웨이 오류(${status}): ${detail}`,
      status
    );
    throw err;
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content;
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

  const sections: SummarySection[] | undefined = Array.isArray(data?.sections)
    ? data!.sections!.map((s) => ({
        title: s?.title ?? "",
        pageRange: s?.pageRange,
        summary: s?.summary,
      }))
    : undefined;

  // 1순위: markdownContent
  let markdown =
    data && typeof data.markdownContent === "string" ? data.markdownContent.trim() : "";

  // 2순위: sections 로부터 Markdown 합성
  if (!markdown && sections && sections.length > 0) {
    markdown = synthesizeMarkdown(data?.title ?? "요약", sections);
  }

  // 둘 다 없으면 → 원문 fallback 보존 (화면이 깨지지 않게)
  if (!markdown) {
    return { title: data?.title ?? "요약", sections, raw: raw.trim() };
  }

  return { title: data?.title ?? "요약", markdownContent: markdown, sections };
}

/** sections 메타데이터만 있을 때 Markdown 으로 합성 */
function synthesizeMarkdown(title: string, sections: SummarySection[]): string {
  const head = `# ${title || "요약"}`;
  const body = sections
    .map((s) => {
      const range = s.pageRange ? ` \`${s.pageRange}\`` : "";
      return `## ${s.title}${range}\n\n${s.summary ?? ""}`.trim();
    })
    .join("\n\n");
  return `${head}\n\n${body}`.trim();
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
