"use client";

import { useRef, useState } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FILE_ACCEPT } from "@/lib/files";

/** 드래그 앤 드롭 + 클릭 업로드 영역 */
export default function Uploader({ subjectId }: { subjectId: string }) {
  const { uploadFiles, uploadError, busy } = useFileUpload(subjectId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragOver ? "border-brand-400 bg-brand-50" : "border-slate-300 bg-slate-50 hover:border-brand-300"
        }`}
      >
        <p className="text-3xl">📤</p>
        <p className="mt-2 text-base font-semibold text-slate-700">
          파일을 끌어다 놓거나 클릭하여 업로드
        </p>
        <p className="mt-1 text-sm text-slate-400">PDF · PPTX · PPT (최대 20MB, 여러 개 가능)</p>
        {busy && <p className="mt-2 text-sm text-amber-600">자료를 읽는 중입니다…</p>}
        <input
          ref={inputRef}
          type="file"
          accept={FILE_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />
      </div>

      {uploadError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{uploadError}</p>
      )}
    </div>
  );
}
