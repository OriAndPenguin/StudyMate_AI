"use client";

/**
 * 업로드 원본 파일(바이너리)을 브라우저 IndexedDB 에 저장한다.
 *
 * - localStorage 는 바이너리/대용량에 부적합하므로 원본 파일은 IndexedDB 에 보관.
 * - 추출 텍스트/메타데이터는 기존대로 localStorage(storage.ts)에 저장.
 * - 새로고침 후에도 원본 PDF 미리보기가 유지된다.
 * - 추후 Supabase Storage 로 옮길 때는 이 파일의 함수만 교체하면 된다.
 */

const DB_NAME = "studymate.files";
const STORE = "blobs";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB 를 사용할 수 없는 환경입니다."));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** 원본 파일 저장 (key = fileId). 실패해도 throw 하지 않고 false 반환. */
export async function saveBlob(fileId: string, blob: Blob): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, fileId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/** 원본 파일 조회. 없으면 undefined. */
export async function getBlob(fileId: string): Promise<Blob | undefined> {
  try {
    const db = await openDb();
    const result = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(fileId);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return undefined;
  }
}

/** 원본 파일 삭제 (best-effort). */
export async function deleteBlob(fileId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(fileId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    /* ignore */
  }
}
