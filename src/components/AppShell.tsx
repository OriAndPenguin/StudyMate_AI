"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

/**
 * 데스크톱 중심 레이아웃 셸.
 * - lg 이상: 좌측 고정 사이드바 + 우측 메인.
 * - lg 미만: 상단바 + 햄버거로 여는 드로어 사이드바 (반응형 유지).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* 데스크톱 고정 사이드바 */}
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* 모바일 상단바 */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          aria-label="메뉴 열기"
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        >
          ☰
        </button>
        <span className="font-extrabold text-slate-900">
          StudyMate <span className="text-brand-600">AI</span>
        </span>
      </header>

      {/* 모바일 드로어 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
