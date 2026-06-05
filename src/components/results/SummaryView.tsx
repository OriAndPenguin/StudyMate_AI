"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SummaryNote } from "@/types/study";

export default function SummaryView({
  data,
  onPageClick,
}: {
  data: SummaryNote;
  /** 페이지 토큰(p.N) 클릭 시 호출 — 왼쪽 원본을 해당 페이지로 이동 */
  onPageClick?: (page: number) => void;
}) {
  // 1순위: Markdown 요약노트
  if (data.markdownContent) {
    return (
      <article className="md-note mx-auto max-w-3xl">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={buildComponents(onPageClick)}>
          {data.markdownContent}
        </ReactMarkdown>
      </article>
    );
  }

  // fallback: 구조 JSON 도 Markdown 도 없을 때 원문을 노트처럼 표시
  if (data.raw) {
    return (
      <article className="mx-auto max-w-3xl space-y-3">
        <h2 className="text-2xl font-extrabold text-slate-900">{data.title || "요약"}</h2>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Markdown 형식으로 정리하지 못해 원문 그대로 표시합니다.
        </p>
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{data.raw}</p>
      </article>
    );
  }

  return <p className="text-sm text-slate-400">정리된 내용이 없습니다.</p>;
}

/** 인라인 코드(`p.N`)를 페이지 이동 버튼으로 렌더링 */
function buildComponents(onPageClick?: (page: number) => void): Components {
  return {
    code({ children, className }) {
      const text = Array.isArray(children) ? children.join("") : String(children ?? "");
      const m = text.trim().match(/^p\.?\s*(\d+)/i);
      // 한 줄짜리 짧은 페이지 토큰만 클릭 버튼으로 변환 (코드블록 제외)
      if (onPageClick && m && text.length <= 16 && !text.includes("\n")) {
        const page = parseInt(m[1], 10);
        return (
          <button
            type="button"
            className="md-page-link"
            title={`원본 ${page}페이지로 이동`}
            onClick={() => onPageClick(page)}
          >
            {children}
          </button>
        );
      }
      return <code className={className}>{children}</code>;
    },
  };
}
