"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as storage from "@/lib/storage";
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
  getById: (id: string) => SubjectRecord | undefined;
  create: (input: SubjectInput) => SubjectRecord;
  remove: (id: string) => void;
  updateInfo: (
    id: string,
    patch: Partial<Pick<Subject, "title" | "examDate" | "description" | "sourceText">>
  ) => void;
  saveArtifacts: (id: string, patch: Partial<StudyArtifacts>) => SubjectRecord | undefined;
  addFile: (subjectId: string, file: StudyFile) => void;
  updateFile: (subjectId: string, fileId: string, patch: Partial<StudyFile>) => void;
  removeFile: (subjectId: string, fileId: string) => void;
}

const SubjectsContext = createContext<SubjectsContextValue | null>(null);

export function SubjectsProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSubjects(storage.listSubjects());
    setReady(true);
  }, []);

  const refresh = useCallback(() => {
    setSubjects(storage.listSubjects());
  }, []);

  // 렌더 중에는 state(subjects)만 참조한다.
  // storage(localStorage) 를 렌더 중 읽으면 서버(빈 값)와 클라이언트(실제 값)의
  // 첫 렌더 결과가 달라져 hydration mismatch 가 발생하므로 폴백을 두지 않는다.
  const getById = useCallback(
    (id: string) => subjects.find((s) => s.id === id),
    [subjects]
  );

  const create = useCallback(
    (input: SubjectInput) => {
      const record = storage.createSubject(input);
      refresh();
      return record;
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      storage.deleteSubject(id);
      refresh();
    },
    [refresh]
  );

  const updateInfo = useCallback<SubjectsContextValue["updateInfo"]>(
    (id, patch) => {
      storage.updateSubject(id, patch);
      refresh();
    },
    [refresh]
  );

  const saveArtifacts = useCallback<SubjectsContextValue["saveArtifacts"]>(
    (id, patch) => {
      const updated = storage.saveArtifacts(id, patch);
      refresh();
      return updated;
    },
    [refresh]
  );

  const addFile = useCallback<SubjectsContextValue["addFile"]>(
    (subjectId, file) => {
      storage.addFile(subjectId, file);
      refresh();
    },
    [refresh]
  );

  const updateFile = useCallback<SubjectsContextValue["updateFile"]>(
    (subjectId, fileId, patch) => {
      storage.updateFile(subjectId, fileId, patch);
      refresh();
    },
    [refresh]
  );

  const removeFile = useCallback<SubjectsContextValue["removeFile"]>(
    (subjectId, fileId) => {
      storage.deleteFile(subjectId, fileId);
      refresh();
    },
    [refresh]
  );

  const value = useMemo<SubjectsContextValue>(
    () => ({
      subjects,
      ready,
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
