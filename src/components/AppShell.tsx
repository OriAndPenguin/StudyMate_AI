"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const COLLAPSE_KEY = "studymate.sidebarCollapsed";

/**
 * 데스크톱 중심 레이아웃 셸.
 * - lg 이상: 좌측 고정 사이드바 + 우측 메인. 사이드바는 접기/펼치기 가능.
 * - lg 미만: 상단바 + 햄버거로 여는 드로어 사이드바 (반응형 유지).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // 접힘 상태를 새로고침 후에도 유지
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* 데스크톱 고정 사이드바 */}
      <aside
        className={`hidden shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 lg:block ${
          collapsed ? "lg:w-14" : "lg:w-72"
        }`}
      >
        <div className="sticky top-0 flex h-screen flex-col">
          {collapsed ? (
            // 접힘: 슬림 레일 (로고 + 펼치기 버튼)
            <div className="flex flex-col items-center gap-3 py-4">
              <Link
                href="/"
                aria-label="홈"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white"
              >
                📚
              </Link>
              <button
                onClick={toggleCollapsed}
                aria-label="사이드바 펼치기"
                title="사이드바 펼치기"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-600"
              >
                »
              </button>
            </div>
          ) : (
            // 펼침: 전체 사이드바 + 접기 버튼
            <>
              <button
                onClick={toggleCollapsed}
                aria-label="사이드바 접기"
                title="사이드바 접기"
                className="absolute right-2 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600"
              >
                «
              </button>
              <Sidebar />
            </>
          )}
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
