"use client";

type Accent = "brand" | "amber" | "slate";

const ACCENTS: Record<
  Accent,
  { bar: string; head: string; title: string; badge: string }
> = {
  brand: {
    bar: "border-l-brand-400",
    head: "bg-brand-50",
    title: "text-slate-800",
    badge: "bg-brand-100 text-brand-700",
  },
  amber: {
    bar: "border-l-amber-400",
    head: "bg-amber-50",
    title: "text-amber-900",
    badge: "bg-amber-100 text-amber-700",
  },
  slate: {
    bar: "border-l-slate-300",
    head: "bg-slate-50",
    title: "text-slate-800",
    badge: "bg-slate-100 text-slate-600",
  },
};

/** 틴트 헤더 + 왼쪽 강조선 카드 (결과 화면 공통) */
export default function SectionCard({
  icon,
  title,
  badge,
  accent = "brand",
  children,
}: {
  icon: string;
  title: string;
  badge?: string;
  accent?: Accent;
  children: React.ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-l-4 border-slate-200 bg-white shadow-card ${a.bar}`}
    >
      <header className={`flex items-center gap-2 px-4 py-2.5 ${a.head}`}>
        <span className="text-base">{icon}</span>
        <h3 className={`text-sm font-bold ${a.title}`}>{title}</h3>
        {badge && (
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.badge}`}>
            {badge}
          </span>
        )}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
