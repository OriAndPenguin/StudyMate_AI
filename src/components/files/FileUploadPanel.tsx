"use client";

import { useRef, useState } from "react";
import { useSubjects } from "@/context/SubjectsContext";
import FileCard from "@/components/files/FileCard";
import {
  FILE_ACCEPT,
  detectFileType,
  extractFileText,
  makeStudyFile,
} from "@/lib/files";
import type { SubjectRecord } from "@/types/study";

export default function FileUploadPanel({
  subject,
  selectedFileId,
  onSelectFile,
  manualText,
  onManualChange,
  onManualBlur,
}: {
  subject: SubjectRecord;
  selectedFileId: string | null;
  onSelectFile: (id: string | null) => void;
  manualText: string;
  onManualChange: (v: string) => void;
  onManualBlur: () => void;
}) {
  const { addFile, updateFile, removeFile } = useSubjects();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(subject.files.length === 0);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);

    for (const file of Array.from(fileList)) {
      const type = detectFileType(file.name);
      if (!type) {
        setUploadError(`"${file.name}" 은(는) 지원하지 않는 형식입니다. (PDF, PPTX, PPT)`);
        continue;
      }

      const record = makeStudyFile(subject.id, file, type);
      addFile(subject.id, record);
      updateFile(subject.id, record.id, { status: "extracting" });

      // 비동기 추출 (실패해도 throw 안 함)
      const res = await extractFileText(file);
      updateFile(subject.id, record.id, {
        status: res.status,
        extractedText: res.extractedText,
        // 실패 사유 또는 스캔 PDF 등 안내를 함께 보관
        errorMessage: res.errorMessage ?? res.notice,
      });
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDelete(fileId: string) {
    removeFile(subject.id, fileId);
    if (selectedFileId === fileId) onSelectFile(null);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">📂 공부자료</h2>
        {subject.files.length > 0 && (
          <button
            onClick={() => onSelectFile(null)}
            className={`text-xs font-semibold ${
              selectedFileId === null ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            과목 전체 사용
          </button>
        )}
      </div>

      {/* 드래그앤드롭 + 업로드 버튼 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-3 cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition ${
          dragOver
            ? "border-brand-400 bg-brand-50"
            : "border-slate-200 bg-slate-50 hover:border-brand-300"
        }`}
      >
        <p className="text-sm font-semibold text-slate-700">
          파일을 끌어다 놓거나 클릭하여 업로드
        </p>
        <p className="mt-1 text-xs text-slate-400">PDF · PPTX · PPT (최대 20MB)</p>
        <input
          ref={inputRef}
          type="file"
          accept={FILE_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploadError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {uploadError}
        </p>
      )}

      {/* 파일 목록 (내부 스크롤) */}
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {subject.files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            공부자료를 업로드해 주세요.
          </div>
        ) : (
          subject.files.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              selected={selectedFileId === f.id}
              onSelect={() => onSelectFile(f.id)}
              onDelete={() => handleDelete(f.id)}
            />
          ))
        )}
      </div>

      {/* 직접 텍스트 입력 (파일이 없을 때의 대체 입력) */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <button
          onClick={() => setShowManual((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          ✍️ 직접 텍스트 입력
          <span>{showManual ? "▲" : "▼"}</span>
        </button>
        {showManual && (
          <>
            <textarea
              value={manualText}
              onChange={(e) => onManualChange(e.target.value)}
              onBlur={onManualBlur}
              rows={5}
              placeholder="파일 없이 텍스트만으로 분석하려면 여기에 붙여넣으세요."
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{manualText.length}자</p>
          </>
        )}
      </div>
    </div>
  );
}
