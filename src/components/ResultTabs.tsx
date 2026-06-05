"use client";

import SummaryView from "@/components/results/SummaryView";
import TermsView from "@/components/results/TermsView";
import QuestionsView from "@/components/results/QuestionsView";
import FlashcardView from "@/components/results/FlashcardView";
import { GENERATORS, hasArtifact } from "@/lib/generators";
import type { GenerationKind, StudyArtifacts } from "@/types/study";

export default function ResultTabs({
  artifacts,
  activeTab,
  onTabChange,
  onSummaryPageClick,
}: {
  artifacts: StudyArtifacts;
  activeTab: GenerationKind;
  onTabChange: (kind: GenerationKind) => void;
  /** 요약의 페이지 토큰 클릭 시 (왼쪽 원본 이동) */
  onSummaryPageClick?: (page: number) => void;
}) {
  return (
    <div>
      {/* 가로 pill 탭 */}
      <div className="flex flex-wrap gap-2">
        {GENERATORS.map(({ kind, tab, icon }) => {
          const active = activeTab === kind;
          const generated = hasArtifact(artifacts, kind);
          return (
            <button
              key={kind}
              onClick={() => onTabChange(kind)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="text-[15px] leading-none">{icon}</span>
              {tab}
              {!active && generated && (
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* 탭 내용 — 학습 노트처럼 카드 영역 안에 */}
      <div className="mt-5">
        {activeTab === "summary" &&
          (artifacts.summary ? (
            <SummaryView data={artifacts.summary} onPageClick={onSummaryPageClick} />
          ) : (
            <ResultEmpty kind="summary" />
          ))}

        {activeTab === "terms" &&
          (artifacts.terms ? (
            <TermsView data={artifacts.terms} />
          ) : (
            <ResultEmpty kind="terms" />
          ))}

        {activeTab === "questions" &&
          (artifacts.questions ? (
            <QuestionsView data={artifacts.questions} />
          ) : (
            <ResultEmpty kind="questions" />
          ))}

        {activeTab === "flashcards" &&
          (artifacts.flashcards ? (
            <FlashcardView data={artifacts.flashcards} />
          ) : (
            <ResultEmpty kind="flashcards" />
          ))}
      </div>
    </div>
  );
}

function ResultEmpty({ kind }: { kind: GenerationKind }) {
  const meta = GENERATORS.find((g) => g.kind === kind);
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center text-sm text-slate-400">
      아직 결과가 없어요. <br />
      위에서 <span className="font-semibold text-brand-600">{meta?.tab}</span> 을(를) 선택해 생성해 보세요.
    </div>
  );
}
