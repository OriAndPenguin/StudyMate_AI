"use client";

/**
 * Supabase 동기화 헬퍼.
 * - 로그인 + 설정이 돼 있을 때만 동작하고, 아니면 전부 조용히 no-op.
 * - 과목 레코드는 `subjects` 테이블의 jsonb `data` 컬럼에 통째로 저장.
 * - 원본 파일(PDF 등)은 Storage 버킷 `files` 의 `${uid}/${fileId}` 경로에 저장.
 *   (RLS: 폴더명이 본인 uid 와 같아야 접근 가능)
 */

import { supabase } from "@/lib/supabase";
import type { SubjectRecord } from "@/types/study";

const BUCKET = "files";

/** 현재 로그인 사용자 id (없으면 null) */
async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export function cloudEnabled(): boolean {
  return Boolean(supabase);
}

/** 내 과목 전체 내려받기 */
export async function cloudPullSubjects(): Promise<SubjectRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("subjects").select("data");
  if (error) {
    console.warn("[cloud] pull subjects:", error.message);
    return [];
  }
  return (data ?? [])
    .map((row) => (row as { data: SubjectRecord }).data)
    .filter(Boolean);
}

/** 과목 레코드 1건 업서트 */
export async function cloudUpsertSubject(record: SubjectRecord): Promise<void> {
  if (!supabase) return;
  const owner = await currentUserId();
  if (!owner) return;
  const { error } = await supabase.from("subjects").upsert(
    {
      id: record.id,
      owner_id: owner,
      data: record,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) console.warn("[cloud] upsert subject:", error.message);
}

/** 과목 삭제 */
export async function cloudDeleteSubject(id: string): Promise<void> {
  if (!supabase) return;
  const owner = await currentUserId();
  if (!owner) return;
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) console.warn("[cloud] delete subject:", error.message);
}

/** 원본 파일 업로드 (덮어쓰기 허용) */
export async function cloudUploadFile(fileId: string, blob: Blob): Promise<void> {
  if (!supabase) return;
  const owner = await currentUserId();
  if (!owner) return;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${owner}/${fileId}`, blob, {
      upsert: true,
      contentType: blob.type || "application/octet-stream",
    });
  if (error) console.warn("[cloud] upload file:", error.message);
}

/** 원본 파일 내려받기 (없으면 undefined) */
export async function cloudDownloadFile(fileId: string): Promise<Blob | undefined> {
  if (!supabase) return undefined;
  const owner = await currentUserId();
  if (!owner) return undefined;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(`${owner}/${fileId}`);
  if (error) return undefined;
  return data ?? undefined;
}

/** 원본 파일 삭제 (best-effort) */
export async function cloudDeleteFile(fileId: string): Promise<void> {
  if (!supabase) return;
  const owner = await currentUserId();
  if (!owner) return;
  await supabase.storage.from(BUCKET).remove([`${owner}/${fileId}`]);
}
