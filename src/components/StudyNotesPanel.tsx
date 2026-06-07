"use client";

import { useEffect, useState } from "react";

export default function StudyNotesPanel({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleChange(next: string) {
    setDraft(next);
    onChange(next);
  }

  return (
    <div className="flex min-h-[520px] flex-col rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">My note</p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-900">내 메모</h2>
        <p className="mt-1 text-sm text-slate-500">
          원본 자료를 보면서 헷갈린 부분, 시험 포인트, 추가 질문을 적어두세요.
        </p>
      </div>
      <textarea
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="예: 3페이지의 개념 비교표 다시 보기, 서술형 예상 답안 문장 정리..."
        className="min-h-[420px] flex-1 resize-none rounded-b-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white"
      />
    </div>
  );
}
