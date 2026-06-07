"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as storage from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import {
  cloudDeleteFile,
  cloudDeleteSubject,
  cloudPullSubjects,
  cloudUpsertSubject,
} from "@/lib/cloud";
import type {
  StudyArtifacts,
  StudyFile,
  Subject,
  SubjectInput,
  SubjectRecord,
} from "@/types/study";

interface SubjectsContextValue {
  subjects: SubjectRecord[];
  /** localStorage 로딩이 끝났는지 (SSR/hydration 깜빡임 방지) */
  ready: boolean;
  /** 클라우드(로그인) 동기화 중인지 */
  syncing: boolean;
  getById: (id: string) => SubjectRecord | undefined;
  create: (input: SubjectInput) => SubjectRecord;
  remove: (id: string) => void;
  updateInfo: (
    id: string,
    patch: Partial<Pick<Subject, "title" | "examDate" | "description" | "sourceText" | "studyNote">>
  ) => void;
  saveArtifacts: (
    id: string,
    scopeKey: string,
    patch: Partial<StudyArtifacts>
  ) => SubjectRecord | undefined;
  addFile: (subjectId: string, file: StudyFile) => void;
  updateFile: (subjectId: string, fileId: string, patch: Partial<StudyFile>) => void;
  removeFile: (subjectId: string, fileId: string) => void;
}

const SubjectsContext = createContext<SubjectsContextValue | null>(null);

export function SubjectsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 로그인 사용자 id 를 ref 로 들고 있다가, 변경(쓰기) 때 클라우드 반영 여부 판단
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  useEffect(() => {
    setSubjects(storage.listSubjects());
    setReady(true);
  }, []);

  const refresh = useCallback(() => {
    setSubjects(storage.listSubjects());
  }, []);

  /** 변경된 레코드를 클라우드에 업서트 (로그인 상태에서만) */
  const syncUp = useCallback((rec?: SubjectRecord) => {
    if (userIdRef.current && rec) void cloudUpsertSubject(rec);
  }, []);

  // 로그인 시: 클라우드 ↔ 로컬 병합(최신 우선) 후, 로컬에만 있던/더 새 레코드는 업로드
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setSyncing(true);
    (async () => {
      const cloud = await cloudPullSubjects();
      if (cancelled) return;
      const local = storage.listSubjects();

      const map = new Map<string, SubjectRecord>();
      for (const r of local) map.set(r.id, r);
      for (const r of cloud) {
        const existing = map.get(r.id);
        if (!existing || r.updatedAt > existing.updatedAt) map.set(r.id, r);
      }
      const merged = Array.from(map.values());
      storage.replaceAll(merged);
      if (!cancelled) setSubjects(storage.listSubjects());

      // 클라우드에 없거나 로컬이 더 최신이면 업로드
      for (const r of merged) {
        const remote = cloud.find((x) => x.id === r.id);
        if (!remote || r.updatedAt > remote.updatedAt) void cloudUpsertSubject(r);
      }
    })()
      .catch((e) => console.warn("[sync] pull/merge failed:", e))
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // 렌더 중에는 state(subjects)만 참조한다. (localStorage 직접 읽으면 hydration mismatch)
  const getById = useCallback(
    (id: string) => subjects.find((s) => s.id === id),
    [subjects]
  );

  const create = useCallback(
    (input: SubjectInput) => {
      const record = storage.createSubject(input);
      refresh();
      syncUp(record);
      return record;
    },
    [refresh, syncUp]
  );

  const remove = useCallback(
    (id: string) => {
      const record = storage.getSubject(id);
      storage.deleteSubject(id);
      refresh();
      if (userIdRef.current) {
        void cloudDeleteSubject(id);
        record?.files.forEach((f) => void cloudDeleteFile(f.id));
      }
    },
    [refresh]
  );

  const updateInfo = useCallback<SubjectsContextValue["updateInfo"]>(
    (id, patch) => {
      const updated = storage.updateSubject(id, patch);
      refresh();
      syncUp(updated);
    },
    [refresh, syncUp]
  );

  const saveArtifacts = useCallback<SubjectsContextValue["saveArtifacts"]>(
    (id, scopeKey, patch) => {
      const updated = storage.saveArtifacts(id, scopeKey, patch);
      refresh();
      syncUp(updated);
      return updated;
    },
    [refresh, syncUp]
  );

  const addFile = useCallback<SubjectsContextValue["addFile"]>(
    (subjectId, file) => {
      const updated = storage.addFile(subjectId, file);
      refresh();
      syncUp(updated);
    },
    [refresh, syncUp]
  );

  const updateFile = useCallback<SubjectsContextValue["updateFile"]>(
    (subjectId, fileId, patch) => {
      const updated = storage.updateFile(subjectId, fileId, patch);
      refresh();
      syncUp(updated);
    },
    [refresh, syncUp]
  );

  const removeFile = useCallback<SubjectsContextValue["removeFile"]>(
    (subjectId, fileId) => {
      const updated = storage.deleteFile(subjectId, fileId);
      refresh();
      if (userIdRef.current) {
        void cloudDeleteFile(fileId);
        syncUp(updated);
      }
    },
    [refresh, syncUp]
  );

  const value = useMemo<SubjectsContextValue>(
    () => ({
      subjects,
      ready,
      syncing,
      getById,
      create,
      remove,
      updateInfo,
      saveArtifacts,
      addFile,
      updateFile,
      removeFile,
    }),
    [
      subjects,
      ready,
      syncing,
      getById,
      create,
      remove,
      updateInfo,
      saveArtifacts,
      addFile,
      updateFile,
      removeFile,
    ]
  );

  return <SubjectsContext.Provider value={value}>{children}</SubjectsContext.Provider>;
}

export function useSubjects(): SubjectsContextValue {
  const ctx = useContext(SubjectsContext);
  if (!ctx) {
    throw new Error("useSubjects 는 <SubjectsProvider> 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
