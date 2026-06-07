"use client";

import type {
  QuestionSet,
  QuizHistoryItem,
  StudyArtifacts,
  StudyFile,
  Subject,
  SubjectInput,
  SubjectRecord,
} from "@/types/study";

/**
 * 과목 저장소 (1차: localStorage)
 *
 * ⚠️ Supabase 교체 지점
 * 추후 Supabase(Auth/DB/Storage)로 옮길 때는 이 파일의 export 시그니처
 * (listSubjects / getSubject / createSubject / updateSubject / saveArtifacts /
 *  deleteSubject) 를 유지한 채 내부 구현만 Supabase 쿼리로 바꾸면 된다.
 * UI/Context 계층은 전부 이 함수들만 사용하므로 변경이 전파되지 않는다.
 */

const STORAGE_KEY = "studymate.subjects.v1";
const QUIZ_HISTORY_KEY = "studymate.quizHistory.v1";

function nowISO(): string {
  return new Date().toISOString();
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 구버전 레코드(파일 필드 없음)도 안전하게 정규화 */
function normalize(record: SubjectRecord): SubjectRecord {
  return {
    ...record,
    artifacts: record.artifacts ?? {},
    artifactsBucket: record.artifactsBucket ?? {},
    files: Array.isArray(record.files) ? record.files : [],
  };
}

function readAll(): SubjectRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SubjectRecord[]).map(normalize) : [];
  } catch {
    // 손상된 데이터로 앱이 깨지지 않도록 빈 목록으로 폴백
    return [];
  }
}

function writeAll(records: SubjectRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 용량 초과 등은 조용히 무시 (추후 Supabase 이전 시 해소)
  }
}

/* ------------------------------------------------------------------ */

export function listSubjects(): SubjectRecord[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 전체 레코드를 통째로 교체 (클라우드 동기화 후 로컬 캐시 갱신용) */
export function replaceAll(records: SubjectRecord[]): void {
  writeAll(records.map(normalize));
}

export function getSubject(id: string): SubjectRecord | undefined {
  return readAll().find((s) => s.id === id);
}

export function createSubject(input: SubjectInput): SubjectRecord {
  const records = readAll();
  const ts = nowISO();
  const record: SubjectRecord = {
    id: genId(),
    title: input.title.trim(),
    examDate: input.examDate,
    description: input.description,
    sourceText: "",
    studyNote: "",
    artifacts: {},
    files: [],
    createdAt: ts,
    updatedAt: ts,
  };
  records.push(record);
  writeAll(records);
  return record;
}

export function updateSubject(
  id: string,
  patch: Partial<Pick<Subject, "title" | "examDate" | "description" | "sourceText" | "studyNote">>
): SubjectRecord | undefined {
  const records = readAll();
  const idx = records.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  records[idx] = { ...records[idx], ...patch, updatedAt: nowISO() };
  writeAll(records);
  return records[idx];
}

/** 소스(scopeKey)별로 AI 결과를 저장한다. */
export function saveArtifacts(
  id: string,
  scopeKey: string,
  patch: Partial<StudyArtifacts>
): SubjectRecord | undefined {
  const records = readAll();
  const idx = records.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  const bucket = { ...(records[idx].artifactsBucket ?? {}) };
  bucket[scopeKey] = { ...(bucket[scopeKey] ?? {}), ...patch };
  records[idx] = {
    ...records[idx],
    artifactsBucket: bucket,
    updatedAt: nowISO(),
  };
  writeAll(records);
  if (patch.questions) {
    addGeneratedQuizRecord(id, records[idx].title, patch.questions);
  }
  return records[idx];
}

/** 모든 스코프의 결과 묶음 목록 (레거시 artifacts 포함) — 통계/뱃지 집계용 */
export function allArtifacts(record: SubjectRecord): StudyArtifacts[] {
  const list = Object.values(record.artifactsBucket ?? {});
  if (record.artifacts && Object.keys(record.artifacts).length > 0) {
    list.push(record.artifacts);
  }
  return list;
}

/** scopeKey 기준 결과 조회 (레거시 artifacts 는 'all' 로 폴백) */
export function getScopedArtifacts(
  record: SubjectRecord,
  scopeKey: string
): StudyArtifacts {
  const bucket = record.artifactsBucket ?? {};
  if (bucket[scopeKey]) return bucket[scopeKey];
  // 하위호환: 예전 과목 단위 결과는 'all' 스코프에서만 보여준다
  if (scopeKey === "all" && record.artifacts) return record.artifacts;
  return {};
}

function readQuizHistory(): QuizHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUIZ_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QuizHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeQuizHistory(items: QuizHistoryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // localStorage quota errors should not block study generation.
  }
}

function countQuestions(set: QuestionSet): number {
  return (
    (set.multipleChoice?.length ?? 0) +
    (set.ox?.length ?? 0) +
    (set.shortAnswer?.length ?? 0) +
    (set.essay?.length ?? 0)
  );
}

function addGeneratedQuizRecord(subjectId: string, title: string, questions: QuestionSet): void {
  const item: QuizHistoryItem = {
    id: genId(),
    subjectId,
    title,
    generatedAt: nowISO(),
    questionCount: countQuestions(questions),
  };
  writeQuizHistory([item, ...readQuizHistory()]);
}

export function listQuizHistory(subjectId: string): QuizHistoryItem[] {
  return readQuizHistory()
    .filter((item) => item.subjectId === subjectId)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export function saveQuizAttempt(
  subjectId: string,
  result: Pick<QuizHistoryItem, "answeredCount" | "correctCount" | "totalScored">
): QuizHistoryItem {
  const items = readQuizHistory();
  const idx = items.findIndex((item) => item.subjectId === subjectId && !item.completedAt);
  const base: QuizHistoryItem =
    idx >= 0
      ? items[idx]
      : {
          id: genId(),
          subjectId,
          title: "직접 풀이",
          generatedAt: nowISO(),
          questionCount: result.answeredCount ?? 0,
        };
  const updated: QuizHistoryItem = {
    ...base,
    ...result,
    completedAt: nowISO(),
  };
  if (idx >= 0) items[idx] = updated;
  else items.unshift(updated);
  writeQuizHistory(items);
  return updated;
}

export function deleteSubject(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

/* ------------------------------------------------------------------ */
/* 학습 파일 CRUD (과목 레코드에 종속)                                  */
/* ------------------------------------------------------------------ */

export function addFile(subjectId: string, file: StudyFile): SubjectRecord | undefined {
  const records = readAll();
  const idx = records.findIndex((s) => s.id === subjectId);
  if (idx === -1) return undefined;
  records[idx] = {
    ...records[idx],
    files: [...records[idx].files, file],
    updatedAt: nowISO(),
  };
  writeAll(records);
  return records[idx];
}

export function updateFile(
  subjectId: string,
  fileId: string,
  patch: Partial<StudyFile>
): SubjectRecord | undefined {
  const records = readAll();
  const idx = records.findIndex((s) => s.id === subjectId);
  if (idx === -1) return undefined;
  records[idx] = {
    ...records[idx],
    files: records[idx].files.map((f) => (f.id === fileId ? { ...f, ...patch } : f)),
    updatedAt: nowISO(),
  };
  writeAll(records);
  return records[idx];
}

export function deleteFile(subjectId: string, fileId: string): SubjectRecord | undefined {
  const records = readAll();
  const idx = records.findIndex((s) => s.id === subjectId);
  if (idx === -1) return undefined;
  records[idx] = {
    ...records[idx],
    files: records[idx].files.filter((f) => f.id !== fileId),
    updatedAt: nowISO(),
  };
  writeAll(records);
  return records[idx];
}
