"use client";

import { useState } from "react";
import { useSubjects } from "@/context/SubjectsContext";
import { parseFetchError, toErrorMessage } from "@/lib/errors";
import { addUsage } from "@/lib/usage";
import type {
  GenerateResponse,
  GenerationKind,
  GenerationStatus,
  QuestionGenerationOptions,
  StudyArtifacts,
} from "@/types/study";

type StatusMap = Record<GenerationKind, GenerationStatus>;

const INITIAL_STATUS: StatusMap = {
  summary: "idle",
  terms: "idle",
  questions: "idle",
  flashcards: "idle",
};

/**
 * AI 생성 로직 (단건 / 전체) + 진행 상태 / 에러 관리.
 * 저장은 SubjectsContext.saveArtifacts 를 통해 localStorage 에 반영된다.
 */
export function useGenerate(params: {
  subjectId: string;
  getSourceText: () => string;
  /** 결과를 저장할 소스 스코프 키 (file:<id> / all / manual) */
  getScopeKey: () => string;
  subjectTitle: string;
  onGenerated?: (kind: GenerationKind) => void;
}) {
  const { subjectId, getSourceText, getScopeKey, subjectTitle, onGenerated } = params;
  const { saveArtifacts } = useSubjects();

  const [statuses, setStatuses] = useState<StatusMap>(INITIAL_STATUS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setStatus(kind: GenerationKind, status: GenerationStatus) {
    setStatuses((prev) => ({ ...prev, [kind]: status }));
  }

  async function runOne(
    kind: GenerationKind,
    sourceText: string,
    questionOptions?: QuestionGenerationOptions
  ): Promise<boolean> {
    setStatus(kind, "loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, sourceText, subjectTitle, questionOptions }),
      });

      if (!res.ok) {
        throw new Error(await parseFetchError(res, "AI 생성에 실패했습니다."));
      }

      const payload = (await res.json()) as GenerateResponse;
      const patch: Partial<StudyArtifacts> = {};
      if (payload.kind === "summary") patch.summary = payload.data;
      else if (payload.kind === "terms") patch.terms = payload.data;
      else if (payload.kind === "questions") patch.questions = payload.data;
      else if (payload.kind === "flashcards") patch.flashcards = payload.data;

      saveArtifacts(subjectId, getScopeKey(), patch);
      addUsage(payload.usage);
      setStatus(kind, "done");
      onGenerated?.(kind);
      return true;
    } catch (err) {
      setStatus(kind, "error");
      setError(toErrorMessage(err, "AI 생성 중 오류가 발생했습니다."));
      return false;
    }
  }

  /** 입력 검증 (공통) */
  function validate(sourceText: string): boolean {
    if (sourceText.trim().length < 10) {
      setError("공부 자료를 10자 이상 입력해 주세요.");
      return false;
    }
    return true;
  }

  async function generate(kind: GenerationKind, questionOptions?: QuestionGenerationOptions) {
    if (busy) return;
    const sourceText = getSourceText();
    setError(null);
    if (!validate(sourceText)) return;
    setBusy(true);
    await runOne(kind, sourceText, kind === "questions" ? questionOptions : undefined);
    setBusy(false);
  }

  return { statuses, error, busy, generate, setError };
}
