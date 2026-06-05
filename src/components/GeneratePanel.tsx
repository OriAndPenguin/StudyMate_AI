"use client";

import { GENERATORS, hasArtifact } from "@/lib/generators";
import type {
  GenerationKind,
  GenerationStatus,
  StudyArtifacts,
} from "@/types/study";

/**
 * 버튼을 누르면 해당 항목만 즉시 생성한다. (필요한 것만 생성 → 토큰 절약)
 */
export default function GeneratePanel({
  artifacts,
  statuses,
  busy,
  canGenerate,
  hint,
  onGenerate,
}: {
  artifacts: StudyArtifacts;
  statuses: Record<GenerationKind, GenerationStatus>;
  busy: boolean;
  canGenerate: boolean;
  hint?: string;
  onGenerate: (kind: GenerationKind) => void;
}) {
  return (
    <div className="space-y-2">
      {!canGenerate && hint && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{hint}</p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GENERATORS.map(({ kind, tab, icon }) => {
          const status = statuses[kind];
          const loading = status === "loading";
          const done = status === "done" || hasArtifact(artifacts, kind);
          const errored = status === "error";

          return (
            <button
              key={kind}
              type="button"
              onClick={() => onGenerate(kind)}
              disabled={busy || !canGenerate}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                errored
                  ? "border-red-200 bg-red-50 text-red-600"
                  : done
                  ? "border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              {loading ? (
                <span className="animate-pulse text-brand-600">생성 중…</span>
              ) : (
                <>
                  <span>{icon}</span>
                  <span>{tab}</span>
                  {done && <span className="text-brand-500">✓</span>}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
