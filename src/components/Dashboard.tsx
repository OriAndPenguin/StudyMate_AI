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

  // 메인은 과목 선택 중심 — 간단한 요약 수치만 한 줄로 표시
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
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">내 과목</h1>
          <p className="mt-1 text-sm text-slate-500">
            과목을 선택해 자료를 올리고 학습을 시작하세요.
            {ready && counts.total > 0 && (
              <span className="ml-1 text-slate-400">
                (전체 {counts.total}개 · 자료 있음 {counts.withFiles}개)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-card transition hover:bg-brand-700"
        >
          + 새 과목 만들기
        </button>
      </header>

      <section className="mt-8">
        {!ready ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            불러오는 중…
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-14 text-center">
            <p className="text-base font-semibold text-slate-700">아직 과목이 없어요</p>
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
