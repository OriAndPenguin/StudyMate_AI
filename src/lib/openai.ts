import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { AppError } from "./errors";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import type {
  Flashcard,
  GenerationKind,
  Question,
  QuestionGenerationOptions,
  QuestionSet,
  SummaryNote,
  SummarySection,
  TermItem,
  TokenUsage,
} from "@/types/study";

/** 모델 호출 결과: 본문 + 토큰 사용량 */
interface CallResult {
  text: string;
  usage: TokenUsage;
}

/** 모델별 단가 (USD / 1M tokens) — 추정 비용 계산용 */
const PRICING: { match: RegExp; in: number; out: number }[] = [
  { match: /claude-haiku/i, in: 1, out: 5 },
  { match: /claude-sonnet/i, in: 3, out: 15 },
  { match: /claude-opus/i, in: 5, out: 25 },
  { match: /gpt-4o-mini|gpt-4\.1-mini|gpt-5-mini/i, in: 0.15, out: 0.6 },
  { match: /gpt-4o|gpt-4\.1|gpt-5/i, in: 2.5, out: 10 },
];

/** 단가 기준 추정 비용(USD). 단가를 모르는 모델이면 undefined */
function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number | undefined {
  const p = PRICING.find((x) => x.match.test(model));
  if (!p) return undefined;
  return (inputTokens / 1_000_000) * p.in + (outputTokens / 1_000_000) * p.out;
}

/**
 * AI(OpenAI 호환) 호출 계층 — 서버 전용. AI 호출은 오직 이 파일에서만 한다.
 *
 * 제공자 자동 판별: OPENAI_API_KEY 가 "sk-ant" 로 시작하면 Anthropic(Claude),
 * 그 외에는 OpenAI(호환) 로 요청한다.
 *
 * 환경변수 (.env.local 에서만 읽음, 클라이언트로 노출되지 않음):
 *  - OPENAI_API_KEY   (필수) : OpenAI/게이트웨이 키 또는 Claude 키(sk-ant...)
 *  - OPENAI_BASE_URL  (선택) : OpenAI 호환 게이트웨이의 baseURL
 *  - OPENAI_MODEL     (선택) : 모델명. 없으면 OpenAI=gpt-5.5 / Claude=claude-haiku-4-5
 *  - OPENAI_TRANSPORT (선택) : "sdk"(기본) | "fetch" (OpenAI 경로에만 적용)
 */

const DEFAULT_OPENAI_MODEL = "gpt-5.5";
// 비용 효율을 위해 Claude 기본은 Haiku. (OPENAI_MODEL 로 sonnet/opus 등 오버라이드 가능)
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5";

type AiProvider = "openai" | "anthropic";

/**
 * 환경변수 값 정리 — 앞뒤 공백/따옴표 제거.
 * (Vercel 등에서 값에 따옴표를 붙여 넣는 실수가 흔해, sk-ant 판별이 깨지는 것을 방지)
 */
