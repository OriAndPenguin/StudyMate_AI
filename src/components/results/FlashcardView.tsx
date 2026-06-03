"use client";

import { useState } from "react";
import type { Flashcard } from "@/types/study";

export default function FlashcardView({ data }: { data: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-400">생성된 카드가 없습니다.</p>;
  }

  const safeIndex = Math.min(index, data.length - 1);
  const card = data[safeIndex];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => (i + delta + data.length) % data.length);
  }

  function jump(i: number) {
    setFlipped(false);
    setIndex(i);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      {/* 카드 영역 */}
      <div className="flex flex-col items-center">
        <p className="mb-3 text-sm text-slate-400">
          {safeIndex + 1} / {data.length}
        </p>

        <button
          onClick={() => setFlipped((v) => !v)}
          className={`flip-card h-72 w-full max-w-lg ${flipped ? "is-flipped" : ""}`}
          aria-label="카드 뒤집기"
        >
          <div className="flip-card-inner">
            {/* 앞면 */}
            <div className="flip-face rounded-3xl border border-brand-200 bg-white p-8 text-center shadow-card">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-400">
                  앞면
                </p>
                <p className="text-xl font-semibold text-slate-900">{card.front}</p>
                <p className="mt-5 text-xs text-slate-400">클릭하여 뒤집기</p>
              </div>
            </div>
            {/* 뒷면 */}
            <div className="flip-face flip-back rounded-3xl border border-brand-300 bg-brand-600 p-8 text-center text-white shadow-card">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-200">
                  뒷면
                </p>
                <p className="text-lg leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>
        </button>

        <div className="mt-6 flex w-full max-w-lg gap-3">
          <button
            onClick={() => go(-1)}
            className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 hover:bg-slate-50"
          >
            ← 이전
          </button>
          <button
            onClick={() => go(1)}
            className="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
          >
            다음 →
          </button>
        </div>
      </div>

      {/* 카드 목록 (데스크톱) */}
      <aside className="hidden lg:block">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          카드 목록
        </p>
        <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
          {data.map((c, i) => (
            <li key={c.id}>
              <button
                onClick={() => jump(i)}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-xs transition ${
                  i === safeIndex
                    ? "bg-brand-100 font-semibold text-brand-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {i + 1}. {c.front}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
