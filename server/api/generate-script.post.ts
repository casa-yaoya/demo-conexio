import { getOpenAIClient } from '../utils/openai'

interface GenerateScriptRequest {
  mode: 'subtitle' | 'ai-demo' | 'confirmation' | 'practice'
  goals?: string[]
  roleplayDesign?: {
    situation?: string
    opponentSetting?: string
    missions?: {
      required?: string[]
      scoring?: string[]
      failure?: string[]
    }
    points?: Array<{
      question: string
      criteria: string
      example: string
    }>
  }
  files?: Array<{
    name: string
    content?: string
    dataType?: string
  }>
}

interface GenerateScriptResponse {
  mode: string
  script: string
}

// ゴール別プロンプト定義
type GoalType = 'ForMemorize' | 'ForUnderstanding' | 'ForHearing' | 'ForOutReturn' | 'ForSpeaking'

// ゴールラベルからGoalTypeへのマッピング
const goalLabelToType: Record<string, GoalType> = {
  '台本の暗記': 'ForMemorize',
  '正確な説明や質問': 'ForUnderstanding',
  'ヒアリング': 'ForHearing',
  '質疑や反論への切り返し': 'ForOutReturn',
  '話し方': 'ForSpeaking'
}

// ゴール別の台本生成プロンプト
const goalScriptPrompts: Record<GoalType, string> = {
  // ① 台本の暗記
  ForMemorize: `あなたは営業・接客のロールプレイ台本作成の専門家です。
「台本の暗記」を目的とした会話台本を作成してください。

【台本暗記モードの特徴】
- 正確なセリフを一字一句覚えるための台本形式
- ユーザーが暗記すべきセリフを明確に示す
- セリフの順序、タイミング、間の取り方も指定
- 重要なフレーズには★マークで強調

【出力形式】
---
[シーン1: 導入・挨拶]
👤 あなた（暗記セリフ）:
「（一字一句正確に言うべきセリフ）」
⏱️ タイミング: 入室後すぐ、笑顔で
★ 暗記ポイント: このフレーズは必ず覚える

👔 相手: 「（想定される返答）」

👤 あなた（暗記セリフ）:
「（次に言うべき正確なセリフ）」
📝 注意: 「〇〇」という言い回しを使うこと
---
（以降、シーン2, 3...と続く）

【重視すること】
- セリフは具体的かつ正確に記述
- 間違えやすいポイントを指摘
- 練習のコツもコメントで追加`,

  // ② 正確な説明や質問
  ForUnderstanding: `あなたは営業・接客のロールプレイ台本作成の専門家です。
「正確な説明や質問への対応」を目的とした会話台本を作成してください。

【説明力強化モードの特徴】
- 商品・サービスの正確な説明を練習するための台本
- よくある質問とその正確な回答を含む
- 数字やスペックを正しく伝える練習
- 説明の順序や構成も学べる形式

【出力形式】
---
[説明ポイント1: 〇〇の特徴]
❓ お客様の質問: 「（よくある質問）」

✅ 正確な回答:
「（正しい情報を含む回答例）」

📊 押さえるべき数字/情報:
・〇〇: ××円
・△△: □□個
・◇◇: ▽▽%

⚠️ 間違えやすいポイント:
（よくある間違いとその正しい情報）
---
（以降、説明ポイント2, 3...と続く）

【重視すること】
- 数字や条件は正確に記載
- 曖昧な表現を避ける
- よくある誤解を訂正する形式`,

  // ③ ヒアリング
  ForHearing: `あなたは営業・接客のロールプレイ台本作成の専門家です。
「ヒアリング力向上」を目的とした会話台本を作成してください。

【ヒアリングモードの特徴】
- お客様のニーズを引き出す質問力を養う台本
- オープンクエスチョンとクローズドクエスチョンの使い分け
- 深掘りの技術を学べる構成
- お客様の本音を引き出すテクニック

【出力形式】
---
[ヒアリングステップ1: 現状把握]
🎯 目的: お客様の現在の状況を把握する

👤 あなた（オープンクエスチョン）:
「（広く情報を聞き出す質問）」
📝 ポイント: なぜこの質問が効果的か

👔 お客様: 「（想定される回答パターン）」

👤 あなた（深掘り質問）:
「（さらに詳しく聞く質問）」
💡 テクニック: 「なぜ」「具体的には」で深掘り

[分岐パターン]
A. お客様が積極的な場合 → さらに詳細を聞く
B. お客様が消極的な場合 → 別の切り口で質問
---
（以降、ステップ2, 3...と続く）

【重視すること】
- 質問のバリエーションを豊富に
- 傾聴のポイントも記載
- お客様の反応に応じた分岐を含む`,

  // ④ 質疑や反論への切り返し
  ForOutReturn: `あなたは営業・接客のロールプレイ台本作成の専門家です。
「質疑や反論への切り返し」を目的とした会話台本を作成してください。

【切り返しモードの特徴】
- よくある反論・質問への対応パターンを網羅
- 否定せずに切り返す技法を学べる
- 様々な反論パターンとその対処法
- 感情的にならない対応の仕方

【出力形式】
---
[反論パターン1: 価格への異議]
👔 お客様（反論）: 「（典型的な反論）」
例: 「ちょっと高いですね」「予算オーバーです」

🔴 NG対応:
「（避けるべき対応例）」
→ なぜダメか: （理由の説明）

🟢 推奨対応:
Step1. まず受け止める
「（共感を示す言葉）」

Step2. 理由を確認する
「（質問で掘り下げる）」

Step3. 価値を伝える
「（切り返しのセリフ）」

💡 切り返しのコツ:
・相手を否定しない
・Yes, and... の技法を使う
・質問で返す
---
（以降、反論パターン2, 3...と続く）

【重視すること】
- 実際によくある反論を想定
- 段階的な対応手順を示す
- 複数の切り返しパターンを提示`,

  // ⑤ 話し方
  ForSpeaking: `あなたは営業・接客のロールプレイ台本作成の専門家です。
「話し方の向上」を目的とした会話台本を作成してください。

【話し方モードの特徴】
- 声のトーン、スピード、抑揚の指示を含む
- 間の取り方や強調のポイントを明示
- 表情やジェスチャーの指示も含む
- 聞きやすい話し方の練習用

【出力形式】
---
[シーン1: 第一印象を決める挨拶]
👤 あなた:
「（セリフ内容）」

🎤 話し方の指示:
・声のトーン: 明るく、やや高め
・スピード: ゆっくり目（1秒に3文字程度）
・声の大きさ: 普段より少し大きめ
・抑揚: 「〇〇」を強調、「△△」は軽く

⏸️ 間の取り方:
・「〇〇」の後に1秒の間
・相手の反応を確認してから次へ

😊 表情・態度:
・笑顔で
・相手の目を見て
・軽くお辞儀

📝 練習のコツ:
・鏡の前で練習
・録音して確認
---
（以降、シーン2, 3...と続く）

【重視すること】
- 具体的な声の出し方を指示
- 間やテンポを明確に
- 感情の込め方も指導`
}

