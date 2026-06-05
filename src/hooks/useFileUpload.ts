"use client";

import { useState } from "react";
import { useSubjects } from "@/context/SubjectsContext";
import { detectFileType, extractFileText, makeStudyFile } from "@/lib/files";
import { saveBlob } from "@/lib/fileBlobs";

/**
 * 파일 업로드 + 텍스트 추출 오케스트레이션.
 * 1) 메타데이터 레코드 생성(uploaded) → 2) extracting → 3) /api/extract → 4) extracted/failed
 * 각 단계는 storage(localStorage)에 반영되어 새로고침 후에도 유지된다.
 */
export function useFileUpload(subjectId: string) {
  const { addFile, updateFile } = useSubjects();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    setBusy(true);

    for (const file of Array.from(fileList)) {
      const type = detectFileType(file.name);
      if (!type) {
        setUploadError(`"${file.name}" 은(는) 지원하지 않는 형식입니다. (PDF, PPTX, PPT)`);
        continue;
      }

      const record = makeStudyFile(subjectId, file, type);
      addFile(subjectId, record);
      // 원본 파일을 IndexedDB 에 저장 (PDF 원본 미리보기용). 실패해도 진행.
      await saveBlob(record.id, file);
      updateFile(subjectId, record.id, { status: "extracting" });

      const res = await extractFileText(file); // 실패해도 throw 안 함
      updateFile(subjectId, record.id, {
        status: res.status,
        extractedText: res.extractedText,
        // 실패 사유 또는 스캔 PDF 등 안내를 함께 보관
        errorMessage: res.errorMessage ?? res.notice,
      });
    }

    setBusy(false);
  }

  return { uploadFiles, uploadError, setUploadError, busy };
}