function sanitizeEnv(raw?: string): string {
  return (raw ?? "").trim().replace(/^['"]+|['"]+$/g, "").trim();
}

/** API Key 접두사로 제공자 판별 (sk-ant... → Anthropic, 그 외 → OpenAI 호환) */
function detectProvider(apiKey: string): AiProvider {
  return apiKey.startsWith("sk-ant") ? "anthropic" : "openai";
}

/** 제공자별 기본 모델 + OPENAI_MODEL 오버라이드 규칙 */
function resolveModel(provider: AiProvider, envModel?: string): string {
  const m = envModel?.trim();
  if (provider === "anthropic") {
    // 모델명이 claude-* 형태일 때만 오버라이드 인정 (gpt-* 가 섞여 들어오면 무시)
    return m && m.toLowerCase().includes("claude") ? m : DEFAULT_ANTHROPIC_MODEL;
  }
  return m || DEFAULT_OPENAI_MODEL;
}

/**
 * 현재 설정상 사용할 모델명 (라우트의 에러 안내 등에서 사용).
 * API Key 접두사로 제공자를 판별해 제공자에 맞는 기본/오버라이드 모델을 돌려준다.
 */
export function openaiModel(): string {
  const apiKey = sanitizeEnv(process.env.OPENAI_API_KEY);
  return resolveModel(detectProvider(apiKey), sanitizeEnv(process.env.OPENAI_MODEL));
}

const AUTH_ERROR_MESSAGE =
  "AI API 인증에 실패했습니다. .env.local 의 OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL 값과 게이트웨이 호출 방식을 확인해 주세요.";

interface AiConfig {
  apiKey: string;
  provider: AiProvider;
  baseURL?: string;
  model: string;
  transport: "sdk" | "fetch";
}

/** 환경변수를 읽어 설정을 구성한다. (apiKey 없으면 명확한 에러) */
function readConfig(): AiConfig {
  const apiKey = sanitizeEnv(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new AppError(
      "OPENAI_API_KEY가 설정되어 있지 않습니다. 프로젝트 루트의 .env.local 에 키를 추가한 뒤 개발 서버를 재시작해 주세요.",
      500
    );
  }
  const provider = detectProvider(apiKey);
  const baseURL = sanitizeEnv(process.env.OPENAI_BASE_URL) || undefined;
  const model = resolveModel(provider, sanitizeEnv(process.env.OPENAI_MODEL));
  const transport = process.env.OPENAI_TRANSPORT?.trim() === "fetch" ? "fetch" : "sdk";
  return { apiKey, provider, baseURL, model, transport };
}

/** 디버깅용 1회 로그 — API Key 원문은 절대 출력하지 않는다(앞 4글자만). */
let _logged = false;
function logConfigOnce(cfg: AiConfig) {
  if (_logged) return;
  _logged = true;
  console.log(
    "[AI] provider:",
    cfg.provider,
    "| transport:",
    cfg.transport,
    "| baseURL set:",
    cfg.baseURL ? `yes (${cfg.baseURL})` : "no",
    "| model:",
    cfg.model,
    "| key:",
    cfg.apiKey.slice(0, 7) + "****"
  );
}

let _client: OpenAI | null = null;
let _anthropic: Anthropic | null = null;

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

/** Anthropic(Claude) SDK 클라이언트 */
function getAnthropicClient(cfg: AiConfig): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: cfg.apiKey,
      ...(cfg.baseURL ? { baseURL: cfg.baseURL } : {}),
    });
  }
  return _anthropic;
}

/** 에러에서 HTTP 상태 코드를 추출 (SDK/fetch/메시지 문자열 모두 대응) */
function statusOf(err: unknown): number | undefined {
  if (err instanceof OpenAI.APIError && typeof err.status === "number") return err.status;
  if (typeof err === "object" && err !== null && "status" in err) {
    const s = (err as { status?: number }).status;
    if (typeof s === "number") return s;
  }
  const m = err instanceof Error ? err.message.match(/\b(40[0-9]|429|5\d\d)\b/) : null;
  return m ? Number(m[1]) : undefined;
}

/** 상태 코드를 사용자 친화적 한국어 안내로 변환 (해당 없으면 null) */
function friendlyApiError(err: unknown): AppError | null {
  const status = statusOf(err);
  switch (status) {
    case 401:
      return new AppError(
        "AI API 인증에 실패했습니다(401). .env.local 의 OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL 값을 확인해 주세요.",
        401
      );
    case 402:
      return new AppError(
        "결제가 필요합니다(402). API 키 계정의 크레딧/결제 상태를 확인해 주세요. (학교 게이트웨이라면 사용 한도 소진일 수 있습니다)",
        402
      );
    case 403:
      return new AppError(
        "접근이 거부되었습니다(403). API 키 권한 또는 이 모델/엔드포인트 사용 권한을 확인해 주세요.",
        403
      );
    case 429:
      return new AppError(
        "요청이 한도를 초과했습니다(429). 사용량/쿼터 또는 분당 요청 제한을 확인하고 잠시 후 다시 시도해 주세요.",
        429
      );
    default:
      return null;
  }
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

/** 모델 호출 → 본문 + 토큰 사용량. 전송 방식(SDK/fetch/anthropic)을 분기한다. */
async function callModel(
  kind: GenerationKind,
  sourceText: string,
  subjectTitle?: string,
  questionOptions?: QuestionGenerationOptions
): Promise<CallResult> {
  const cfg = readConfig();
  logConfigOnce(cfg);

  const system = buildSystemPrompt();
  const user = buildUserPrompt(kind, { sourceText, subjectTitle, questionOptions });

  try {
    let result: CallResult;
    if (cfg.provider === "anthropic") {
      result = await chatViaAnthropic(cfg, system, user);
    } else {
      const messages: ChatMessage[] = [
        { role: "system", content: system },
        { role: "user", content: user },
      ];
      result =
        cfg.transport === "fetch"
          ? await chatViaFetch(cfg, messages)
          : await chatViaSdk(cfg, messages);
    }
    result.usage.costUsd = estimateCostUsd(
      cfg.model,
      result.usage.inputTokens,
      result.usage.outputTokens
    );
    return result;
  } catch (err) {
    const friendly = friendlyApiError(err);
    if (friendly) throw friendly;
    throw err;
  }
}

/** [전송 3] Anthropic(Claude) SDK — system 은 별도 파라미터, JSON 은 프롬프트로 유도 */
async function chatViaAnthropic(
  cfg: AiConfig,
  system: string,
  user: string
): Promise<CallResult> {
  const client = getAnthropicClient(cfg);
  const message = await client.messages.create({
    model: cfg.model,
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: user }],
  });

  const raw = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  if (!raw) throw new AppError("AI 응답이 비어 있습니다.", 502);
  const usage: TokenUsage = {
    inputTokens: message.usage?.input_tokens ?? 0,
    outputTokens: message.usage?.output_tokens ?? 0,
  };
  return { text: raw, usage };
}