// Mode-specific script generation prompts（既存モードプロンプト）
const modePrompts: Record<string, string> = {
  'subtitle': `あなたは営業・接客のロールプレイ台本作成の専門家です。
与えられた情報を元に、台本モード用の会話台本を作成してください。

【台本モードの特徴】
- ユーザーが正しい応対を学ぶための台本形式
- 各発話にはタイミングと説明を含める
- 重要なポイントには★マークをつける

【出力形式】
---
[シーン1: 挨拶]
👔 相手: 「（発話内容）」
📝 ポイント: （このシーンで学ぶべきこと）

👤 あなた: 「（理想的な発話内容）」
★ 重要: （なぜこの発話が良いのか）
---
（以降、シーン2, 3...と続く）`,

  'confirmation': `あなたは営業・接客のロールプレイ確認問題作成の専門家です。
与えられた情報を元に、確認モード用の会話スクリプトを作成してください。

【確認モードの特徴】
- ユーザーの理解度を確認するためのQ&A形式
- 各シーンで「正解」「不正解パターン」「解説」を含める
- 段階的に難易度を上げる

【出力形式】
---
[確認ポイント1: テーマ名]
💬 状況: （シチュエーション説明）
❓ 質問: 「（相手の発話）」に対して、どう返答しますか？

✅ 正解例: 「（理想的な返答）」
❌ 不正解例: 「（避けるべき返答）」
📖 解説: （なぜ正解が良いのか、不正解がダメなのかの説明）
---
（以降、確認ポイント2, 3...と続く）`,

  'practice': `あなたは営業・接客のロールプレイシナリオ作成の専門家です。
与えられた情報を元に、実戦モード用の会話シナリオを作成してください。

【実戦モードの特徴】
- リアルな顧客とのやり取りをシミュレーション
- 予期せぬ質問や反論も含める
- 評価基準を明確にする

【出力形式】
---
[シナリオ概要]
🎯 目標: （このロープレで達成すべきこと）
⏱️ 想定時間: （目安時間）
📊 評価ポイント: （何を評価するか）

[会話の流れ]
1️⃣ 導入フェーズ
   相手の初期態度: （どんな状態で始まるか）
   想定される展開: （どう進むか）

2️⃣ 本題フェーズ
   主要な質問/反論: （相手が言いそうなこと）
   対応のポイント: （どう対処すべきか）

3️⃣ クロージングフェーズ
   成功パターン: （うまくいった場合）
   失敗パターン: （つまずいた場合）
---`
}

