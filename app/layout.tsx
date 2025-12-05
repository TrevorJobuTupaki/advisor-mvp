import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "投顧 MVP",
  description: "美股投資規劃與追蹤 MVP",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 flex">
        {/* 左側側邊欄 */}
        <aside className="w-56 border-r border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
          <h1 className="text-xl font-bold mb-6">投顧 MVP</h1>

          <nav className="flex flex-col gap-2 text-sm">
            <Link
              href="/"
              className="px-3 py-2 rounded hover:bg-neutral-800 hover:text-white transition-colors"
            >
              首頁 / 使用說明
            </Link>

            <Link
              href="/pick"
              className="px-3 py-2 rounded hover:bg-neutral-800 hover:text-white transition-colors"
            >
              投資規劃
            </Link>

            <Link
              href="/track"
              className="px-3 py-2 rounded hover:bg-neutral-800 hover:text-white transition-colors"
            >
              追蹤
            </Link>
          </nav>
        </aside>

        {/* 主內容區 */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
