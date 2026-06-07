"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import OriginalViewer from "@/components/OriginalViewer";
import ResultTabs from "@/components/ResultTabs";
import StudyNotesPanel from "@/components/StudyNotesPanel";
import { useSubjects } from "@/context/SubjectsContext";
import { useGenerate } from "@/hooks/useGenerate";
import { MIN_SOURCE_LENGTH, resolveSource } from "@/lib/files";
import { getScopedArtifacts } from "@/lib/storage";
import type { GenerationKind } from "@/types/study";

type WorkspaceView = GenerationKind | "notes";

const WORKSPACE_TABS: { key: WorkspaceView; label: string }[] = [
  { key: "summary", label: "요약" },
  { key: "terms", label: "용어" },
  { key: "questions", label: "퀴즈" },
  { key: "flashcards", label: "카드" },
  { key: "notes", label: "메모" },
];

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="px-6 py-20 text-center text-sm text-slate-400">불러오는 중...</div>}>
      <StudyInner />
    </Suspense>
  );
}

function StudyInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const selectedFileId = searchParams.get("file");
  const { ready, getById, updateInfo } = useSubjects();

  const subject = getById(id);
  const [activeView, setActiveView] = useState<WorkspaceView>("summary");

  const goToPageRef = useRef<((page: number) => void) | null>(null);
  const registerGoToPage = useCallback((fn: ((page: number) => void) | null) => {
    goToPageRef.current = fn;
  }, []);

  const resolved = subject
    ? resolveSource(subject, selectedFileId)
    : { text: "", label: "자료 없음", origin: "none" as const, key: "none" };

  const canGenerate = resolved.text.trim().length >= MIN_SOURCE_LENGTH;
  const hint =
    resolved.origin === "none"
      ? "추출된 자료가 없습니다. 자료 화면에서 파일을 업로드하거나 텍스트를 입력해 주세요."
      : !canGenerate
      ? "분석할 텍스트가 부족합니다."
      : undefined;

  // 결과는 선택한 소스(파일/전체/직접입력)별로 분리해 저장·표시
  const scopedArtifacts = subject ? getScopedArtifacts(subject, resolved.key) : {};

  const sourceRef = useRef("");
  sourceRef.current = resolved.text;
  const scopeRef = useRef("none");
  scopeRef.current = resolved.key;

  const { statuses, error, busy, generate } = useGenerate({
    subjectId: id,
    getSourceText: () => sourceRef.current,
    getScopeKey: () => scopeRef.current,
    subjectTitle: subject?.title ?? "",
    onGenerated: (kind) => setActiveView(kind),
  });

  if (ready && !subject) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-slate-500">과목을 찾을 수 없습니다.</p>
        <Link href="/" className="mt-4 inline-block text-brand-600 hover:underline">
          대시보드로
        </Link>
      </div>
    );
  }

  if (!subject) {
    return <div className="px-6 py-20 text-center text-sm text-slate-400">불러오는 중...</div>;
  }

  return (
    <div className="bg-cream lg:flex lg:h-screen lg:flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4 pr-20 lg:px-8 lg:pr-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/subjects/${id}`} className="text-xs font-semibold text-slate-400 hover:text-brand-600">
              자료 화면
            </Link>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900">
              {subject.title}
            </h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {sourceLabel(resolved.origin, resolved.label)}
          </span>
        </div>
      </header>

      <div className="lg:flex lg:min-h-0 lg:flex-1">
        <section className="border-b border-slate-200 bg-white p-5 lg:w-1/2 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-6">
          <OriginalViewer
            subject={subject}
            selectedFileId={selectedFileId}
            registerGoToPage={registerGoToPage}
          />
        </section>

        <section className="p-5 lg:w-1/2 lg:overflow-y-auto lg:p-6">
          {/* 워크스페이스 탭 */}
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card">
            {WORKSPACE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key)}
                className={`flex-1 rounded-xl px-2 py-2.5 text-sm font-bold transition ${
                  activeView === tab.key
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-slate-500 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 탭 내용 (생성도 각 탭 안에서) */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:p-6">
            {activeView === "notes" ? (
              <StudyNotesPanel
                value={subject.studyNote ?? ""}
                onChange={(studyNote) => updateInfo(subject.id, { studyNote })}
              />
            ) : (
              <ResultTabs
                artifacts={scopedArtifacts}
                activeTab={activeView}
                statuses={statuses}
                busy={busy}
                canGenerate={canGenerate}
                hint={hint}
                error={error}
                onGenerate={generate}
                onSummaryPageClick={(page) => goToPageRef.current?.(page)}
                subjectId={subject.id}
                subjectTitle={subject.title}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function sourceLabel(origin: string, label: string): string {
  if (origin === "file") return label;
  if (origin === "all-files") return "과목 전체 자료";
  if (origin === "manual") return "직접 입력 텍스트";
  return "자료 없음";
}
