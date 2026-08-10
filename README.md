# SignalDesk

美股事件與輿情關注平台MVP。整合財經新聞、白宮、聯準會、Reddit與選填的X官方帳號資料，產生可追溯的美股關注排行。

## 核心功能

- 美股事件關注排行（不是買賣建議）
- 正向、風險與多空交錯訊號
- 原始消息連結與來源狀態
- 聯準會與白宮官方事件面板
- 本機瀏覽器關注清單
- 資料不足時自動切換為明確標示的示範模式

## 環境變數

```bash
FINNHUB_API_KEY=your_key
X_BEARER_TOKEN=optional_paid_x_api_token
```

`FINNHUB_API_KEY`用於即時新聞、股價及漲跌幅。`X_BEARER_TOKEN`為選填；未設定時，網站仍可使用其他來源，並會將X標示為受限狀態。

## 本機執行

```bash
npm install
npm run dev
```

開啟 <http://localhost:3000>。

## Vercel部署

將修改推送至原本連接Vercel的GitHub儲存庫後，Vercel會自動建立新部署。請在Vercel專案的Environment Variables重新確認`FINNHUB_API_KEY`；如果不再使用舊功能，可刪除`OPENAI_API_KEY`。

## 免責聲明

本站資訊只供研究與產品展示，不構成投資建議、邀約或報酬保證。
