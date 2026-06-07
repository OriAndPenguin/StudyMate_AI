import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SubjectsProvider } from "@/context/SubjectsContext";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "StudyMate AI",
  description:
    "강의자료를 넣으면 AI가 시험 대비 요약, 용어정리, 문제, 복습카드를 만들어줍니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-cream text-slate-800 antialiased">
        <AuthProvider>
          <SubjectsProvider>
            <AppShell>{children}</AppShell>
          </SubjectsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
