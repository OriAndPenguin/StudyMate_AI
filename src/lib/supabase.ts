"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 브라우저 클라이언트.
 * - 공개 가능한 값만 사용: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   (anon 키는 RLS 로 보호되므로 클라이언트 노출이 정상)
 * - 환경변수가 없으면 null → 앱은 기존 localStorage 모드로 그대로 동작한다.
 */

/** 앞뒤 공백/따옴표 제거 */
function clean(v?: string): string {
  return (v ?? "").trim().replace(/^['"]+|['"]+$/g, "").trim();
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Supabase URL 은 호스트(origin)만 있어야 한다.
 * 'Data API URL' 등을 복사해 `/rest/v1` 같은 경로가 붙는 실수가 흔해,
 * 경로/쿼리를 잘라내고 `https://xxx.supabase.co` 형태로 정규화한다.
 */
function normalizeSupabaseUrl(raw: string): string {
  try {
    return new URL(raw).origin;
  } catch {
    return raw;
  }
}

const rawUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const url = normalizeSupabaseUrl(rawUrl);
const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const validUrl = isHttpUrl(url);
export const isSupabaseConfigured = Boolean(validUrl && anonKey);

if (url && !validUrl) {
  // 값이 깨졌을 때(키를 URL 칸에 붙여넣는 등) 앱 전체가 죽지 않도록 경고만 남긴다.
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL 이 올바른 URL 이 아닙니다. (https://<프로젝트>.supabase.co 형식이어야 함)"
  );
}

let client: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  } catch (e) {
    console.warn("[supabase] 클라이언트 생성 실패:", e);
  }
}

export const supabase: SupabaseClient | null = client;
