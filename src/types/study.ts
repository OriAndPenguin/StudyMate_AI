/**
 * StudyMate AI 핵심 타입 정의
 *
 * 설계 원칙:
 * - 1차 MVP는 localStorage 기반이지만, 추후 Supabase(Auth/DB/Storage)로
 *   그대로 옮길 수 있도록 DB 친화적인 형태로 설계한다.
 * - 모든 엔티티는 id / createdAt / updatedAt 를 가진다.
 * - 사용자/공유 개념은 아직 쓰지 않지만, ownerId / sharedWith 필드를
 *   미리 자리만 잡아 둔다. (1차에서는 undefined)
 */

export type ISODateString = string;

/** AI 생성 결과의 종류 */
export type GenerationKind = "summary" | "terms" | "questions" | "flashcards";

/** 생성 버튼의 진행 상태 (UI 표시용) */
export type GenerationStatus = "idle" | "loading" | "done" | "error";

/* ------------------------------------------------------------------ */
/* 과목 (Subject)                                                      */
/* ------------------------------------------------------------------ */

export interface Subject {
  id: string;
  title: string;
  /** 시험일 (YYYY-MM-DD) */
  examDate?: string;
  description?: string;

  /** 사용자가 입력한 공부 자료 원문 */
  sourceText?: string;

  /** 추후 Supabase Auth 연동용 (1차에서는 미사용) */
  ownerId?: string;
  /** 추후 친구 공유용 — 공유 대상 userId 목록 (1차에서는 미사용) */
  sharedWith?: string[];

  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SubjectInput {
  title: string;
  examDate?: string;
  description?: string;
}

/* ------------------------------------------------------------------ */
/* 1) 요약노트 (SummaryNote)                                           */
/* ------------------------------------------------------------------ */

/** 단원 단위 메타데이터 (목차/네비게이션용, 선택) */
export interface SummarySection {
  title: string;
  /** 페이지 범위 (예: "p.2~p.11") */
  pageRange?: string;
  summary?: string;
}

/**
 * 시험 대비 Markdown 요약노트.
 * - markdownContent 가 핵심: 화면에서 Markdown 으로 렌더링한다.
 * - sections 는 보조 메타데이터(선택).
 */
export interface SummaryNote {
  title?: string;
  /** 화면 렌더링용 Markdown 본문 (# 요약 으로 시작) */
  markdownContent?: string;
  sections?: SummarySection[];
  /** JSON 파싱 실패 시 원문 보존 (fallback 렌더링용) */
  raw?: string;
}

/* ------------------------------------------------------------------ */
/* 2) 핵심 용어 정리 (TermItem)                                        */
/* ------------------------------------------------------------------ */

export interface TermItem {
  term: string;
  definition: string;
  /** 쉬운 설명 (비유/풀어쓰기) */
  easyExplanation: string;
  example: string;
  /** 시험 포인트 */
  examPoint: string;
}

/* ------------------------------------------------------------------ */
/* 3) 예상문제 (Question)                                              */
/* ------------------------------------------------------------------ */

export type QuestionType = "multiple_choice" | "ox" | "short_answer" | "essay";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  /** 객관식 보기 (multiple_choice 일 때) */
  choices?: string[];
  /** 정답 — 객관식이면 보기 텍스트, OX면 "O"/"X", 그 외는 모범답안 */
  answer: string;
  /** 해설 */
  explanation: string;
}

export interface QuestionSet {
  multipleChoice: Question[];
  ox: Question[];
  shortAnswer: Question[];
  essay: Question[];
}

/* ------------------------------------------------------------------ */
/* 4) 플래시카드 (Flashcard)                                           */
/* ------------------------------------------------------------------ */

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

/* ------------------------------------------------------------------ */
/* 생성 결과 묶음 (Subject 에 종속)                                    */
/* ------------------------------------------------------------------ */

export interface StudyArtifacts {
  summary?: SummaryNote;
  terms?: TermItem[];
  questions?: QuestionSet;
  flashcards?: Flashcard[];
}

/** localStorage 등에 저장되는 과목 + 결과 통합 레코드 */
/* ------------------------------------------------------------------ */
/* 업로드 학습 파일 (StudyFile)                                        */
/* ------------------------------------------------------------------ */

/** 지원 파일 형식 */
export type StudyFileType = "pdf" | "pptx" | "ppt";

/** 텍스트 추출 진행 상태 */
export type ExtractionStatus = "uploaded" | "extracting" | "extracted" | "failed";

export interface StudyFile {
  id: string;
  subjectId: string;
  name: string;
  type: StudyFileType;
  /** 바이트 단위 크기 */
  size: number;
  uploadedAt: ISODateString;
  status: ExtractionStatus;
  /** 추출된 텍스트 (원본 바이너리는 저장하지 않음) */
  extractedText?: string;
  /** 추출 실패 시 사유 */
  errorMessage?: string;
}

/* ------------------------------------------------------------------ */
/* AI 생성 산출물 (AIOutput) — 추후 per-file 결과 저장/이전 대비       */
/* ------------------------------------------------------------------ */

export interface AIOutput {
  id: string;
  subjectId: string;
  /** 특정 파일 기준으로 생성된 경우 (과목 전체/텍스트 입력이면 undefined) */
  fileId?: string;
  type: GenerationKind;
  /** 종류별 결과 데이터 (SummaryNote | TermItem[] | QuestionSet | Flashcard[]) */
  content: SummaryNote | TermItem[] | QuestionSet | Flashcard[];
  /** JSON 파싱 실패 시 원문 fallback 보관 */
  rawText?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** localStorage 통합 레코드: 과목 + 파일 + 결과 */
export interface SubjectRecord extends Subject {
  artifacts: StudyArtifacts;
  /** 업로드된 학습 파일 (메타데이터 + 추출 텍스트만) */
  files: StudyFile[];
}

/* ------------------------------------------------------------------ */
/* API 요청/응답 타입                                                  */
/* ------------------------------------------------------------------ */

export interface GenerateRequest {
  /** 생성 종류 (mode 는 동일 의미의 별칭) */
  kind?: GenerationKind;
  mode?: GenerationKind;
  /** 공부 자료 원문 */
  sourceText: string;
  subjectTitle?: string;
  /** 어떤 파일/자료 기준인지 (로그/표시용, 선택) */
  fileName?: string;
}

/** 파일 텍스트 추출 API 응답 */
export interface ExtractResponse {
  status: ExtractionStatus;
  extractedText: string;
  errorMessage?: string;
  /** 스캔 PDF 가능성 등 사용자 안내 */
  notice?: string;
}

/** kind 에 따라 data 의 실제 타입이 달라진다 */
export type GenerateResponse =
  | { kind: "summary"; data: SummaryNote }
  | { kind: "terms"; data: TermItem[] }
  | { kind: "questions"; data: QuestionSet }
  | { kind: "flashcards"; data: Flashcard[] };

export interface GenerateErrorResponse {
  error: string;
}
