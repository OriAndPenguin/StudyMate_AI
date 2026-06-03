"use client";

import type {
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
  patch: Partial<Pick<Subject, "title" | "examDate" | "description" | "sourceText">>
): SubjectRecord | undefined {
  const records = readAll();
  const idx = records.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  records[idx] = { ...records[idx], ...patch, updatedAt: nowISO() };
  writeAll(records);
  return records[idx];
}

export function saveArtifacts(
  id: string,
  patch: Partial<StudyArtifacts>
): SubjectRecord | undefined {
  const records = readAll();
  const idx = records.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  records[idx] = {
    ...records[idx],
    artifacts: { ...records[idx].artifacts, ...patch },
    updatedAt: nowISO(),
  };
  writeAll(records);
  return records[idx];
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
