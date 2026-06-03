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
    <div className="space-y-6">
      {GROUPS.map(({ key, label }) => {
        const list = data[key];
        if (!list || list.length === 0) return null;
        return (
          <div key={key}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="rounded-md bg-brand-600 px-2 py-0.5 text-xs text-white">
                {label}
              </span>
              <span className="text-slate-400">{list.length}문항</span>
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
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
      <p className="text-sm font-medium text-slate-800">
        <span className="mr-1.5 text-brand-600">Q{index}.</span>
        {q.prompt}
      </p>

      {q.choices && q.choices.length > 0 && (
        <ol className="mt-2 space-y-1 text-sm text-slate-600">
          {q.choices.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-slate-400">{["①", "②", "③", "④", "⑤"][i] ?? i + 1}</span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={() => setShow((v) => !v)}
        className="mt-3 text-xs font-semibold text-brand-600 hover:underline"
      >
        {show ? "정답 숨기기" : "정답·해설 보기"}
      </button>

      {show && (
        <div className="mt-2 rounded-lg bg-brand-50 p-3 text-sm">
          <p className="font-semibold text-brand-700">정답: {q.answer}</p>
          {q.explanation && (
            <p className="mt-1 text-slate-700">{q.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
