// app/page.tsx
export default function Home() {
  return (
    <div className="text-white max-w-3xl mx-auto leading-relaxed">
      <h1 className="text-4xl font-bold mb-6">投顧 MVP — 使用說明</h1>

      <p className="text-lg text-neutral-300 mb-8">
        這是一個投資小工具，目前專注在兩件事：
        「投資規劃」與「持股追蹤」。下面是使用方式。
      </p>

      {/* 下面內容照你原本那份（我已經幫你保留） */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          1️⃣ 投資規劃（左側選單：投資規劃）
        </h2>
        <p className="text-neutral-300 mb-2">
          由 GPT 協助產生「美股投資規劃建議」，會根據你的：
        </p>
        <ul className="list-disc list-inside text-neutral-300 text-sm space-y-1 mb-2">
          <li>投資期間（短期 / 中期 / 長期）</li>
          <li>投報目標（例如：月 5%、年 10% 等）</li>
          <li>風險承受度（保守 / 穩健 / 積極）</li>
          <li>初始投入金額、是否每月定期加碼</li>
        </ul>
        <p className="text-neutral-400 text-sm">
          ➤ 填完表單後按下「產生投資規劃」，系統會用 GPT 產生一段文字說明，
          包含大致可行的資產配置方向，並且可能附上幾檔 ETF / 個股作為範例標的，
          你可以一鍵加入追蹤清單。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">
          2️⃣ 持股追蹤（左側選單：追蹤）
        </h2>
        <p className="text-neutral-300 mb-2">
          在這裡可以新增你實際「已買進」的股票，並查看總成本、損益與均價。
        </p>
        <ul className="list-disc list-inside text-neutral-300 text-sm space-y-1 mb-2">
          <li>可以從「投資規劃」頁面推薦標的直接加入追蹤</li>
          <li>也可以在追蹤頁面手動新增一檔股票與買入紀錄</li>
          <li>每檔股票可以記錄多筆買進（日期 / 價格 / 股數）</li>
          <li>系統會自動計算均價、總成本、目前損益與報酬率</li>
        </ul>
        <p className="text-neutral-400 text-sm">
          ➤ 建議用來記錄「實際有下單」的部位，方便之後回頭看報酬與加減碼紀錄。
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">目前版本的定位</h2>
        <p className="text-neutral-300 mb-2">
          這個版本主要是用來測試產品概念與使用流程，功能刻意保持精簡：
        </p>
        <ul className="list-disc list-inside text-neutral-300 text-sm space-y-1 mb-2">
          <li>沒有會員系統、沒有雲端帳號，資料只存放在你的瀏覽器（localStorage）。</li>
          <li>投資建議僅供參考，不構成任何投資勸誘或報酬保證。</li>
          <li>未來可能再加入：新聞事件分析、風險警示、更多自動化策略等功能。</li>
        </ul>
      </section>

      <p className="text-neutral-500 text-sm">
        建議從左側選單依序點選「投資規劃 → 追蹤」實際操作一次，
        看這樣的流程是否符合你的使用習慣。
      </p>
    </div>
  );
}
