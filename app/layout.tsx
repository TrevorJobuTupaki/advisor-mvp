// app/layout.tsx
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
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased flex">
        {/* 左側側邊欄（桌機版） */}
        <aside className="hidden md:flex w-60 flex-col border-r border-neutral-800 bg-gradient-to-b from-black via-neutral-950 to-black/90 p-5 shadow-[10px_0_35px_rgba(0,0,0,0.75)]">
          <div className="mb-8">
            <div className="text-[10px] font-semibold tracking-[0.25em] text-neutral-500 uppercase">
              Advisor
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight">投顧 MVP</h1>
          </div>

          <nav className="flex flex-col gap-1 text-sm">
            <Link
              href="/"
              className="px-3 py-2 rounded-md text-neutral-200 no-underline hover:bg-neutral-800 hover:text-white transition-colors"
            >
              首頁 / 使用說明
            </Link>

            <Link
              href="/pick"
              className="px-3 py-2 rounded-md text-neutral-200 no-underline hover:bg-neutral-800 hover:text-white transition-colors"
            >
              投資規劃
            </Link>

            <Link
              href="/track"
              className="px-3 py-2 rounded-md text-neutral-200 no-underline hover:bg-neutral-800 hover:text-white transition-colors"
            >
              追蹤
            </Link>
          </nav>

          <div className="mt-auto pt-6 text-[11px] text-neutral-500">
            <div>資料僅儲存在瀏覽器本機</div>
            <div className="text-neutral-600">Demo version</div>
          </div>
        </aside>

        {/* 手機 / 平板導覽列 */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-20 border-b border-neutral-800 bg-black/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.25em] text-neutral-500 uppercase">
                Advisor
              </div>
              <div className="text-sm font-semibold">投顧 MVP</div>
            </div>

            <nav className="flex items-center gap-3 text-xs">
              <Link href="/" className="text-neutral-200 no-underline hover:text-white">
                說明
              </Link>
              <Link href="/pick" className="text-neutral-200 no-underline hover:text-white">
                規劃
              </Link>
              <Link href="/track" className="text-neutral-200 no-underline hover:text-white">
                追蹤
              </Link>
            </nav>
          </div>
        </header>

        {/* 主內容區（會根據裝置自動調整 padding） */}
        <main className="flex-1 overflow-x-hidden">
          <div className="px-4 pb-8 pt-16 md:px-6 md:py-8 lg:px-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
