"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import OriginalViewer from "@/components/OriginalViewer";
import GeneratePanel from "@/components/GeneratePanel";
import ResultTabs from "@/components/ResultTabs";
import { useSubjects } from "@/context/SubjectsContext";
import { useGenerate } from "@/hooks/useGenerate";
import { MIN_SOURCE_LENGTH, resolveSource } from "@/lib/files";
import type { GenerationKind } from "@/types/study";

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="px-6 py-20 text-center text-sm text-slate-400">불러오는 중…</div>}>
      <StudyInner />
    </Suspense>
  );
}

function StudyInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const selectedFileId = searchParams.get("file");
  const { ready, getById } = useSubjects();

  const subject = getById(id);
  // 학습 화면 진입 시 항상 "요약" 탭이 기본 선택
  const [activeTab, setActiveTab] = useState<GenerationKind>("summary");

  // 왼쪽 PDF 뷰어의 "해당 페이지로 이동" 함수 (요약의 p.N 클릭과 연동)
  const goToPageRef = useRef<((page: number) => void) | null>(null);
  const registerGoToPage = useCallback((fn: ((page: number) => void) | null) => {
    goToPageRef.current = fn;
  }, []);

  const resolved = subject
    ? resolveSource(subject, selectedFileId)
    : { text: "", label: "자료 없음", origin: "none" as const };

  const canGenerate = resolved.text.trim().length >= MIN_SOURCE_LENGTH;
  const hint =
    resolved.origin === "none"
      ? "추출된 자료가 없습니다. 자료 화면에서 파일을 업로드하거나 텍스트를 입력해 주세요."
      : !canGenerate
      ? "분석할 텍스트가 부족합니다."
      : undefined;

  const sourceRef = useRef("");
  sourceRef.current = resolved.text;

  const { statuses, error, busy, generate } = useGenerate({
    subjectId: id,
    getSourceText: () => sourceRef.current,
    subjectTitle: subject?.title ?? "",
    onGenerated: (kind) => setActiveTab(kind),
  });

  if (ready && !subject) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-slate-500">과목을 찾을 수 없습니다.</p>
        <Link href="/" className="mt-4 inline-block text-brand-600 hover:underline">
          ← 대시보드로
        </Link>
      </div>
    );
  }
  if (!subject) {
    return <div className="px-6 py-20 text-center text-sm text-slate-400">불러오는 중…</div>;
  }

  const hasSummary = !!subject.artifacts.summary;

  return (
    <div className="lg:flex lg:h-screen lg:flex-col">
      {/* 헤더 */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/subjects/${id}`} className="text-xs text-slate-400 hover:text-brand-600">
              ← 자료 화면
            </Link>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900">
              {subject.title}
            </h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {resolved.origin === "file"
              ? `📄 ${resolved.label}`
              : resolved.origin === "all-files"
              ? "📚 과목 전체 자료"
              : resolved.origin === "manual"
              ? "✍️ 직접 입력 텍스트"
              : "자료 없음"}
          </span>
        </div>
      </header>

      {/* 좌우 분할 */}
      <div className="lg:flex lg:min-h-0 lg:flex-1">
        {/* 왼쪽: 원본 자료 (50%) */}
        <section className="border-b border-slate-200 p-5 lg:w-1/2 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-6">
          <OriginalViewer
            subject={subject}
            selectedFileId={selectedFileId}
            registerGoToPage={registerGoToPage}
          />
        </section>

        {/* 오른쪽: AI 학습 결과 (50%) */}
        <section className="p-5 lg:w-1/2 lg:overflow-y-auto lg:p-6">
          {/* 요약이 아직 없으면 가장 눈에 띄는 CTA */}
          {!hasSummary && (
            <div className="mb-4 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-center">
              <p className="text-sm font-semibold text-slate-800">
                아직 요약노트가 없어요
              </p>
              <p className="mt-1 text-xs text-slate-500">
                먼저 요약을 만들어 핵심부터 빠르게 파악해 보세요.
              </p>
              <button
                onClick={() => generate("summary")}
                disabled={busy || !canGenerate}
                className="mt-3 rounded-xl bg-brand-600 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {statuses.summary === "loading" ? "요약 생성 중…" : "📝 요약 생성하기"}
              </button>
            </div>
          )}

          {/* 생성 버튼 모음 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <GeneratePanel
              artifacts={subject.artifacts}
              statuses={statuses}
              busy={busy}
              canGenerate={canGenerate}
              hint={hint}
              onGenerate={generate}
            />
            {error && (
              <p className="mt-3 whitespace-pre-line rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* 결과 탭 (기본: 요약) */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:p-6">
            <ResultTabs
              artifacts={subject.artifacts}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSummaryPageClick={(page) => goToPageRef.current?.(page)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
