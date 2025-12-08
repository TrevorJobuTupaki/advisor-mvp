// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "投顧 MVP",
  description: "美股投資規劃與追蹤 MVP",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          backgroundColor: "#0d0d0d",
          color: "white",
        }}
      >
        {/* 外層 wrapper */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            minHeight: "100vh",
            height: "100%",
            width: "100%",
            backgroundColor: "#0d0d0d",
            overflow: "hidden",
          }}
        >
          {/* 左側側欄 */}
          <aside
            style={{
              width: "14rem",
              backgroundColor: "#111",
              borderRight: "1px solid #333",
              padding: "1.5rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
              color: "white",
              flexShrink: 0,
            }}
          >
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700 }}>投顧 MVP</h1>

            <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href="/"
                className="px-3 py-2 rounded text-white no-underline hover:bg-neutral-800 hover:text-white"
              >
                首頁 / 使用說明
              </Link>

              <Link
                href="/pick"
                className="px-3 py-2 rounded text-white no-underline hover:bg-neutral-800 hover:text-white"
              >
                投資規劃
              </Link>

              <Link
                href="/track"
                className="px-3 py-2 rounded text-white no-underline hover:bg-neutral-800 hover:text-white"
              >
                追蹤
              </Link>
            </nav>
          </aside>

          {/* 右側主內容 */}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "2.5rem",
              backgroundColor: "#0d0d0d",
              color: "white",
            }}
          >
            {/* 🟦 全站行情延遲提醒（符合 TV Style） */}
            <div
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
                color: "#bbb",
              }}
            >
              ⚠️ 本站使用 Finnhub Free API 提供股價資訊，行情皆為
              <span style={{ color: "#facc15", fontWeight: 600 }}>延遲 15 分鐘</span>，
              僅供參考，請勿做為即時交易依據。
            </div>

            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
