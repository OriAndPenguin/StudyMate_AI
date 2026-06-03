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
}: {
  artifacts: StudyArtifacts;
  activeTab: GenerationKind;
  onTabChange: (kind: GenerationKind) => void;
}) {
  return (
    <div>
      {/* 가로 탭 */}
      <div className="flex gap-1 border-b border-slate-200">
        {GENERATORS.map(({ kind, tab }) => {
          const active = activeTab === kind;
          const generated = hasArtifact(artifacts, kind);
          return (
            <button
              key={kind}
              onClick={() => onTabChange(kind)}
              className={`relative -mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
              {generated && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-500 align-middle" />
              )}
            </button>
          );
        })}
      </div>

      {/* 탭 내용 — 학습 노트처럼 카드 영역 안에 */}
      <div className="mt-5">
        {activeTab === "summary" &&
          (artifacts.summary ? (
            <SummaryView data={artifacts.summary} />
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
      오른쪽의 <span className="font-semibold text-brand-600">{meta?.action}</span> 버튼을 눌러 만들어 보세요.
    </div>
  );
}
