"use client";

import { useState } from "react";
import type { Question, QuestionSet } from "@/types/study";

const GROUPS: { key: keyof QuestionSet; label: string }[] = [
  { key: "multipleChoice", label: "객관식" },
  { key: "ox", label: "OX" },
  { key: "shortAnswer", label: "단답형" },
  { key: "essay", label: "서술형" },
];

export default function QuestionsView({ data }: { data: QuestionSet }) {
  return (
    <div className="space-y-7">
      {GROUPS.map(({ key, label }) => {
        const list = data[key];
        if (!list || list.length === 0) return null;
        return (
          <div key={key}>
            <h3 className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                {label}
              </span>
              <span className="text-xs font-medium text-slate-400">{list.length}문항</span>
              <span className="ml-1 h-px flex-1 bg-slate-100" />
            </h3>
            <div className="space-y-3">
              {list.map((q, i) => (
                <QuestionCard key={q.id} q={q} index={i + 1} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [show, setShow] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-200">
      <p className="text-sm font-medium leading-relaxed text-slate-800">
        <span className="mr-1.5 font-bold text-brand-600">Q{index}.</span>
        {q.prompt}
      </p>

      {q.choices && q.choices.length > 0 && (
        <ol className="mt-3 space-y-1.5 text-sm text-slate-600">
          {q.choices.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand-400">{["①", "②", "③", "④", "⑤"][i] ?? i + 1}</span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={() => setShow((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
      >
        {show ? "정답 숨기기" : "정답 보기"}
      </button>

      {show && (
        <div className="mt-3 rounded-lg border-l-4 border-l-brand-400 bg-brand-50/70 p-3 text-sm">
          <p className="font-semibold text-brand-700">정답&nbsp; {q.answer}</p>
          {q.explanation && <p className="mt-1.5 leading-relaxed text-slate-700">{q.explanation}</p>}
        </div>
      )}
    </div>
  );
}
