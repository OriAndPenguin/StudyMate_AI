"use client";

import Link from "next/link";
import { daysUntil, formatDate } from "@/lib/format";
import type { SubjectRecord } from "@/types/study";

export default function SubjectCard({ subject }: { subject: SubjectRecord }) {
  const dday = daysUntil(subject.examDate);
  const a = subject.artifacts;
  const generated = [
    a.summary && "요약",
    a.terms?.length && "용어",
    a.questions && "문제",
    a.flashcards?.length && "카드",
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
          {subject.title}
        </h3>
        {dday && (
          <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
            {dday}
          </span>
        )}
      </div>

      {subject.description && (
        <p className="mt-2 text-sm text-slate-500 line-clamp-2">{subject.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        {subject.examDate && <span>시험일 {subject.examDate}</span>}
        {generated.length > 0 ? (
          <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-600">
            {generated.join(" · ")}
          </span>
        ) : (
          <span className="rounded bg-slate-100 px-2 py-0.5">아직 생성 전</span>
        )}
        <span className="ml-auto">수정 {formatDate(subject.updatedAt)}</span>
      </div>
    </Link>
  );
}
