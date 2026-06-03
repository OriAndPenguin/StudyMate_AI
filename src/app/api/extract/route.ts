import { NextResponse } from "next/server";
import { extractText } from "@/lib/extract";
import type { ExtractResponse, StudyFileType } from "@/types/study";

export const runtime = "nodejs";
// 큰 파일 파싱에 시간이 걸릴 수 있으므로 여유 있게
export const maxDuration = 60;

const EXT_TO_TYPE: Record<string, StudyFileType> = {
  pdf: "pdf",
  pptx: "pptx",
  ppt: "ppt",
};

/** 업로드 용량 상한 (메타데이터+추출텍스트만 저장하지만 파싱 부담 고려) */
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { status: "failed", extractedText: "", errorMessage: "업로드된 파일이 없습니다." } satisfies ExtractResponse,
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          status: "failed",
          extractedText: "",
          errorMessage: "파일이 너무 큽니다. (최대 20MB)",
        } satisfies ExtractResponse,
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const type = EXT_TO_TYPE[ext];
    if (!type) {
      return NextResponse.json(
        {
          status: "failed",
          extractedText: "",
          errorMessage: "지원하지 않는 파일 형식입니다. (PDF, PPTX, PPT 만 가능)",
        } satisfies ExtractResponse,
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const result = await extractText(type, buffer);
    return NextResponse.json(result satisfies ExtractResponse);
  } catch (err) {
    // 어떤 경우에도 서버가 죽지 않도록 방어
    console.error("[/api/extract] error:", err);
    return NextResponse.json(
      {
        status: "failed",
        extractedText: "",
        errorMessage: "파일 처리 중 오류가 발생했습니다.",
      } satisfies ExtractResponse,
      { status: 500 }
    );
  }
}