/** [전송 1] OpenAI SDK 사용 (baseURL 있으면 게이트웨이로 요청) */
async function chatViaSdk(cfg: AiConfig, messages: ChatMessage[]): Promise<CallResult> {
  const client = getSdkClient(cfg);
  const completion = await client.chat.completions.create({
    model: cfg.model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages,
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new AppError("AI 응답이 비어 있습니다.", 502);
  const usage: TokenUsage = {
    inputTokens: completion.usage?.prompt_tokens ?? 0,
    outputTokens: completion.usage?.completion_tokens ?? 0,
  };
  return { text: raw, usage };
}

/**
 * [전송 2] fetch 직접 호출 — 게이트웨이가 OpenAI SDK 와 호환되지 않을 때 대비.
 * baseURL 뒤에 /chat/completions 를 붙여 호출한다.
 * (인증 헤더 방식이 다르면 이 함수의 headers 만 수정하면 된다)
 */
async function chatViaFetch(cfg: AiConfig, messages: ChatMessage[]): Promise<CallResult> {
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
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new AppError("AI 응답이 비어 있습니다.", 502);
  const usage: TokenUsage = {
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
  };
  return { text: raw, usage };
}

/* ------------------------------------------------------------------ */
/* 각 생성기 — JSON 파싱 실패 시에도 화면이 깨지지 않도록 fallback 처리 */
/* ------------------------------------------------------------------ */

/** 생성 결과 + 토큰 사용량 */
export interface Generated<T> {
  data: T;
  usage: TokenUsage;
}

export async function generateSummary(
  sourceText: string,
  subjectTitle?: string
): Promise<Generated<SummaryNote>> {
  const { text: raw, usage } = await callModel("summary", sourceText, subjectTitle);
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
    return { data: { title: data?.title ?? "요약", sections, raw: raw.trim() }, usage };
  }

  return { data: { title: data?.title ?? "요약", markdownContent: markdown, sections }, usage };
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
): Promise<Generated<TermItem[]>> {
  const { text: raw, usage } = await callModel("terms", sourceText, subjectTitle);
  const data = looseParse<{ terms?: TermItem[] }>(raw);
  return { data: data?.terms ?? [], usage };
}

export async function generateQuestions(
  sourceText: string,
  subjectTitle?: string,
  questionOptions?: QuestionGenerationOptions
): Promise<Generated<QuestionSet>> {
  const { text: raw, usage } = await callModel("questions", sourceText, subjectTitle, questionOptions);
  const data = looseParse<Partial<QuestionSet>>(raw);
  const withIds = (arr: Question[] = [], prefix: string): Question[] =>
    arr.map((q, i) => ({ ...q, id: `${prefix}-${i}` }));

  return {
    data: {
      multipleChoice: withIds(data?.multipleChoice, "mc").map((q) => ({
        ...q,
        choices: (q.choices ?? []).slice(0, 4),
      })),
      ox: [],
      shortAnswer: [],
      essay: withIds(data?.essay, "es").slice(0, 5),
    },
    usage,
  };
}

export async function generateFlashcards(
  sourceText: string,
  subjectTitle?: string
): Promise<Generated<Flashcard[]>> {
  const { text: raw, usage } = await callModel("flashcards", sourceText, subjectTitle);
  const data = looseParse<{ flashcards?: Omit<Flashcard, "id">[] }>(raw);
  return {
    data: (data?.flashcards ?? []).map((c, i) => ({ ...c, id: `fc-${i}` })),
    usage,
  };
}
