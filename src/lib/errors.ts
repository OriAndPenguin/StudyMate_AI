/**
 * 공통 에러 처리 헬퍼.
 * - 서버(API 라우트)와 클라이언트 양쪽에서 사용 가능.
 */

/** 사용자에게 보여줄 수 있는 의도된 에러 (메시지 그대로 노출 OK) */
export class AppError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

/** unknown 에러에서 사람이 읽을 메시지를 안전하게 추출 */
export function toErrorMessage(err: unknown, fallback = "알 수 없는 오류가 발생했습니다."): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

/** fetch 응답에서 에러 메시지를 안전하게 파싱 */
export async function parseFetchError(res: Response, fallback = "요청에 실패했습니다."): Promise<string> {
  try {
    const json = (await res.json()) as { error?: string };
    return json.error || fallback;
  } catch {
    return fallback;
  }
}
