"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubjects } from "@/context/SubjectsContext";
import SubjectCard from "@/components/SubjectCard";
import NewSubjectModal from "@/components/NewSubjectModal";
import type { SubjectInput } from "@/types/study";

export default function Dashboard() {
  const router = useRouter();
  const { subjects, ready, create } = useSubjects();
  const [modalOpen, setModalOpen] = useState(false);

  const counts = useMemo(() => {
    let withFiles = 0;
    for (const s of subjects) if (s.files.length > 0) withFiles += 1;
    return { total: subjects.length, withFiles };
  }, [subjects]);

  function handleCreate(input: SubjectInput) {
    const record = create(input);
    setModalOpen(false);
    router.push(`/subjects/${record.id}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
      {/* 히어로 */}
      <header className="overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-7 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
              StudyMate AI
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">
              내 과목
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              과목을 선택해 자료를 올리고, AI로 요약·용어·퀴즈·카드를 만들어 보세요.
            </p>

            {ready && counts.total > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip>과목 {counts.total}</Chip>
                <Chip>자료 있음 {counts.withFiles}</Chip>
              </div>
            )}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(2,132,199,0.3)] transition hover:-translate-y-0.5 hover:bg-brand-700"
          >
            + 새 과목 만들기
          </button>
        </div>
      </header>

      {/* 과목 목록 */}
      <section className="mt-9">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
          과목 목록
        </h2>

        {!ready ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            불러오는 중…
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-brand-200 bg-white p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
              📚
            </div>
            <p className="mt-4 text-base font-bold text-slate-800">아직 과목이 없어요</p>
            <p className="mt-1 text-sm text-slate-400">
              위의 <span className="font-semibold text-brand-600">+ 새 과목 만들기</span> 로 첫 과목을 추가해 보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {subjects.map((s) => (
              <SubjectCard key={s.id} subject={s} />
            ))}
          </div>
        )}
      </section>

      <NewSubjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-brand-100 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700">
      {children}
    </span>
  );
}
