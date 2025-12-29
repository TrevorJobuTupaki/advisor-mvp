// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "投顧 MVP",
  description: "美股投資規劃與追蹤 MVP",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="app-body">
        <div className="app-shell">
          <aside className="sidebar">
            <h1 className="app-title">投顧 MVP</h1>

            <nav className="menu">
              <Link href="/" className="menu-link">
                首頁 / 使用說明
              </Link>
              <Link href="/pick" className="menu-link">
                投資規劃
              </Link>
              <Link href="/track" className="menu-link">
                追蹤
              </Link>
            </nav>
          </aside>

          <main className="main">
            <div className="latency-note">
              ⚠️ 本站使用 Finnhub Free API 提供股價資訊，行情皆為
              <span className="latency-highlight"> 延遲 15 分鐘 </span>
              ，僅供參考，請勿做為即時交易依據。
            </div>

            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
