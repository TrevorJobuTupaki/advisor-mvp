/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Horizon = "short" | "medium" | "long";
type Risk = "conservative" | "balanced" | "aggressive";

interface PlanBody {
  horizon: Horizon;
  goal: string;
  risk: Risk;
  note?: string;
  initialAmount?: string;
  addEveryMonth?: boolean;
  monthlyAmount?: string;
  industryPreference?: string; // ⭐ 產業偏好
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY 未設定" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as PlanBody;

    const horizonMap: Record<Horizon, string> = {
      short: "短期（幾週內）",
      medium: "中期（1–6 個月）",
      long: "長期（半年–3 年）",
    };

    const riskMap: Record<Risk, string> = {
      conservative: "保守型",
      balanced: "穩健型",
      aggressive: "積極型",
    };

    const industryText = body.industryPreference?.trim()
      ? body.industryPreference.trim()
      : "無特別產業偏好，由你挑選最適合使用者投資目標的產業組合";

    const userDescription = `
投資期間：${horizonMap[body.horizon]}
投報目標：${body.goal}
風險屬性：${riskMap[body.risk]}
初始金額：${body.initialAmount ?? "未填寫"} 美元
是否每月加碼：${
      body.addEveryMonth
        ? `是，加碼 ${body.monthlyAmount ?? "未填寫"} 美元`
        : "否"
    }
產業偏好：${industryText}
補充說明：${body.note || "無"}
`.trim();

    /* ----------------------------------------------------
       ⭐ GPT-4.1 五大區塊版本 Prompt
       ---------------------------------------------------- */
    const prompt = `
你是一位專業的美股投資顧問。

⚠️ 回覆限制：
- 僅能使用「繁體中文」
- 必須輸出「純 JSON」，不得有 Markdown、註解或額外文字
- JSON 只能包含 "plan" 與 "tickers" 兩大欄位
- "plan" 必須包含：
    • market_view（市場觀點）
    • strategy（投資核心策略）
    • allocation（資金配置邏輯）
    • entry_exit（買賣策略與價格區間）
    • risk（風險與注意事項）
- 五大欄位內容總字數建議落在 1500～4000 字之間
- "tickers" 必須包含 3–6 檔美股，並給 40 字內理由
- 推薦個股須符合產業偏好（如有 "不要金融" 需排除）
- 若使用者未填寫產業偏好，你應自行挑選最合理產業

📌 JSON 輸出範例：
{
  "plan": {
    "market_view": "...",
    "strategy": "...",
    "allocation": "...",
    "entry_exit": "...",
    "risk": "..."
  },
  "tickers": [
    { "symbol": "AAPL", "reason": "..." }
  ]
}

使用者條件如下：
${userDescription}

請只輸出合法 JSON，不得包含其他文字。
`.trim();

    /* ----------------------------------------------------
       🔥 GPT-4.1 呼叫
       ---------------------------------------------------- */
    const completion = await client.responses.create({
      model: "gpt-4.1",   // ⭐⭐⭐ 你已確認使用 4.1
      input: prompt,
    });

    const raw =
      (completion as any)?.output?.[0]?.content?.[0]?.text ?? "";

    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: any;

    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON parse error:", cleaned);
      return NextResponse.json(
        { plan: cleaned, tickers: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      plan: parsed.plan || {},
      tickers: Array.isArray(parsed.tickers) ? parsed.tickers : [],
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "發生錯誤" },
      { status: 500 }
    );
  }
}
