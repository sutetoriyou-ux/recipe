import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ingredients, previousRecipes, condiments } = req.body;

  if (!ingredients || ingredients.trim() === "") {
    return res.status(400).json({ error: "材料を入力してください" });
  }

  const avoidText =
    previousRecipes && previousRecipes.length > 0
      ? `\n\n【前回提案したレシピ（重複禁止）】\n${previousRecipes.join("\n")}`
      : "";

  const condimentsText =
    condiments && condiments.length > 0
      ? `\n\n【使える調味料】\n${condiments.join("、")}\n（上記の調味料を積極的に活用し、リスト外の調味料はなるべく使わないでください）`
      : "";

  const prompt = `あなたは家庭料理のプロです。冷蔵庫にある材料からバランスの良い献立を提案してください。

【冷蔵庫の材料】
${ingredients}
${avoidText}${condimentsText}

以下の6品を提案してください。本格的な料理だけでなく、盛り付けるだけ・和えるだけ・塩コショウとオリーブオイルをかけるだけなど簡単な調理も積極的に提案してください。もう一品①②③は特に簡単な調理や箸休め、デザート感覚のものなど多様性を持たせてください。

出力はJSON形式のみで返してください（説明文不要）:
{
  "main": {
    "name": "料理名",
    "description": "一言説明（材料・味・特徴）",
    "steps": ["手順1", "手順2", "手順3"],
    "time": "調理時間",
    "difficulty": "簡単/普通/本格的"
  },
  "side": {
    "name": "料理名",
    "description": "一言説明",
    "steps": ["手順1", "手順2"],
    "time": "調理時間",
    "difficulty": "簡単/普通/本格的"
  },
  "soup": {
    "name": "料理名",
    "description": "一言説明",
    "steps": ["手順1", "手順2"],
    "time": "調理時間",
    "difficulty": "簡単/普通/本格的"
  },
  "extra1": {
    "name": "料理名",
    "description": "一言説明",
    "steps": ["手順1", "手順2"],
    "time": "調理時間",
    "difficulty": "簡単/普通/本格的"
  },
  "extra2": {
    "name": "料理名",
    "description": "一言説明",
    "steps": ["手順1", "手順2"],
    "time": "調理時間",
    "difficulty": "簡単/普通/本格的"
  },
  "extra3": {
    "name": "料理名",
    "description": "一言説明",
    "steps": ["手順1", "手順2"],
    "time": "調理時間",
    "difficulty": "簡単/普通/本格的"
  }
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON parse failed");
    }
    const recipes = JSON.parse(jsonMatch[0]);

    return res.status(200).json({ recipes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "レシピ生成に失敗しました" });
  }
}
