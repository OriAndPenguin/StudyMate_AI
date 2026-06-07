"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SubjectInput } from "@/types/study";

export default function NewSubjectModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: SubjectInput) => void;
}) {
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [description, setDescription] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // 열려 있는 동안 배경 스크롤 잠금 (모달 뒤 화면이 위로 밀리는 문제 방지)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      examDate: examDate || undefined,
      description: description.trim() || undefined,
    });
    setTitle("");
    setExamDate("");
    setDescription("");
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="my-8 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-xl font-bold text-slate-900">새 과목 만들기</h2>
        <p className="mt-1 text-sm text-slate-500">
          과목 정보를 입력하세요. 공부 자료는 다음 화면에서 넣습니다.
        </p>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          과목명 *
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 운영체제, 한국사 능력검정"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          시험일
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          간단 설명
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="예: 중간고사 범위 1~5장"
            className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
          >
            만들기
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
