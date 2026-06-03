import { NextResponse } from "next/server";
import {
  generateFlashcards,
  generateQuestions,
  generateSummary,
  generateTerms,
} from "@/lib/openai";
import { AppError, toErrorMessage } from "@/lib/errors";
import type {
  GenerateRequest,
  GenerateResponse,
  GenerationKind,
} from "@/types/study";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_KINDS: GenerationKind[] = ["summary", "terms", "questions", "flashcards"];
const MIN_LENGTH = 20;

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
      case "summary":
        response = { kind, data: await generateSummary(sourceText, subjectTitle) };
        break;
      case "terms":
        response = { kind, data: await generateTerms(sourceText, subjectTitle) };
        break;
      case "questions":
        response = { kind, data: await generateQuestions(sourceText, subjectTitle) };
        break;
      case "flashcards":
        response = { kind, data: await generateFlashcards(sourceText, subjectTitle) };
        break;
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/generate] error:", err);
    const status = err instanceof AppError ? err.status : 500;
    return NextResponse.json({ error: buildErrorMessage(err) }, { status });
  }
}

/** baseURL/model 오설정 가능성을 사용자 안내에 반영 */
function buildErrorMessage(err: unknown): string {
  const base = toErrorMessage(err, "AI 생성 중 오류가 발생했습니다.");
  const lower = base.toLowerCase();
  const looksLikeConfig =
    lower.includes("model") ||
    lower.includes("not found") ||
    lower.includes("enotfound") ||
    lower.includes("fetch failed") ||
    lower.includes("connect") ||
    lower.includes("404");
  if (looksLikeConfig) {
    return `${base}\n(OPENAI_BASE_URL 또는 OPENAI_MODEL 설정이 올바른지 확인해 주세요.)`;
  }
  return base;
}
