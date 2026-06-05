"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Uploader from "@/components/files/Uploader";
import FileCard from "@/components/files/FileCard";
import { useSubjects } from "@/context/SubjectsContext";
import { MIN_SOURCE_LENGTH } from "@/lib/files";
import { deleteBlob } from "@/lib/fileBlobs";

export default function SubjectUploadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, getById, removeFile, updateInfo } = useSubjects();

  const subject = getById(id);
  const [manualText, setManualText] = useState<string | null>(null);

  useEffect(() => {
    if (subject && manualText === null) setManualText(subject.sourceText ?? "");
  }, [subject, manualText]);

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
    return <div className="px-6 py-20 text-center text-sm text-slate-400">불러오는 중…</div>;
  }

  const files = subject.files;
  const extractedCount = files.filter((f) => f.status === "extracted" && f.extractedText).length;
  const text = manualText ?? "";
  const manualReady = text.trim().length >= MIN_SOURCE_LENGTH;

  function goStudy(fileId?: string) {
    router.push(fileId ? `/subjects/${id}/study?file=${fileId}` : `/subjects/${id}/study`);
  }
  function persistManual() {
    if (manualText !== null) updateInfo(id, { sourceText: manualText });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-10 lg:py-10">
      <Link href="/" className="text-xs text-slate-400 hover:text-brand-600">
        ← 대시보드
      </Link>

      <header className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{subject.title}</h1>
          {subject.description && (
            <p className="text-sm text-slate-500">{subject.description}</p>
          )}
        </div>
        {subject.examDate && (
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            시험일 {subject.examDate}
          </span>
        )}
      </header>

      <p className="mt-4 text-sm text-slate-500">
        ① 공부자료를 업로드해 텍스트 추출이 끝나면, ② 자료를 선택해 학습 화면으로 이동합니다.
      </p>

      {/* 업로드 */}
      <section className="mt-5">
        <Uploader subjectId={id} />
      </section>

      {/* 과목 전체로 학습 */}
      {extractedCount > 0 && (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              추출 완료된 자료 {extractedCount}개
            </p>
            <p className="text-xs text-slate-500">모든 자료를 합쳐서 학습할 수 있어요.</p>
          </div>
          <button
            onClick={() => goStudy()}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            과목 전체로 학습하기 →
          </button>
        </div>
      )}

      {/* 파일 목록 */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          업로드한 자료
        </h2>
        {files.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            공부자료를 업로드해 주세요.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {files.map((f) => {
              const canStudy = f.status === "extracted" && !!f.extractedText;
              return (
                <FileCard
                  key={f.id}
                  file={f}
                  onDelete={() => {
                    removeFile(id, f.id);
                    void deleteBlob(f.id);
                  }}
                  actionLabel={
                    f.status === "extracted"
                      ? "이 자료로 학습하기 →"
                      : f.status === "extracting"
                      ? "추출 중…"
                      : f.status === "failed"
                      ? "추출 실패 — 학습 불가"
                      : "대기 중"
                  }
                  onAction={() => goStudy(f.id)}
                  actionDisabled={!canStudy}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 직접 텍스트 입력 (파일 없이 학습) */}
      <section className="mt-8 border-t border-slate-100 pt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">✍️ 직접 텍스트로 학습</h2>
        <p className="mb-2 text-xs text-slate-400">
          파일 없이 텍스트만으로 학습하려면 여기에 붙여넣으세요. (파일이 있으면 파일이 우선)
        </p>
        <textarea
          value={text}
          onChange={(e) => setManualText(e.target.value)}
          onBlur={persistManual}
          rows={5}
          placeholder="강의 노트나 정리한 텍스트를 붙여넣어 주세요."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">{text.length}자</span>
          <button
            onClick={() => {
              persistManual();
              goStudy();
            }}
            disabled={!manualReady || extractedCount > 0}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            title={extractedCount > 0 ? "추출된 파일이 있어 파일 기준으로 학습합니다" : undefined}
          >
            텍스트로 학습하기 →
          </button>
        </div>
      </section>
    </div>
  );
}
