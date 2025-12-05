// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="bg-slate-950 text-slate-100">
        <div className="min-h-screen flex">
          {/* 左側功能欄 */}
          <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-900/70">
            <div className="p-4 font-bold text-lg">投顧 MVP</div>
            <nav className="flex flex-col gap-2 px-4 pb-4 text-sm">
              <a href="/" className="py-2 px-3 rounded-md hover:bg-slate-800">
                首頁 / 使用說明
              </a>
              <a
                href="/plan"
                className="py-2 px-3 rounded-md hover:bg-slate-800"
              >
                投資規劃
              </a>
              <a
                href="/tracking"
                className="py-2 px-3 rounded-md hover:bg-slate-800"
              >
                追蹤
              </a>
            </nav>
          </aside>

          {/* 右側主內容 */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
