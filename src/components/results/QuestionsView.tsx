"use client";

import { useEffect, useMemo, useState } from "react";
import { listQuizHistory, saveQuizAttempt } from "@/lib/storage";
import type { Question, QuestionSet, QuizHistoryItem } from "@/types/study";

const CHOICE_LABELS = ["A", "B", "C", "D"];

type Mode = "home" | "play";
type AnswerMap = Record<string, string>;

export default function QuestionsView({
  data,
  subjectId,
  subjectTitle,
}: {
  data: QuestionSet;
  subjectId: string;
  subjectTitle: string;
}) {
  const questions = useMemo(() => flattenQuestions(data), [data]);
  const [mode, setMode] = useState<Mode>("home");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);

  useEffect(() => {
    setHistory(listQuizHistory(subjectId));
  }, [subjectId, data]);

  if (questions.length === 0) {
    return <p className="text-sm text-slate-400">생성된 문제가 없습니다.</p>;
  }

  function startQuiz() {
    setAnswers({});
    setShowResult(false);
    setMode("play");
  }

  function finishQuiz() {
    const result = scoreQuestions(questions, answers);
    saveQuizAttempt(subjectId, {
      answeredCount: result.answeredCount,
      correctCount: result.correctCount,
      totalScored: result.totalScored,
    });
    setHistory(listQuizHistory(subjectId));
    setShowResult(true);
  }

  if (mode === "home") {
    return (
      <QuizHome
        title={subjectTitle}
        questions={questions}
        history={history}
        onStart={startQuiz}
      />
    );
  }

  const score = scoreQuestions(questions, answers);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <button
            type="button"
            onClick={() => setMode("home")}
            className="text-xs font-semibold text-slate-500 hover:text-brand-600"
          >
            퀴즈 홈으로
          </button>
          <h3 className="mt-1 text-lg font-extrabold text-slate-900">퀴즈 풀이</h3>
          <p className="text-sm text-slate-500">
            {score.answeredCount}/{questions.length}문항 입력 완료
          </p>
        </div>
        <button
          type="button"
          onClick={finishQuiz}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
        >
          결과 저장
        </button>
      </div>

      {showResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-bold">저장되었습니다.</p>
          <p className="mt-1">
            채점 가능 문항 {score.totalScored}개 중 {score.correctCount}개 정답입니다.
            서술형은 직접 답안을 비교해보세요.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index + 1}
            value={answers[question.id] ?? ""}
            showResult={showResult}
            onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
          />
        ))}
      </div>
    </div>
  );
}

function QuizHome({
  title,
  questions,
  history,
  onStart,
}: {
  title: string;
  questions: Question[];
  history: QuizHistoryItem[];
  onStart: () => void;
}) {
  const latest = history[0];
  const completed = history.filter((item) => item.completedAt);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Quiz home</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{title} 퀴즈</h2>
            <p className="mt-1 text-sm text-slate-500">
              생성된 문제 {questions.length}개를 풀고 기록을 남길 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            퀴즈 풀기
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="생성 문제" value={`${questions.length}개`} />
          <Metric label="풀이 기록" value={`${completed.length}회`} />
          <Metric
            label="최근 점수"
            value={
              latest?.completedAt && latest.totalScored
                ? `${latest.correctCount ?? 0}/${latest.totalScored}`
                : "아직 없음"
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">퀴즈 기록</h3>
          <span className="text-xs font-medium text-slate-400">{history.length}개</span>
        </div>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {item.completedAt ? "풀이 완료" : "생성됨"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(item.completedAt ?? item.generatedAt)} · {item.questionCount}문항
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                  {item.completedAt && item.totalScored
                    ? `${item.correctCount ?? 0}/${item.totalScored} 정답`
                    : "대기 중"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
            아직 퀴즈 기록이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  value,
  showResult,
  onChange,
}: {
  question: Question;
  index: number;
  value: string;
  showResult: boolean;
  onChange: (value: string) => void;
}) {
  const choices = getChoices(question);
  const isScored = isScoredQuestion(question);
  const isCorrect = isScored ? normalize(value) === normalize(question.answer) : undefined;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-extrabold text-brand-700">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-7 text-slate-900">{question.prompt}</p>

          {choices.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {choices.map((choice, choiceIndex) => {
                const selected = value === choice;
                const correctChoice = showResult && normalize(choice) === normalize(question.answer);
                const wrongChoice = showResult && selected && !correctChoice;
                return (
                  <button
                    key={`${choice}-${choiceIndex}`}
                    type="button"
                    onClick={() => onChange(choice)}
                    className={`flex min-h-12 items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${
                      correctChoice
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : wrongChoice
                        ? "border-red-300 bg-red-50 text-red-700"
                        : selected
                        ? "border-brand-300 bg-brand-50 text-brand-800"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-200 hover:bg-brand-50"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-brand-600 shadow-sm">
                      {CHOICE_LABELS[choiceIndex] ?? choiceIndex + 1}
                    </span>
                    <span className="leading-relaxed">{choice}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              rows={question.type === "essay" ? 5 : 3}
              placeholder="답안을 입력하세요."
              className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-7 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          )}

          {showResult && (
            <div className="mt-4 rounded-xl border-l-4 border-l-brand-400 bg-brand-50 p-3 text-sm">
              <p className="font-bold text-brand-700">
                {isScored ? (isCorrect ? "정답입니다" : "다시 확인해보세요") : "모범 답안"}
              </p>
              <p className="mt-1 text-slate-800">정답: {question.answer}</p>
              {question.explanation && (
                <p className="mt-2 leading-7 text-slate-600">{question.explanation}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function flattenQuestions(data: QuestionSet): Question[] {
  return [
    ...(data.multipleChoice ?? []),
    ...(data.ox ?? []),
    ...(data.shortAnswer ?? []),
    ...(data.essay ?? []),
  ];
}

function getChoices(question: Question): string[] {
  if (question.choices?.length) return question.choices.slice(0, 4);
  if (question.type === "ox") return ["O", "X"];
  return [];
}

function isScoredQuestion(question: Question): boolean {
  return question.type !== "essay";
}

function scoreQuestions(questions: Question[], answers: AnswerMap) {
  return questions.reduce(
    (acc, question) => {
      const answer = answers[question.id]?.trim() ?? "";
      if (answer) acc.answeredCount += 1;
      if (isScoredQuestion(question)) {
        acc.totalScored += 1;
        if (normalize(answer) === normalize(question.answer)) acc.correctCount += 1;
      }
      return acc;
    },
    { answeredCount: 0, correctCount: 0, totalScored: 0 }
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
