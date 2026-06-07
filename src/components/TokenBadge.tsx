"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatKrw,
  formatTokens,
  formatUsd,
  getUsage,
  resetUsage,
  subscribeUsage,
  type UsageTotals,
} from "@/lib/usage";

/** 오른쪽 위 토큰 사용량 코인 — 클릭하면 상세 패널 */
export default function TokenBadge() {
  const [usage, setUsage] = useState<UsageTotals | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUsage(getUsage());
    return subscribeUsage(() => setUsage(getUsage()));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!usage) return null;
  const total = usage.inputTokens + usage.outputTokens;

  return (
    <div ref={ref} className="fixed right-3 top-3 z-40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="AI 토큰·비용 사용량"
        className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/90 px-3 py-1.5 text-sm font-bold text-brand-700 shadow-card backdrop-blur transition hover:bg-white"
      >
        <span>🪙</span>
        <span>{formatTokens(total)}</span>
        <span className="text-slate-300">·</span>
        <span>{formatUsd(usage.costUsd)}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            추정 비용
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {formatUsd(usage.costUsd)}
          </p>
          <p className="text-sm font-semibold text-slate-500">
            약 {formatKrw(usage.costUsd)}
          </p>

          <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
            <Row label="총 토큰" value={total} />
            <Row label="입력" value={usage.inputTokens} />
            <Row label="출력" value={usage.outputTokens} />
            <Row label="생성 횟수" value={usage.requests} suffix="회" />
          </dl>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            모델 단가 기준 추정치(환율 약 1,400원)예요. 정확한 청구·잔액은 제공사 콘솔에서 확인하세요.
          </p>

          <button
            type="button"
            onClick={() => {
              if (confirm("토큰 사용량 기록을 초기화할까요?")) resetUsage();
            }}
            className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            초기화
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-semibold text-slate-700">
        {value.toLocaleString()}
        {suffix ?? ""}
      </dd>
    </div>
  );
}
