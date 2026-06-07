"use client";

/**
 * AI 토큰 사용량 누적 (이 브라우저/기기 기준).
 * 생성 응답의 usage 를 더해서 localStorage 에 저장하고, 변경 시 이벤트로 알린다.
 * ⚠️ 실제 청구 기준은 제공사 콘솔이며, 여기 값은 참고용 추정치다.
 */

const KEY = "studymate.usage.v1";
const EVENT = "studymate:usage";

export interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  requests: number;
  /** 누적 추정 비용(USD) */
  costUsd: number;
}

const ZERO: UsageTotals = { inputTokens: 0, outputTokens: 0, requests: 0, costUsd: 0 };

export function getUsage(): UsageTotals {
  if (typeof window === "undefined") return { ...ZERO };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...ZERO };
    const p = JSON.parse(raw) as Partial<UsageTotals>;
    return {
      inputTokens: p.inputTokens ?? 0,
      outputTokens: p.outputTokens ?? 0,
      requests: p.requests ?? 0,
      costUsd: p.costUsd ?? 0,
    };
  } catch {
    return { ...ZERO };
  }
}

export function addUsage(u?: {
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}): void {
  if (typeof window === "undefined" || !u) return;
  const cur = getUsage();
  const next: UsageTotals = {
    inputTokens: cur.inputTokens + (u.inputTokens ?? 0),
    outputTokens: cur.outputTokens + (u.outputTokens ?? 0),
    requests: cur.requests + 1,
    costUsd: cur.costUsd + (u.costUsd ?? 0),
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** USD → 표시 문자열 ($0.0123) */
export function formatUsd(usd: number): string {
  if (usd <= 0) return "$0";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(usd < 1 ? 3 : 2)}`;
}

/** 대략 원화 (고정 환율 추정) */
const USD_TO_KRW = 1400;
export function formatKrw(usd: number): string {
  const krw = Math.round(usd * USD_TO_KRW);
  return `₩${krw.toLocaleString()}`;
}

export function resetUsage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** 사용량 변경 구독 (같은 탭 이벤트 + 다른 탭 storage) */
export function subscribeUsage(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** 토큰 수를 짧게 (1234 → 1.2k) */
export function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}
