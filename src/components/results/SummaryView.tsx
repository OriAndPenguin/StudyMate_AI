"use client";

import type { SummaryNote } from "@/types/study";

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
        <span>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function SummaryView({ data }: { data: SummaryNote }) {
  const overview = data.overview ?? [];
  const examPoints = data.examPoints ?? [];
  const checklist = data.memorizeChecklist ?? [];
  const confusing = data.confusingConcepts ?? [];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Section icon="📝" title="전체 핵심 요약">
        {overview.length ? (
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
            {overview.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        ) : (
          <EmptyLine />
        )}
      </Section>

      <Section icon="🎯" title="시험 출제 가능 포인트">
        {examPoints.length ? (
          <ul className="space-y-1.5 text-sm leading-relaxed text-slate-700">
            {examPoints.map((t, i) => (
              <li key={i} className="rounded-lg bg-brand-50 px-3 py-2">
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyLine />
        )}
      </Section>

      <Section icon="✅" title="암기 체크리스트">
        {checklist.length ? (
          <ul className="space-y-1.5 text-sm text-slate-700">
            {checklist.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-500">☐</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyLine />
        )}
      </Section>

      <Section icon="⚠️" title="헷갈리기 쉬운 개념">
        {confusing.length ? (
          <div className="space-y-3">
            {confusing.map((c, i) => (
              <div key={i} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">{c.concept}</p>
                <p className="mt-1 text-sm text-slate-700">{c.clarification}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyLine />
        )}
      </Section>
    </div>
  );
}

function EmptyLine() {
  return (
    <p className="text-sm text-slate-400">
      자료에서 확인된 내용이 없어 비워 두었습니다.
    </p>
  );
}
