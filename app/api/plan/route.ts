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

    const userDescription = `
投資期間：${horizonMap[body.horizon]}
投報目標：${body.goal}
風險屬性：${riskMap[body.risk]}
初始金額：${body.initialAmount ?? "未填寫"} 美元
是否每月加碼：${
      body.addEveryMonth ? `是，加碼 ${body.monthlyAmount ?? "未填寫"} 美元` : "否"
    }
補充說明：${body.note || "無"}
`.trim();

    const prompt = `
你是一位專業的美股投資顧問。

⚠️ 回覆限制：
- 請務必用「繁體中文」
- 必須以「純 JSON」輸出，不得包含 \`\`\`json 或任何 code block
- "plan" 字數須嚴格限制在 700 字以內
- "tickers" 必須提供 3–6 檔美股標的
- 只能有 "plan" 與 "tickers" 兩個欄位，不得出現其他欄位

請輸出以下 JSON 結構：

{
  "plan": "（不超過 700 字的投資規劃說明，務實、無誇大）",
  "tickers": [
    {
      "symbol": "AAPL",
      "reason": "簡短理由，不超過 40 字"
    }
  ]
}

請依照以下使用者條件產生建議：

${userDescription}

請務必輸出完全合法的 JSON，不得包含多餘文字、註解、解釋、或 Markdown。
`.trim();

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const raw =
      (completion as any)?.output?.[0]?.content?.[0]?.text ?? "";

    // 清理可能殘留的 ```json / ``` 等標記
    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: { plan?: string; tickers?: any[] };

    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON parse fail:", cleaned);
      // 解析失敗時，就把整段文字當作 plan，tickers 留空
      return NextResponse.json(
        {
          plan: cleaned,
          tickers: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      plan: parsed.plan || "",
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
