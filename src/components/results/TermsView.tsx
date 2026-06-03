"use client";

import type { TermItem } from "@/types/study";

export default function TermsView({ data }: { data: TermItem[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">정리된 용어가 없습니다.</p>;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {data.map((t, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
        >
          <h3 className="text-lg font-bold text-brand-700">{t.term}</h3>

          <dl className="mt-3 space-y-2.5 text-sm">
            <Row label="정의" value={t.definition} />
            <Row label="쉬운 설명" value={t.easyExplanation} />
            <Row label="예시" value={t.example} />
            <Row label="시험 포인트" value={t.examPoint} highlight />
          </dl>
        </div>
      ))}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[72px_1fr] gap-2">
      <dt className="text-xs font-semibold text-slate-400">{label}</dt>
      <dd
        className={
          highlight
            ? "rounded-md bg-brand-50 px-2 py-1 text-slate-800"
            : "text-slate-700"
        }
      >
        {value}
      </dd>
    </div>
  );
}
