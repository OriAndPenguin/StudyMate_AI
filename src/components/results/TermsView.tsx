"use client";

import type { TermItem } from "@/types/study";

export default function TermsView({ data }: { data: TermItem[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">정리된 용어가 없습니다.</p>;
  }

  return (
    <article className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">용어 정리</h2>

      <div className="mt-6 divide-y divide-slate-100">
        {data.map((t, i) => (
          <section key={i} className="py-6 first:pt-0">
            {/* 용어명 + 정의 */}
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-brand-400">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-lg font-bold text-slate-900">{t.term}</h3>
            </div>
            {t.definition && (
              <p className="mt-2 text-[15px] leading-7 text-slate-700">{t.definition}</p>
            )}

            {/* 보조 설명 */}
            <dl className="mt-3 space-y-1.5">
              <Line label="쉬운 설명" value={t.easyExplanation} />
              <Line label="예시" value={t.example} />
            </dl>

            {/* 시험 포인트 — 은은한 강조 */}
            {t.examPoint && (
              <p className="mt-3 border-l-2 border-brand-300 pl-3 text-sm leading-7 text-slate-600">
                <span className="font-semibold text-brand-700">시험 포인트 </span>
                {t.examPoint}
              </p>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

function Line({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[15px] leading-7">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}
