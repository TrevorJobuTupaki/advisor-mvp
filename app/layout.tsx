import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SignalDesk｜美股事件與輿情關注平台",
  description: "整合新聞、官方政策與社群熱度的美股事件情報儀表板。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07110f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <Link href="/" className="brand">
              <span className="brand-mark"><i /><i /><i /></span>
              <span><b>Signal</b>Desk</span>
            </Link>
            <nav>
              <Link href="/">市場雷達</Link>
              <Link href="/track">我的關注</Link>
              <Link href="/pick">分析方法</Link>
            </nav>
            <div className="market-state">
              <span /> US Market Intelligence
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
