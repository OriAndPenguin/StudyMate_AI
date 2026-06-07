"use client";

import Link from "next/link";
import { daysUntil, formatDate } from "@/lib/format";
import { allArtifacts } from "@/lib/storage";
import type { SubjectRecord } from "@/types/study";

export default function SubjectCard({ subject }: { subject: SubjectRecord }) {
  const dday = daysUntil(subject.examDate);
  const arts = allArtifacts(subject);
  const generated = [
    arts.some((a) => a.summary) && "요약",
    arts.some((a) => a.terms?.length) && "용어",
    arts.some((a) => a.questions) && "문제",
    arts.some((a) => a.flashcards?.length) && "카드",
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_10px_30px_rgba(2,132,199,0.10)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-lg">
          📘
        </div>
        {dday && (
          <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
            {dday}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-base font-bold text-slate-900 line-clamp-2 group-hover:text-brand-700">
        {subject.title}
      </h3>
      {subject.description && (
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{subject.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {generated.length > 0 ? (
          generated.map((g) => (
            <span
              key={g}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700"
            >
              {g}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">
            아직 생성 전
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
        <span>{subject.examDate ? `시험일 ${subject.examDate}` : "시험일 미정"}</span>
        <span>{formatDate(subject.updatedAt)}</span>
      </div>
    </Link>
  );
}
