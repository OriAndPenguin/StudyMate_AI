import { NextResponse } from "next/server";
import {
  generateFlashcards,
  generateQuestions,
  generateSummary,
  generateTerms,
  openaiModel,
} from "@/lib/openai";
import { AppError, toErrorMessage } from "@/lib/errors";
import type {
  GenerateRequest,
  GenerateResponse,
  GenerationKind,
  QuestionGenerationOptions,
} from "@/types/study";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_KINDS: GenerationKind[] = ["summary", "terms", "questions", "flashcards"];
const MIN_LENGTH = 20;
const VALID_QUESTION_TOTALS = [10, 20, 30, 40] as const;

function normalizeQuestionOptions(
  options?: QuestionGenerationOptions
): QuestionGenerationOptions {
  const totalCount = VALID_QUESTION_TOTALS.includes(
    options?.totalCount as (typeof VALID_QUESTION_TOTALS)[number]
  )
    ? options!.totalCount
    : 10;
  const essayCount = Math.min(5, Math.max(0, Math.floor(options?.essayCount ?? 0)));
  return { totalCount, essayCount: Math.min(essayCount, totalCount) };
}

export async function POST(req: Request) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  // kind 와 mode 는 같은 의미 (mode 는 별칭)
  const kind = body.kind ?? body.mode;
  const { sourceText, subjectTitle } = body;

  if (!kind || !VALID_KINDS.includes(kind)) {
    return NextResponse.json({ error: "지원하지 않는 생성 종류입니다." }, { status: 400 });
  }
  if (!sourceText || sourceText.trim().length < MIN_LENGTH) {
    return NextResponse.json(
      { error: "분석할 텍스트가 부족합니다. (자료를 조금 더 입력해 주세요)" },
      { status: 400 }
    );
  }

  try {
    let response: GenerateResponse;
    switch (kind) {
      case "summary": {
        const { data, usage } = await generateSummary(sourceText, subjectTitle);
        response = { kind, data, usage };
        break;
      }
      case "terms": {
        const { data, usage } = await generateTerms(sourceText, subjectTitle);
        response = { kind, data, usage };
        break;
      }
      case "questions": {
        const { data, usage } = await generateQuestions(
          sourceText,
          subjectTitle,
          normalizeQuestionOptions(body.questionOptions)
        );
        response = { kind, data, usage };
        break;
      }
      case "flashcards": {
        const { data, usage } = await generateFlashcards(sourceText, subjectTitle);
        response = { kind, data, usage };
        break;
      }
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/generate] error:", err);
    const status = err instanceof AppError ? err.status : 500;
    return NextResponse.json({ error: buildErrorMessage(err) }, { status });
  }
}

/** 401/모델/연결 오류 시 환경변수 확인 안내를 덧붙인다 */
function buildErrorMessage(err: unknown): string {
  const base = toErrorMessage(err, "AI 생성 중 오류가 발생했습니다.");
  const lower = base.toLowerCase();
  const looksLikeConfig =
    lower.includes("model") ||
    lower.includes("401") ||
    lower.includes("인증") ||
    lower.includes("not found") ||
    lower.includes("enotfound") ||
    lower.includes("fetch failed") ||
    lower.includes("connect") ||
    lower.includes("404");
  if (looksLikeConfig) {
    // 모델명은 lib/openai.ts 의 openaiModel() 을 사용 (라우트에서 하드코딩하지 않음)
    return `${base}\n(현재 모델: ${openaiModel()} — .env.local 의 OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL 값을 확인해 주세요.)`;
  }
  return base;
}
