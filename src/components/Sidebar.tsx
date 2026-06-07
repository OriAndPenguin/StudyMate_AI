"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useSubjects } from "@/context/SubjectsContext";
import NewSubjectModal from "@/components/NewSubjectModal";
import AccountButton from "@/components/AccountButton";
import { daysUntil } from "@/lib/format";
import { deleteBlob } from "@/lib/fileBlobs";
import type { SubjectInput } from "@/types/study";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const { subjects, ready, getById, create, remove } = useSubjects();
  const [modalOpen, setModalOpen] = useState(false);

  const activeId = params?.id;
  const isDashboard = pathname === "/";

  function handleCreate(input: SubjectInput) {
    const record = create(input);
    setModalOpen(false);
    onNavigate?.();
    router.push(`/subjects/${record.id}`);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 과목을 삭제할까요? 생성된 결과도 함께 사라집니다.")) return;
    // 저장된 원본 파일(IndexedDB)도 함께 정리
    getById(id)?.files.forEach((f) => void deleteBlob(f.id));
    remove(id);
    if (activeId === id) router.push("/");
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* 서비스명 */}
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-5 py-5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white">
            📚
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            StudyMate <span className="text-brand-600">AI</span>
          </span>
        </Link>

        {/* 새 과목 만들기 */}
        <div className="px-4">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            + 새 과목 만들기
          </button>
        </div>

        {/* 대시보드 링크 */}
        <nav className="mt-4 px-4">
          <Link
            href="/"
            onClick={onNavigate}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isDashboard
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            🏠 대시보드
          </Link>
        </nav>

        {/* 과목 목록 */}
        <div className="mt-4 flex-1 overflow-y-auto px-4 pb-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            내 과목 {ready && subjects.length > 0 ? `(${subjects.length})` : ""}
          </p>

          {ready && subjects.length === 0 ? (
            <p className="px-3 text-xs leading-relaxed text-slate-400">
              아직 과목이 없어요.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {subjects.map((s) => {
                const dday = daysUntil(s.examDate);
                const active = activeId === s.id;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/subjects/${s.id}`}
                      onClick={onNavigate}
                      className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-brand-50 font-semibold text-brand-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{s.title}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        {dday && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {dday}
                          </span>
                        )}
                        <button
                          aria-label="과목 삭제"
                          onClick={(e) => handleDelete(e, s.id)}
                          className="hidden text-slate-300 hover:text-red-500 group-hover:inline"
                        >
                          ✕
                        </button>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 계정 (구글 로그인 / 로그아웃) — Supabase 설정 시에만 표시 */}
        <AccountButton />
      </div>

      <NewSubjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
