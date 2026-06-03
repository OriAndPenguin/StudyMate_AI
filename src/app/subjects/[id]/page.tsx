"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FileUploadPanel from "@/components/files/FileUploadPanel";
import GeneratePanel from "@/components/GeneratePanel";
import ResultTabs from "@/components/ResultTabs";
import { useSubjects } from "@/context/SubjectsContext";
import { useGenerate } from "@/hooks/useGenerate";
import { MIN_SOURCE_LENGTH, resolveSource } from "@/lib/files";
import type { GenerationKind } from "@/types/study";

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, getById, updateInfo } = useSubjects();

  const subject = getById(id);

  const [manualText, setManualText] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GenerationKind>("summary");

  // 직접 입력 텍스트는 최초 1회만 저장값으로 초기화
  useEffect(() => {
    if (subject && manualText === null) setManualText(subject.sourceText ?? "");
  }, [subject, manualText]);

  // 분석 대상 텍스트 결정 (파일 선택 → 전체 파일 → 직접 입력)
  const resolved = subject
    ? resolveSource(subject, selectedFileId)
    : { text: "", label: "자료 없음", origin: "none" as const };

  const canGenerate = resolved.text.trim().length >= MIN_SOURCE_LENGTH;
  const hint =
    resolved.origin === "none"
      ? "공부자료를 업로드하거나 직접 텍스트를 입력해 주세요."
      : !canGenerate
      ? "분석할 텍스트가 부족합니다."
      : undefined;

  // 생성 시점의 최신 텍스트 보장
  const sourceRef = useRef("");
  sourceRef.current = resolved.text;

  const { statuses, error, busy, generate, generateAll } = useGenerate({
    subjectId: id,
    getSourceText: () => sourceRef.current,
    subjectTitle: subject?.title ?? "",
    onGenerated: (kind) => setActiveTab(kind),
  });

  function persistManual() {
    if (subject && manualText !== null) updateInfo(subject.id, { sourceText: manualText });
  }

  if (ready && !subject) {
    return (
      <div className="px-6 py-20 text-center lg:px-10">
        <p className="text-slate-500">과목을 찾을 수 없습니다.</p>
        <Link href="/" className="mt-4 inline-block text-brand-600 hover:underline">
          ← 대시보드로
        </Link>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="px-6 py-20 text-center text-sm text-slate-400 lg:px-10">불러오는 중…</div>
    );
  }

  const text = manualText ?? "";

  return (
    <div className="lg:flex lg:h-screen lg:flex-col">
      {/* 과목 헤더 */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className="text-xs text-slate-400 hover:text-brand-600">
              ← 대시보드
            </Link>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900">
              {subject.title}
            </h1>
            {subject.description && (
              <p className="truncate text-sm text-slate-500">{subject.description}</p>
            )}
          </div>
          {subject.examDate && (
            <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              시험일 {subject.examDate}
            </span>
          )}
        </div>
      </header>

      {/* 좌우 분할 */}
      <div className="lg:flex lg:min-h-0 lg:flex-1">
        {/* 왼쪽: 공부자료 (35%) */}
        <section className="border-b border-slate-200 p-5 lg:w-[35%] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <FileUploadPanel
            subject={subject}
            selectedFileId={selectedFileId}
            onSelectFile={setSelectedFileId}
            manualText={text}
            onManualChange={setManualText}
            onManualBlur={persistManual}
          />
        </section>

        {/* 오른쪽: AI 학습 결과 (65%) */}
        <section className="p-6 lg:w-[65%] lg:overflow-y-auto lg:p-8">
          {/* 분석 대상 표시 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">분석 기준</span>
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

          {/* 생성 버튼 */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <GeneratePanel
              variant="bar"
              artifacts={subject.artifacts}
              statuses={statuses}
              busy={busy}
              canGenerate={canGenerate}
              hint={hint}
              onGenerate={generate}
              onGenerateAll={generateAll}
            />
            {error && (
              <p className="mt-3 whitespace-pre-line rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* 결과 (학습 노트) */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:p-6">
            <ResultTabs
              artifacts={subject.artifacts}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
