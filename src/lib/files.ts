"use client";

import { parseFetchError, toErrorMessage } from "@/lib/errors";
import type {
  ExtractResponse,
  StudyFile,
  StudyFileType,
  SubjectRecord,
} from "@/types/study";

/**
 * 학습 파일 관련 클라이언트 헬퍼.
 * - 영속화는 lib/storage.ts 의 addFile/updateFile/deleteFile 가 담당한다.
 * - 추후 Supabase Storage 로 옮길 때도 이 파일의 헬퍼/시그니처를 유지하면 된다.
 */

/** AI 분석에 필요한 최소 텍스트 길이 */
export const MIN_SOURCE_LENGTH = 20;

/** <input type="file"> 의 accept 속성값 */
export const FILE_ACCEPT = ".pdf,.pptx,.ppt";

const EXT_TO_TYPE: Record<string, StudyFileType> = {
  pdf: "pdf",
  pptx: "pptx",
  ppt: "ppt",
};

/** 파일 확장자로 지원 형식 판별 (지원하지 않으면 null) */
export function detectFileType(fileName: string): StudyFileType | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_TYPE[ext] ?? null;
}

/** 사람이 읽는 파일 크기 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** /api/extract 호출 — 실패해도 throw 하지 않고 ExtractResponse 로 정규화 */
export async function extractFileText(file: File): Promise<ExtractResponse> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/extract", { method: "POST", body: form });
    if (!res.ok) {
      const message = await parseFetchError(res, "텍스트 추출에 실패했습니다.");
      return { status: "failed", extractedText: "", errorMessage: message };
    }
    return (await res.json()) as ExtractResponse;
  } catch (err) {
    return {
      status: "failed",
      extractedText: "",
      errorMessage: toErrorMessage(err, "텍스트 추출 중 오류가 발생했습니다."),
    };
  }
}

/* ------------------------------------------------------------------ */
/* AI 분석 대상 텍스트 결정                                            */
/* ------------------------------------------------------------------ */

export interface ResolvedSource {
  text: string;
  /** 상단에 표시할 라벨 (선택 파일명 / 과목 전체 / 직접 입력) */
  label: string;
  /** 어떤 근거로 결정됐는지 */
  origin: "file" | "all-files" | "manual" | "none";
  fileName?: string;
  /** 결과 저장/조회용 스코프 키 (file:<id> / all / manual / none) */
  key: string;
}

/**
 * 분석 기준 텍스트 결정 규칙:
 * 1) 파일이 선택되어 있고 추출 텍스트가 있으면 → 그 파일
 * 2) 추출 완료된 파일이 하나라도 있으면 → 모든 파일 텍스트 합침
 * 3) 그 외 → 직접 입력한 sourceText
 */
export function resolveSource(
  subject: SubjectRecord,
  selectedFileId: string | null
): ResolvedSource {
  const extracted = subject.files.filter(
    (f) => f.status === "extracted" && (f.extractedText?.trim().length ?? 0) > 0
  );

  if (selectedFileId) {
    const f = subject.files.find((x) => x.id === selectedFileId);
    if (f && f.extractedText && f.extractedText.trim().length > 0) {
      return {
        text: f.extractedText,
        label: f.name,
        origin: "file",
        fileName: f.name,
        key: `file:${f.id}`,
      };
    }
  }

  if (extracted.length > 0) {
    const text = extracted
      .map((f) => `# ${f.name}\n${f.extractedText}`)
      .join("\n\n");
    return { text, label: "과목 전체 자료", origin: "all-files", key: "all" };
  }

  const manual = subject.sourceText ?? "";
  if (manual.trim().length > 0) {
    return { text: manual, label: "직접 입력한 텍스트", origin: "manual", key: "manual" };
  }

  return { text: "", label: "자료 없음", origin: "none", key: "none" };
}

/** 파일 메타데이터 레코드 생성 (업로드 직후 상태) */
export function makeStudyFile(
  subjectId: string,
  file: File,
  type: StudyFileType
): StudyFile {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    subjectId,
    name: file.name,
    type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    status: "uploaded",
  };
}
