import type { GenerationKind, StudyArtifacts } from "@/types/study";

export interface GeneratorMeta {
  kind: GenerationKind;
  action: string;
  tab: string;
  icon: string;
}

export const GENERATORS: GeneratorMeta[] = [
  { kind: "summary", action: "요약 생성", tab: "요약", icon: "S" },
  { kind: "terms", action: "용어 정리", tab: "용어", icon: "T" },
  { kind: "questions", action: "퀴즈 생성", tab: "퀴즈", icon: "Q" },
  { kind: "flashcards", action: "플래시카드 생성", tab: "카드", icon: "F" },
];

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
