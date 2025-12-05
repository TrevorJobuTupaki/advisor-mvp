import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "投顧 MVP",
  description: "美股投資規劃與追蹤 MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-black text-white flex">
        {/* 左側側邊欄 */}
        <aside className="w-56 border-r border-neutral-800 p-4 flex flex-col">
          <h1 className="text-xl font-bold mb-6">投顧 MVP</h1>

          <nav className="flex flex-col gap-2">
            <a
              href="/pick"
              className="px-3 py-2 rounded hover:bg-neutral-800"
            >
              投資規劃
            </a>

            <a
              href="/track"
              className="px-3 py-2 rounded hover:bg-neutral-800"
            >
              追蹤
            </a>
          </nav>
        </aside>

        {/* 主內容區 */}
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
