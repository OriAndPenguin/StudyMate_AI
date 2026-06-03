/** 시험일까지 남은 일수를 D-day 문자열로 변환 */
export function daysUntil(examDate?: string): string | null {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate + "T00:00:00");
  const diff = Math.round((exam.getTime() - today.getTime()) / 86400000);
  if (Number.isNaN(diff)) return null;
  if (diff === 0) return "D-DAY";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

/** ISO 문자열을 "YYYY.MM.DD" 로 */
export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
