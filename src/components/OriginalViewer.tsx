"use client";

import { useEffect, useRef, useState } from "react";
import { getBlob } from "@/lib/fileBlobs";
import type { StudyFile, SubjectRecord } from "@/types/study";

/**
 * 학습 화면 왼쪽 — "공부자료 원본"을 보여준다.
 *
 * - PDF: IndexedDB 의 원본을 pdf.js 로 직접 캔버스 렌더링한다.
 *   (iframe/embed 는 브라우저 MIME/다운로드 설정에 따라 다운로드되어 버려 신뢰할 수 없음)
 * - PPTX/PPT 또는 원본이 없는 경우: 추출 텍스트를 슬라이드/단락 단위로 정리해 표시.
 */
export default function OriginalViewer({
  subject,
  selectedFileId,
  registerGoToPage,
}: {
  subject: SubjectRecord;
  selectedFileId: string | null;
  /** 단일 PDF 일 때 페이지 이동 함수를 부모에 등록 (요약의 p.N 클릭 연동) */
  registerGoToPage?: (goToPage: ((page: number) => void) | null) => void;
}) {
  const extracted = subject.files.filter(
    (f) => f.status === "extracted" && (f.extractedText?.trim().length ?? 0) > 0
  );

  let filesToShow: StudyFile[] = [];
  if (selectedFileId) {
    const f = subject.files.find((x) => x.id === selectedFileId);
    filesToShow = f ? [f] : extracted;
  } else {
    filesToShow = extracted;
  }

  const manual = subject.sourceText?.trim() ?? "";
  const singlePdf = filesToShow.length === 1 && filesToShow[0].type === "pdf";

  // 단일 PDF 가 아니면 페이지 이동 비활성화 (요약 p.N 클릭이 무동작)
  useEffect(() => {
    if (!singlePdf) registerGoToPage?.(null);
  }, [singlePdf, registerGoToPage]);

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-3 shrink-0 text-sm font-bold text-slate-800">📄 공부자료 원본</h2>

      {singlePdf ? (
        // PDF 한 개 → 전체 높이를 뷰어로
        <div className="min-h-0 flex-1">
          <PdfCanvas file={filesToShow[0]} fill registerGoToPage={registerGoToPage} />
        </div>
      ) : (
        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {filesToShow.length > 0 ? (
            filesToShow.map((f) => (
              <div key={f.id}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">
                  {f.name}
                </p>
                {f.type === "pdf" ? <PdfCanvas file={f} /> : <NonPdf file={f} />}
              </div>
            ))
          ) : manual.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-500">
                직접 입력한 텍스트
              </p>
              <Blocks text={manual} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              표시할 원본 자료가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** PPTX/PPT — 브라우저 원본 렌더가 어려워 추출 텍스트로 표시 */
function NonPdf({ file }: { file: StudyFile }) {
  return (
    <>
      <p className="mb-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-400">
        {file.type.toUpperCase()} 원본 미리보기는 지원되지 않아 추출 텍스트를 보여줍니다.
      </p>
      <Blocks text={file.extractedText ?? ""} />
    </>
  );
}

/** IndexedDB 원본 PDF 를 pdf.js 로 캔버스 렌더링 */
function PdfCanvas({
  file,
  fill,
  registerGoToPage,
}: {
  file: StudyFile;
  fill?: boolean;
  registerGoToPage?: (goToPage: ((page: number) => void) | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLCanvasElement[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [errMsg, setErrMsg] = useState<string>("");

  // 부모에 페이지 이동 함수 등록 (요약의 p.N 클릭 → 해당 페이지로 스크롤)
  useEffect(() => {
    registerGoToPage?.((page: number) => {
      const el = pagesRef.current[page - 1];
      const container = containerRef.current;
      if (el && container) {
        const delta = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
        container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });
      }
    });
    return () => registerGoToPage?.(null);
  }, [registerGoToPage]);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setState("loading");
      const blob = await getBlob(file.id);
      if (cancelled) return;
      if (!blob) {
        setState("missing");
        return;
      }

      try {
        const pdfjs = await import("pdfjs-dist");
        // 워커는 /public 에 복사해 둔 파일을 사용 (네트워크 불필요)
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const data = await blob.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjs.getDocument({ data }).promise;
        const container = containerRef.current;
        if (!container || cancelled) return;
        container.innerHTML = "";
        pagesRef.current = [];

        const baseWidth = container.clientWidth || 600;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          if (cancelled) return;
          const unscaled = page.getViewport({ scale: 1 });
          const scale = baseWidth / unscaled.width;
          const viewport = page.getViewport({ scale: scale * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "mb-2 w-full rounded-lg border border-slate-200 bg-white shadow-sm";
          container.appendChild(canvas);
          pagesRef.current.push(canvas);

          // pdfjs v6: canvas 를 직접 전달 (canvasContext 와 함께 주면 안 됨)
          await page.render({ canvas, viewport }).promise;
          if (cancelled) return;
        }

        if (!cancelled) setState("ready");
      } catch (err) {
        if (!cancelled) {
          console.error("[PdfCanvas] render failed:", err);
          setErrMsg(err instanceof Error ? err.message : String(err));
          setState("error");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [file.id]);

  // 원본이 없거나 렌더 실패 → 추출 텍스트로 폴백
  if (state === "missing" || state === "error") {
    return (
      <>
        <p className="mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
          {state === "missing"
            ? "저장된 원본 PDF 가 없어 추출 텍스트를 보여줍니다. (다시 업로드하면 원본이 표시됩니다)"
            : `원본 PDF 를 표시할 수 없어 추출 텍스트를 보여줍니다.${errMsg ? ` (${errMsg})` : ""}`}
        </p>
        <Blocks text={file.extractedText ?? ""} />
      </>
    );
  }

  return (
    <div className={`relative ${fill ? "h-full" : ""}`}>
      {state === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-slate-50/80 text-sm text-slate-400">
          원본을 불러오는 중…
        </div>
      )}
      <div
        ref={containerRef}
        className={`overflow-y-auto rounded-lg bg-slate-100 p-2 ${
          fill ? "h-full" : "max-h-[640px]"
        }`}
      />
    </div>
  );
}

/** 추출 텍스트를 슬라이드/단락 단위 카드로 분리 */
function Blocks({ text }: { text: string }) {
  const slideMarker = /\[슬라이드 \d+\]/;
  let blocks: { label?: string; body: string }[];

  if (slideMarker.test(text)) {
    blocks = text
      .split(/(?=\[슬라이드 \d+\])/)
      .map((chunk) => {
        const m = chunk.match(/^\[(슬라이드 \d+)\]\s*([\s\S]*)$/);
        return m ? { label: m[1], body: m[2].trim() } : { body: chunk.trim() };
      })
      .filter((b) => b.body.length > 0);
  } else {
    const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    blocks = (paras.length > 0 ? paras : [text]).map((body) => ({ body }));
  }

  return (
    <div className="space-y-2">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          {b.label && <p className="mb-1 text-[11px] font-semibold text-slate-400">{b.label}</p>}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{b.body}</p>
        </div>
      ))}
    </div>
  );
}
