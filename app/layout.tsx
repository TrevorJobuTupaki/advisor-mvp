// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "投顧 MVP",
  description: "簡易版投資規劃與追蹤工具（測試用）",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen bg-black text-white">
          {/* 左側選單 */}
          <aside className="w-56 bg-neutral-950 border-r border-neutral-800 p-4">
            <h1 className="text-lg font-bold mb-4">投顧 MVP</h1>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="hover:text-emerald-400">
                使用說明
              </Link>
              <Link href="/pick" className="hover:text-emerald-400">
                投資規劃
              </Link>
              <Link href="/track" className="hover:text-emerald-400">
                追蹤
              </Link>
            </nav>
          </aside>

          {/* 右側主內容 */}
          <main className="flex-1 bg-black text-white p-6 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
