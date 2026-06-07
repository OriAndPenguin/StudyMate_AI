"use client";

import { useSubjects } from "@/context/SubjectsContext";
import { useAuth } from "@/context/AuthContext";

/** 사이드바 하단 계정 영역 — 구글 로그인 / 로그아웃 */
export default function AccountButton() {
  const { enabled, ready, user, signInWithGoogle, signOut } = useAuth();
  const { syncing } = useSubjects();

  // Supabase 미설정이면 로그인 UI 자체를 숨긴다 (기존 localStorage 모드)
  if (!enabled) return null;

  if (!ready) {
    return (
      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
        로그인 확인 중…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="border-t border-slate-100 px-4 py-3">
        <button
          onClick={() => void signInWithGoogle()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <GoogleIcon />
          Google로 로그인
        </button>
        <p className="mt-1.5 px-1 text-[11px] leading-relaxed text-slate-400">
          로그인하면 모든 기기에서 같은 자료·결과를 볼 수 있어요.
        </p>
      </div>
    );
  }

  const name =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "내 계정";

  return (
    <div className="border-t border-slate-100 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-700">{name}</p>
          <p className="text-[11px] text-slate-400">
            {syncing ? "동기화 중…" : "기기 간 동기화 켜짐"}
          </p>
        </div>
        <button
          onClick={() => void signOut()}
          className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.7 29.6 2.7 24 2.7 12.3 2.7 2.7 12.3 2.7 24S12.3 45.3 24 45.3 45.3 35.7 45.3 24c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M5.3 13.5l6.6 4.8C13.7 14.6 18.5 11.7 24 11.7c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.7 29.6 2.7 24 2.7 16.2 2.7 9.4 7.1 5.3 13.5z"
      />
      <path
        fill="#4CAF50"
        d="M24 45.3c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.7 2.5-7.6 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.3 40.8 16.1 45.3 24 45.3z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.2 5.6l6.5 5.5c-.5.4 7-5.1 7-15.1 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
