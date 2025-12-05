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
      {/* body 只管背景 & 文字顏色，不處理 flex 排版 */}
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        {/* 這個 wrapper 用「行內 style」強制左右排版（這是你原本那個穩定的方式） */}
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "row",
          }}
        >
          {/* 左側側邊欄 */}
          <aside
            style={{
              width: "14rem", // 約等於 w-56
              borderRight: "1px solid rgba(64,64,64,1)",
              backgroundColor: "rgba(23,23,23,0.6)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              投顧 MVP
            </h1>

            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              <Link
                href="/"
                className="px-3 py-2 rounded text-neutral-200 no-underline hover:bg-neutral-800 hover:text-white transition-colors"
              >
                首頁 / 使用說明
              </Link>

              <Link
                href="/pick"
                className="px-3 py-2 rounded text-neutral-200 no-underline hover:bg-neutral-800 hover:text-white transition-colors"
              >
                投資規劃
              </Link>

              <Link
                href="/track"
                className="px-3 py-2 rounded text-neutral-200 no-underline hover:bg-neutral-800 hover:text-white transition-colors"
              >
                追蹤
              </Link>
            </nav>
          </aside>

          {/* 右側主內容區 */}
          <main
            style={{
              flex: 1,
              padding: "2.5rem",
              overflowY: "auto",
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
