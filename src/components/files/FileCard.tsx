"use client";

import { formatFileSize } from "@/lib/files";
import { formatDate } from "@/lib/format";
import type { ExtractionStatus, StudyFile } from "@/types/study";

const STATUS_META: Record<
  ExtractionStatus,
  { label: string; className: string }
> = {
  uploaded: { label: "업로드됨", className: "bg-slate-100 text-slate-500" },
  extracting: { label: "추출 중…", className: "bg-amber-100 text-amber-700 animate-pulse" },
  extracted: { label: "추출 완료", className: "bg-brand-100 text-brand-700" },
  failed: { label: "추출 실패", className: "bg-red-100 text-red-600" },
};

function timeOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default function FileCard({
  file,
  selected,
  onSelect,
  onDelete,
}: {
  file: StudyFile;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const status = STATUS_META[file.status];
  const preview = file.extractedText?.trim().slice(0, 140);

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border p-3 transition ${
        selected
          ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
          : "border-slate-200 bg-white hover:border-brand-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800" title={file.name}>
            {file.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            <span className="uppercase">{file.type}</span> · {formatFileSize(file.size)} ·{" "}
            {timeOf(file.uploadedAt)}
          </p>
        </div>
        <button
          aria-label="파일 삭제"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-red-500"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
          {status.label}
        </span>
        {selected && (
          <span className="text-[11px] font-semibold text-brand-600">● 선택됨</span>
        )}
      </div>

      {/* 추출 텍스트 미리보기 */}
      {file.status === "extracted" && preview && (
        <p className="mt-2 line-clamp-2 rounded-lg bg-slate-50 p-2 text-xs leading-relaxed text-slate-500">
          {preview}
          {file.extractedText && file.extractedText.length > 140 ? "…" : ""}
        </p>
      )}

      {/* 실패 사유 / 스캔 PDF 등 안내 */}
      {file.errorMessage && (
        <p
          className={`mt-2 rounded-lg p-2 text-xs leading-relaxed ${
            file.status === "failed"
              ? "bg-red-50 text-red-600"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {file.errorMessage}
        </p>
      )}

      {file.status === "extracting" && (
        <p className="mt-2 text-xs text-amber-600">자료를 읽는 중입니다…</p>
      )}
    </div>
  );
}
