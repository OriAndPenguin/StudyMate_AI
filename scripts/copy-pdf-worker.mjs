// pdf.js 워커를 /public 으로 복사한다 (학습 화면 PDF 원본 렌더링용).
// pdfjs-dist 버전과 워커 파일이 항상 일치하도록 postinstall 에서 실행.
// 어떤 경우에도 npm install 을 깨지 않도록 항상 정상 종료한다.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

try {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const src = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
  const destDir = join(root, "public");
  const dest = join(destDir, "pdf.worker.min.mjs");

  if (existsSync(src)) {
    mkdirSync(destDir, { recursive: true });
    copyFileSync(src, dest);
    console.log("[copy-pdf-worker] copied pdf.worker.min.mjs → public/");
  } else {
    console.warn("[copy-pdf-worker] pdfjs-dist worker not found; skipped.");
  }
} catch (err) {
  console.warn("[copy-pdf-worker] skipped:", err?.message ?? err);
}