// ゴールに応じたプロンプトを取得
function getPromptForGoals(goals: string[], mode: string): string {
  // ゴールをGoalTypeに変換
  const goalTypes: GoalType[] = (goals || [])
    .map(goal => goalLabelToType[goal])
    .filter((type): type is GoalType => type !== undefined)

  // ゴールが指定されている場合
  if (goalTypes.length === 1) {
    return goalScriptPrompts[goalTypes[0]]
  }

  // 複数ゴールの場合は組み合わせ
  if (goalTypes.length > 1) {
    return `あなたは営業・接客のロールプレイ台本作成の専門家です。
以下の複合目的に対応した会話台本を作成してください。

【トレーニングの目的】
${goalTypes.map(type => {
  const labels: Record<GoalType, string> = {
    ForMemorize: '台本の暗記：正確なセリフを覚える',
    ForUnderstanding: '正確な説明：商品・サービスを正しく説明する',
    ForHearing: 'ヒアリング：お客様のニーズを引き出す',
    ForOutReturn: '切り返し：反論に適切に対応する',
    ForSpeaking: '話し方：声のトーンや速度をコントロールする'
  }
  return `- ${labels[type]}`
}).join('\n')}

【台本の構成】
各シーンで以下の要素を含めてください：
${goalTypes.includes('ForMemorize') ? '- 暗記すべき正確なセリフ' : ''}
${goalTypes.includes('ForUnderstanding') ? '- 正確な説明例と押さえるべき情報' : ''}
${goalTypes.includes('ForHearing') ? '- 効果的な質問例と深掘りのコツ' : ''}
${goalTypes.includes('ForOutReturn') ? '- 反論への切り返しパターン' : ''}
${goalTypes.includes('ForSpeaking') ? '- 声のトーンや間の取り方の指示' : ''}

【出力形式】
シーンごとに構造化して出力してください。`
  }

  // ゴールがない場合はモードに応じたデフォルトプロンプト
  return modePrompts[mode] || modePrompts['practice']
}

export default defineEventHandler(async (event): Promise<GenerateScriptResponse> => {
  const body = await readBody<GenerateScriptRequest>(event)
  const { mode, goals = [], roleplayDesign, files = [] } = body

  if (!mode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mode is required'
    })
  }

  console.log(`📜 Generating script for mode: ${mode}`)
  console.log('🎯 Goals:', goals)

  try {
    const openai = getOpenAIClient()

    // Build context from design and files
    const context = buildContext(roleplayDesign, files)

    // ゴールに応じたプロンプトを取得
    const systemPrompt = getPromptForGoals(goals, mode)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `以下の情報を元に、${getModeLabel(mode)}用の会話スクリプトを作成してください。

【トレーニングのゴール】
${goals.length > 0 ? goals.join('、') : '特になし'}

${context}

上記を踏まえて、実践的で学習効果の高いスクリプトを生成してください。`
        }
      ]
    })

    const generatedScript = response.choices[0]?.message?.content || generateFallbackScript(mode, goals)

    return {
      mode,
      script: generatedScript
    }
  } catch (error: any) {
    console.error('Generate Script API Error:', error)

    // Return a fallback script if API fails
    return {
      mode,
      script: generateFallbackScript(mode, goals)
    }
  }
})

