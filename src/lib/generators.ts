import type { GenerationKind, StudyArtifacts } from "@/types/study";

/** 생성 종류별 메타데이터 (버튼 라벨 / 아이콘 / 탭 라벨 공용) */
export interface GeneratorMeta {
  kind: GenerationKind;
  /** 생성 버튼 라벨 */
  action: string;
  /** 결과 탭 라벨 */
  tab: string;
  icon: string;
}

export const GENERATORS: GeneratorMeta[] = [
  { kind: "summary", action: "요약노트 생성", tab: "요약노트", icon: "📝" },
  { kind: "terms", action: "핵심 용어 정리", tab: "용어정리", icon: "📖" },
  { kind: "questions", action: "예상문제 생성", tab: "문제풀이", icon: "❓" },
  { kind: "flashcards", action: "플래시카드 생성", tab: "복습카드", icon: "🃏" },
];

/** 해당 종류의 결과가 이미 생성되어 있는지 */
export function hasArtifact(artifacts: StudyArtifacts, kind: GenerationKind): boolean {
  switch (kind) {
    case "summary":
      return !!artifacts.summary;
    case "terms":
      return !!artifacts.terms && artifacts.terms.length > 0;
    case "questions":
      return !!artifacts.questions;
    case "flashcards":
      return !!artifacts.flashcards && artifacts.flashcards.length > 0;
  }
}
