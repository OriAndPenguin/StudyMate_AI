"use client";

import { useState } from "react";
import SummaryView from "@/components/results/SummaryView";
import TermsView from "@/components/results/TermsView";
import QuestionsView from "@/components/results/QuestionsView";
import FlashcardView from "@/components/results/FlashcardView";
import type {
  GenerationKind,
  GenerationStatus,
  QuestionGenerationOptions,
  StudyArtifacts,
} from "@/types/study";

type StatusMap = Record<GenerationKind, GenerationStatus>;

const TAB_META: Record<
  GenerationKind,
  { icon: string; title: string; desc: string; action: string }
> = {
  summary: {
    icon: "📝",
    title: "요약 노트 만들기",
    desc: "강의 자료를 시험 대비 노트로 정리합니다.",
    action: "요약 생성",
  },
  terms: {
    icon: "📖",
    title: "핵심 용어 정리",
    desc: "중요 용어를 정의·예시와 함께 정리합니다.",
    action: "용어 생성",
  },
  questions: {
    icon: "❓",
    title: "퀴즈 만들기",
    desc: "4지선다 객관식과 (선택 시) 서술형 문제를 만듭니다.",
    action: "퀴즈 생성",
  },
  flashcards: {
    icon: "🃏",
    title: "복습 카드 만들기",
    desc: "앞·뒷면으로 빠르게 복습하는 카드를 만듭니다.",
    action: "카드 생성",
  },
};

export default function ResultTabs({
  artifacts,
  activeTab,
  statuses,
  busy,
  canGenerate,
  hint,
  error,
  onGenerate,
  onSummaryPageClick,
  subjectId,
  subjectTitle,
}: {
  artifacts: StudyArtifacts;
  activeTab: GenerationKind;
  statuses: StatusMap;
  busy: boolean;
  canGenerate: boolean;
  hint?: string;
  error?: string | null;
  onGenerate: (kind: GenerationKind, options?: QuestionGenerationOptions) => void;
  onSummaryPageClick?: (page: number) => void;
  subjectId: string;
  subjectTitle: string;
}) {
  const [quizSetupOpen, setQuizSetupOpen] = useState(false);
  const loading = (k: GenerationKind) => statuses[k] === "loading";
  const disabled = busy || !canGenerate;

  return (
    <div>
      {error && (
        <p className="mb-4 whitespace-pre-line rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          ⚠️ {error}
        </p>
      )}

      {/* 요약 */}
      {activeTab === "summary" &&
        (artifacts.summary ? (
          <div>
            <Regen label="요약 다시 생성" loading={loading("summary")} disabled={disabled} onClick={() => onGenerate("summary")} />
            <SummaryView data={artifacts.summary} onPageClick={onSummaryPageClick} />
          </div>
        ) : (
          <GenerateCard kind="summary" loading={loading("summary")} disabled={disabled} hint={!canGenerate ? hint : undefined} onClick={() => onGenerate("summary")} />
        ))}

      {/* 용어 */}
      {activeTab === "terms" &&
        (artifacts.terms ? (
          <div>
            <Regen label="용어 다시 생성" loading={loading("terms")} disabled={disabled} onClick={() => onGenerate("terms")} />
            <TermsView data={artifacts.terms} />
          </div>
        ) : (
          <GenerateCard kind="terms" loading={loading("terms")} disabled={disabled} hint={!canGenerate ? hint : undefined} onClick={() => onGenerate("terms")} />
        ))}

      {/* 퀴즈 — 설정이 퀴즈 영역 안에 있음 */}
      {activeTab === "questions" &&
        (!artifacts.questions || quizSetupOpen ? (
          <QuizSetup
            loading={loading("questions")}
            disabled={disabled}
            hint={!canGenerate ? hint : undefined}
            onCancel={artifacts.questions ? () => setQuizSetupOpen(false) : undefined}
            onGenerate={(opts) => {
              setQuizSetupOpen(false);
              onGenerate("questions", opts);
            }}
          />
        ) : (
          <div>
            <Regen label="새 문제 만들기" disabled={busy} onClick={() => setQuizSetupOpen(true)} />
            <QuestionsView data={artifacts.questions} subjectId={subjectId} subjectTitle={subjectTitle} />
          </div>
        ))}

      {/* 카드 */}
      {activeTab === "flashcards" &&
        (artifacts.flashcards ? (
          <div>
            <Regen label="카드 다시 생성" loading={loading("flashcards")} disabled={disabled} onClick={() => onGenerate("flashcards")} />
            <FlashcardView data={artifacts.flashcards} />
          </div>
        ) : (
          <GenerateCard kind="flashcards" loading={loading("flashcards")} disabled={disabled} hint={!canGenerate ? hint : undefined} onClick={() => onGenerate("flashcards")} />
        ))}
    </div>
  );
}

/* 우상단 "다시 생성" 링크 */
function Regen({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mb-3 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-brand-600 disabled:opacity-50"
      >
        {loading ? "생성 중…" : `↻ ${label}`}
      </button>
    </div>
  );
}

/* 비어 있을 때 그 자리에서 생성 (요약/용어/카드) */
function GenerateCard({
  kind,
  loading,
  disabled,
  hint,
  onClick,
}: {
  kind: GenerationKind;
  loading: boolean;
  disabled: boolean;
  hint?: string;
  onClick: () => void;
}) {
  const meta = TAB_META[kind];
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="text-4xl">{meta.icon}</div>
      <p className="mt-3 text-base font-bold text-slate-800">{meta.title}</p>
      <p className="mt-1 text-sm text-slate-500">{meta.desc}</p>
      {hint && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{hint}</p>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="mt-5 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "생성 중…" : meta.action}
      </button>
    </div>
  );
}

/* 퀴즈 생성 설정 (문항 수 + 서술형) — 퀴즈 영역 안에 위치 */
const QUESTION_COUNTS: QuestionGenerationOptions["totalCount"][] = [10, 20, 30, 40];

function QuizSetup({
  loading,
  disabled,
  hint,
  onCancel,
  onGenerate,
}: {
  loading: boolean;
  disabled: boolean;
  hint?: string;
  onCancel?: () => void;
  onGenerate: (options: QuestionGenerationOptions) => void;
}) {
  const [count, setCount] = useState<QuestionGenerationOptions["totalCount"]>(10);
  const [includeEssay, setIncludeEssay] = useState(false);
  const [essayCount, setEssayCount] = useState(1);

  return (
    <div className="py-2">
      <p className="text-base font-bold text-slate-900">❓ 퀴즈 만들기</p>
      <p className="mt-1 text-sm text-slate-500">객관식은 4개의 보기 중 정답을 고르는 카드로 출제됩니다.</p>

      {hint && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{hint}</p>
      )}

      {/* 문항 수 */}
      <p className="mt-5 text-sm font-semibold text-slate-700">문항 수</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {QUESTION_COUNTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCount(c)}
            className={`rounded-xl border py-2.5 text-sm font-bold transition ${
              count === c
                ? "border-brand-500 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 서술형 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={includeEssay}
            onChange={(e) => setIncludeEssay(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          서술형 포함 (최대 5)
        </label>
        {includeEssay && (
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="number"
              min={1}
              max={5}
              value={essayCount}
              onChange={(e) => setEssayCount(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <span>문항</span>
          </label>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            취소
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            onGenerate({
              totalCount: count,
              essayCount: includeEssay ? Math.min(5, essayCount) : 0,
            })
          }
          disabled={disabled}
          className="flex-1 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "생성 중…" : "퀴즈 생성"}
        </button>
      </div>
    </div>
  );
}