function buildContext(
  design: GenerateScriptRequest['roleplayDesign'],
  files: GenerateScriptRequest['files']
): string {
  const sections: string[] = []

  // Design information
  if (design) {
    if (design.situation) {
      sections.push(`【状況設定】\n${design.situation}`)
    }

    if (design.opponentSetting) {
      sections.push(`【相手の設定】\n${design.opponentSetting}`)
    }

    if (design.missions) {
      const missionText: string[] = []
      if (design.missions.required?.length) {
        missionText.push(`必須ミッション: ${design.missions.required.join(', ')}`)
      }
      if (design.missions.scoring?.length) {
        missionText.push(`加点ポイント: ${design.missions.scoring.join(', ')}`)
      }
      if (design.missions.failure?.length) {
        missionText.push(`減点ポイント: ${design.missions.failure.join(', ')}`)
      }
      if (missionText.length) {
        sections.push(`【ミッション】\n${missionText.join('\n')}`)
      }
    }

    if (design.points?.length) {
      const pointsText = design.points.map((p, i) =>
        `${i + 1}. ${p.question}\n   基準: ${p.criteria}\n   例: ${p.example}`
      ).join('\n')
      sections.push(`【評価ポイント】\n${pointsText}`)
    }
  }

  // File information
  if (files?.length) {
    const filesByType: Record<string, string[]> = {}

    for (const file of files) {
      const type = file.dataType || 'その他'
      if (!filesByType[type]) {
        filesByType[type] = []
      }
      filesByType[type].push(`${file.name}: ${file.content?.substring(0, 500) || '(内容なし)'}`)
    }

    for (const [type, fileList] of Object.entries(filesByType)) {
      sections.push(`【${type}】\n${fileList.join('\n\n')}`)
    }
  }

  return sections.join('\n\n') || '（設計情報なし - 一般的な営業/接客シナリオを生成します）'
}

function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    'subtitle': '台本モード',
    'ai-demo': 'お手本モード',
    'confirmation': '確認モード',
    'practice': '実戦モード'
  }
  return labels[mode] || mode
}

function generateFallbackScript(mode: string, goals: string[] = []): string {
  // ゴール別フォールバック
  if (goals.includes('台本の暗記')) {
    return `---
[シーン1: 挨拶]
👤 あなた（暗記セリフ）:
「お世話になっております。〇〇会社の△△と申します。本日はお時間をいただきありがとうございます。」
⏱️ タイミング: 入室後、相手と目が合ったらすぐに
★ 暗記ポイント: この挨拶文は一字一句正確に覚えましょう

👔 相手: 「どうも、お待ちしておりました。」

👤 あなた（暗記セリフ）:
「本日は〇〇のご提案でお伺いいたしました。お忙しいところ恐れ入りますが、15分ほどお時間をいただければと存じます。」
📝 注意: 「恐れ入りますが」は丁寧語として重要
---

※ 詳細な設計情報を入力すると、より具体的な台本が生成されます。`
  }

  if (goals.includes('ヒアリング')) {
    return `---
[ヒアリングステップ1: 現状把握]
🎯 目的: お客様の現在の状況を把握する

👤 あなた（オープンクエスチョン）:
「現在、〇〇についてはどのような方法で対応されていますか？」
📝 ポイント: まずは広く状況を聞く

👔 お客様: 「今は△△で対応しています。」

👤 あなた（深掘り質問）:
「なるほど、△△をお使いなんですね。具体的にはどのような場面で使われていますか？」
💡 テクニック: 「具体的には」で詳細を引き出す
---

※ 詳細な設計情報を入力すると、より具体的なシナリオが生成されます。`
  }

  // 既存のフォールバック
  const fallbacks: Record<string, string> = {
    'subtitle': `---
[シーン1: 挨拶]
👔 相手: 「いらっしゃいませ」
📝 ポイント: 第一印象が大切です

👤 あなた: 「お忙しいところありがとうございます。〇〇会社の△△と申します」
★ 重要: 明るく、はっきりと名乗ることで信頼感を与えます
---

※ 詳細な設計情報を入力すると、より具体的な台本が生成されます。`,

    'confirmation': `---
[確認ポイント1: 挨拶の基本]
💬 状況: 初めてのお客様との商談開始時
❓ 質問: お客様に最初に何と言いますか？

✅ 正解例: 「本日はお時間をいただきありがとうございます」
❌ 不正解例: 「えーと、今日は...」
📖 解説: 感謝の気持ちを最初に伝えることで、良い印象を与えられます
---

※ 詳細な設計情報を入力すると、より具体的な確認問題が生成されます。`,

    'practice': `---
[シナリオ概要]
🎯 目標: 商品/サービスの提案から契約までを行う
⏱️ 想定時間: 10-15分
📊 評価ポイント: ヒアリング力、提案力、クロージング力

[会話の流れ]
1️⃣ 導入フェーズ
   相手の初期態度: やや警戒している
   想定される展開: 簡単な自己紹介から始める

2️⃣ 本題フェーズ
   主要な質問/反論: 「価格が高い」「今は必要ない」
   対応のポイント: 具体的なメリットを数字で示す

3️⃣ クロージングフェーズ
   成功パターン: 次回アポイントの約束
   失敗パターン: 「検討します」で終わる
---

※ 詳細な設計情報を入力すると、より具体的なシナリオが生成されます。`
  }

  return fallbacks[mode] || fallbacks['practice']
}
