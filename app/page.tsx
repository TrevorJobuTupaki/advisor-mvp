export default function Home() {
  return (
    <main className="p-10 text-white max-w-3xl mx-auto leading-relaxed">
      <h1 className="text-4xl font-bold mb-6">投顧 MVP — 使用說明</h1>

      <p className="text-lg text-gray-300 mb-10">
        歡迎使用投顧 MVP。本工具整合 AI 與即時市場資料，協助你快速完成
        「投資規劃、新聞分析、與個股追蹤」。以下是功能說明與使用方式：
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">1️⃣ 投資規劃（/pick）</h2>
        <p className="text-gray-300 mb-2">
          透過 AI 輸入你的投資目標、風險偏好與財務狀況，系統會為你生成專屬投資方案。
        </p>
        <p className="text-gray-400">
          ➤ 功能包含：資產配置建議、風險分析、理財規劃摘要
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">2️⃣ 新聞分析（/api/news-analyze）</h2>
        <p className="text-gray-300 mb-2">
          系統會根據你提供的新聞內容，分析情緒、影響標的，並給出投資判斷方向。
        </p>
        <p className="text-gray-400">
          ➤ 功能包含：情緒分析、影響分數、建議動作（買入 / 持有 / 規避）
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">3️⃣ 持倉追蹤（/track）</h2>
        <p className="text-gray-300 mb-2">
          查看你的持股表現，追蹤即時股價，並獲得股價波動的 AI 解讀。
        </p>
        <p className="text-gray-400">
          ➤ 功能包含：即時報價、漲跌原因解讀、AI 總結
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">4️⃣ API 測試</h2>
        <p className="text-gray-300 mb-2">
          你也可以手動測試 API，例如直接查看股價：
        </p>
        <pre className="bg-gray-800 p-4 rounded-lg text-gray-200 text-sm">
/api/quote?symbol=AAPL
        </pre>
      </section>

      <p className="text-gray-400 mt-10">
        若遇到任何問題，請回報開發者以便協助改善。祝你使用順利！
      </p>
    </main>
  );
}
