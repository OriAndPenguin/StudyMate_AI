import JSZip from "jszip";
import type { ExtractResponse, StudyFileType } from "@/types/study";

/**
 * 서버 전용 텍스트 추출 로직.
 * - PDF: unpdf (서버리스/Node 호환, pdf.js 기반)
 * - PPTX: JSZip 으로 슬라이드 XML 을 풀어 <a:t> 텍스트 추출
 * - PPT: 구형 바이너리 → 신뢰성 있는 순수 JS 추출이 어려워 안내 메시지 반환
 *
 * 모든 함수는 throw 하지 않고 ExtractResponse 로 정규화하여 라우트가 죽지 않게 한다.
 */

const SCAN_NOTICE =
  "텍스트가 거의 추출되지 않았습니다. 스캔 이미지형 PDF일 수 있으며, 이 경우 자동 추출이 어렵습니다. (OCR은 추후 지원 예정)";

const PPT_NOTICE =
  "PPT 파일은 오래된 형식이라 텍스트 추출에 실패할 수 있습니다. PPTX로 변환 후 다시 업로드해 주세요.";

export async function extractText(
  type: StudyFileType,
  buffer: ArrayBuffer
): Promise<ExtractResponse> {
  switch (type) {
    case "pdf":
      return extractPdf(buffer);
    case "pptx":
      return extractPptx(buffer);
    case "ppt":
      return { status: "failed", extractedText: "", errorMessage: PPT_NOTICE };
  }
}

async function extractPdf(buffer: ArrayBuffer): Promise<ExtractResponse> {
  try {
    const { extractText: pdfExtract, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await pdfExtract(pdf, { mergePages: true });
    const cleaned = (text ?? "").trim();

    if (cleaned.length === 0) {
      return { status: "extracted", extractedText: "", notice: SCAN_NOTICE };
    }
    // 텍스트가 비정상적으로 짧으면 스캔 PDF 가능성 안내
    const notice = cleaned.length < 30 ? SCAN_NOTICE : undefined;
    return { status: "extracted", extractedText: cleaned, notice };
  } catch (err) {
    return {
      status: "failed",
      extractedText: "",
      errorMessage:
        err instanceof Error
          ? `PDF 추출 실패: ${err.message}`
          : "PDF 추출에 실패했습니다.",
    };
  }
}

async function extractPptx(buffer: ArrayBuffer): Promise<ExtractResponse> {
  try {
    const zip = await JSZip.loadAsync(buffer);

    // ppt/slides/slide1.xml, slide2.xml ... 을 슬라이드 번호 순으로 정렬
    const slideNames = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => slideNumber(a) - slideNumber(b));

    if (slideNames.length === 0) {
      return {
        status: "failed",
        extractedText: "",
        errorMessage: "PPTX 슬라이드를 찾지 못했습니다. 파일이 손상되었을 수 있습니다.",
      };
    }

    const parts: string[] = [];
    for (const name of slideNames) {
      const xml = await zip.file(name)!.async("string");
      const texts = matchAll(xml, /<a:t>([\s\S]*?)<\/a:t>/g).map(decodeXml);
      const slideText = texts.join(" ").replace(/\s+/g, " ").trim();
      if (slideText) {
        parts.push(`[슬라이드 ${slideNumber(name)}] ${slideText}`);
      }
    }

    const text = parts.join("\n").trim();
    if (text.length === 0) {
      return {
        status: "extracted",
        extractedText: "",
        notice: "슬라이드에서 추출할 텍스트가 없습니다. (이미지 위주 슬라이드일 수 있습니다)",
      };
    }
    return { status: "extracted", extractedText: text };
  } catch (err) {
    return {
      status: "failed",
      extractedText: "",
      errorMessage:
        err instanceof Error
          ? `PPTX 추출 실패: ${err.message}`
          : "PPTX 추출에 실패했습니다.",
    };
  }
}

/* ---------------- helpers ---------------- */

function slideNumber(name: string): number {
  const m = name.match(/slide(\d+)\.xml$/);
  return m ? parseInt(m[1], 10) : 0;
}

function matchAll(input: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) out.push(m[1]);
  return out;
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
