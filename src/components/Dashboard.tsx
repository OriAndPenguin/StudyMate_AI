"use client";

import { useMemo } from "react";
import { useSubjects } from "@/context/SubjectsContext";
import SubjectCard from "@/components/SubjectCard";

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-card ${
        accent ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="text-lg">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { subjects, ready } = useSubjects();

  const stats = useMemo(() => {
    let summaries = 0;
    let questions = 0;
    let flashcards = 0;
    for (const s of subjects) {
      const a = s.artifacts;
      if (a.summary) summaries += 1;
      if (a.questions) {
        questions +=
          a.questions.multipleChoice.length +
          a.questions.ox.length +
          a.questions.shortAnswer.length +
          a.questions.essay.length;
      }
      if (a.flashcards) flashcards += a.flashcards.length;
    }
    return { total: subjects.length, summaries, questions, flashcards };
  }, [subjects]);

  const recent = subjects.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          학습 대시보드
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          강의자료를 넣으면 AI가 시험 대비 요약 · 용어정리 · 문제 · 복습카드를 만들어줍니다.
        </p>
      </header>

      {/* 통계 카드 */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="📚" label="전체 과목" value={stats.total} accent />
        <StatCard icon="📝" label="요약노트" value={stats.summaries} />
        <StatCard icon="❓" label="생성된 문제" value={stats.questions} />
        <StatCard icon="🃏" label="플래시카드" value={stats.flashcards} />
      </section>

      {/* 최근 수정한 과목 */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          최근 수정한 과목
        </h2>

        {!ready ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            불러오는 중…
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">
              아직 과목이 없어요
            </p>
            <p className="mt-1 text-sm text-slate-400">
              왼쪽 사이드바의 <span className="font-semibold text-brand-600">+ 새 과목 만들기</span> 로 첫 과목을 추가해 보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((s) => (
              <SubjectCard key={s.id} subject={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
