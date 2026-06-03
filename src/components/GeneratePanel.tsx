"use client";

import { GENERATORS, hasArtifact } from "@/lib/generators";
import type {
  GenerationKind,
  GenerationStatus,
  StudyArtifacts,
} from "@/types/study";

export default function GeneratePanel({
  artifacts,
  statuses,
  busy,
  canGenerate,
  hint,
  variant = "panel",
  onGenerate,
  onGenerateAll,
}: {
  artifacts: StudyArtifacts;
  statuses: Record<GenerationKind, GenerationStatus>;
  busy: boolean;
  /** 분석할 텍스트가 충분한지 */
  canGenerate: boolean;
  /** 생성 불가 시 안내 문구 */
  hint?: string;
  /** panel: 세로 스택(사이드바용) / bar: 가로 그리드(넓은 패널용) */
  variant?: "panel" | "bar";
  onGenerate: (kind: GenerationKind) => void;
  onGenerateAll: () => void;
}) {
  const disabled = busy || !canGenerate;
  const bar = variant === "bar";

  return (
    <div className="space-y-2.5">
      {!canGenerate && hint && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{hint}</p>
      )}

      <div className={bar ? "grid grid-cols-2 gap-2 xl:grid-cols-3" : "space-y-2.5"}>
      {GENERATORS.map(({ kind, action, icon }) => {
        const status = statuses[kind];
        const loading = status === "loading";
        const done = status === "done" || hasArtifact(artifacts, kind);
        const errored = status === "error";

        return (
          <button
            key={kind}
            onClick={() => onGenerate(kind)}
            disabled={disabled}
            className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              errored
                ? "border-red-200 bg-red-50 text-red-600"
                : done
                ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{icon}</span>
              {action}
            </span>
            <span className="text-xs">
              {loading ? (
                <span className="animate-pulse text-brand-600">생성 중…</span>
              ) : errored ? (
                "실패"
              ) : done ? (
                <span className="text-brand-600">✓ 생성됨</span>
              ) : null}
            </span>
          </button>
        );
      })}

      {/* 전체 생성 */}
      <button
        onClick={onGenerateAll}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 ${
          bar ? "col-span-2 xl:col-span-3" : "mt-1 w-full"
        }`}
      >
        {busy ? <span className="animate-pulse">생성 중…</span> : "⚡ 전체 생성"}
      </button>
      </div>
    </div>
  );
}
