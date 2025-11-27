import { getOpenAIClient } from '../utils/openai'

interface GenerateRoleplayPromptsRequest {
  files: Array<{
    name: string
    content?: string
    dataType: string
  }>
  goals: string[]
  additionalInfo: string[]
  points: Array<{ question: string; answer: string }>
  roleplayDesign?: any
}

interface GenerateRoleplayPromptsResponse {
  teacherPrompt: string
  feedbackPrompt: string
  customerScenarios: string[]
}

export default defineEventHandler(async (event): Promise<GenerateRoleplayPromptsResponse> => {
  const body = await readBody<GenerateRoleplayPromptsRequest>(event)
  const { files = [], goals = [], additionalInfo = [], points = [], roleplayDesign } = body

  console.log('🤖 Generating roleplay prompts...')

  try {
    const openai = getOpenAIClient()

    // 共通のコンテキスト情報
    const fileContents = files.map(f => `【${f.dataType}】${f.name}:\n${f.content || '内容なし'}`).join('\n\n')
    const goalsText = goals.length > 0 ? goals.join('、') : '特になし'
    const additionalText = additionalInfo.length > 0 ? additionalInfo.join('\n') : '特になし'
    const pointsText = points.map((p, i) => `${i + 1}. 問: ${p.question} / 答: ${p.answer}`).join('\n')

    // 1. vs先生プロンプト生成
    const teacherPromptResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: `あなたはAIロールプレイシステムのシステムプロンプト作成専門家です。
「先生」として振る舞うAIのシステムプロンプトを作成してください。

【先生AIの役割】
- ユーザーにポイントをQA形式で質問していく
- 回答が正しければ褒めて次へ進む
- 回答が間違っていればヒントを出したり、正解を教えて会話を続ける
- 優しく励ましながら学習をサポートする

出力は、そのままAIのシステムプロンプトとして使える形式で出力してください。`
        },
        {
          role: 'user',
          content: `以下の情報を元に、先生AIのシステムプロンプトを作成してください。

【トレーニングのゴール】
${goalsText}

【習得すべきポイント】
${pointsText}

【参考資料】
${fileContents}

【追加情報】
${additionalText}`
        }
      ]
    })

    // 2. フィードバック基準プロンプト生成
    const feedbackPromptResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: `あなたはAIロールプレイシステムのフィードバック基準作成専門家です。
先生AIがユーザーの回答を評価するためのフィードバック基準プロンプトを作成してください。

【フィードバック基準の要素】
- 各ポイントの正解判定基準
- 部分点の基準
- よくある間違いと対処法
- 励ましのメッセージパターン

出力は、そのままAIのシステムプロンプトに組み込める形式で出力してください。`
        },
        {
          role: 'user',
          content: `以下の情報を元に、フィードバック基準プロンプトを作成してください。

【トレーニングのゴール】
${goalsText}

【習得すべきポイント】
${pointsText}

【参考資料】
${fileContents}`
        }
      ]
    })

    // 3. vs客シナリオ10パターン生成
    const customerScenariosResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 8192,
      messages: [
        {
          role: 'system',
          content: `あなたはAIロールプレイシステムのシナリオ作成専門家です。
様々なタイプの「お客さん」を演じるAIのシステムプロンプトを10パターン作成してください。

【出力形式】
各シナリオは「===シナリオN===」で区切り、以下の形式で出力：
===シナリオ1===
あなたは〇〇タイプの顧客です。
...詳細な設定とプロンプト...

===シナリオ2===
...

【シナリオのバリエーション例】
- 急いでいるお客さん
- 細かい質問が多いお客さん
- 予算を気にするお客さん
- 決断が遅いお客さん
- 怒っているお客さん
- 初めてのお客さん
- リピーターのお客さん
- 比較検討中のお客さん
- etc.

各シナリオは実際のAIシステムプロンプトとして使える形式で出力してください。`
        },
        {
          role: 'user',
          content: `以下の情報を元に、10種類の顧客シナリオプロンプトを作成してください。

【トレーニングのゴール】
${goalsText}

【習得すべきポイント】
${pointsText}

【参考資料】
${fileContents}

【追加情報】
${additionalText}`
        }
      ]
    })

    const teacherPrompt = teacherPromptResponse.choices[0]?.message?.content || generateFallbackTeacherPrompt(points)
    const feedbackPrompt = feedbackPromptResponse.choices[0]?.message?.content || generateFallbackFeedbackPrompt(points)
    const customerScenariosRaw = customerScenariosResponse.choices[0]?.message?.content || ''

    // シナリオを分割
    const customerScenarios = parseCustomerScenarios(customerScenariosRaw)

    return {
      teacherPrompt,
      feedbackPrompt,
      customerScenarios
    }
  } catch (error: any) {
    console.error('Generate Roleplay Prompts API Error:', error)

    return {
      teacherPrompt: generateFallbackTeacherPrompt(points),
      feedbackPrompt: generateFallbackFeedbackPrompt(points),
      customerScenarios: generateFallbackCustomerScenarios()
    }
  }
})

function parseCustomerScenarios(raw: string): string[] {
  if (!raw) return generateFallbackCustomerScenarios()

  // ===シナリオN=== で分割
  const parts = raw.split(/===シナリオ\d+===/).filter(s => s.trim())

  if (parts.length === 0) {
    // 別のパターンを試す
    const altParts = raw.split(/シナリオ\d+[:：]/).filter(s => s.trim())
    if (altParts.length > 0) return altParts.slice(0, 10)
    return generateFallbackCustomerScenarios()
  }

  return parts.slice(0, 10)
}

function generateFallbackTeacherPrompt(points: Array<{ question: string; answer: string }>): string {
  return `あなたは優しい先生として、学習者にポイントを確認していきます。

【あなたの役割】
- 各ポイントを順番に質問形式で確認する
- 正解なら褒めて次へ進む
- 間違いならヒントを出して再度チャレンジさせる
- 常に励ましながら進める

【確認するポイント】
${points.map((p, i) => `${i + 1}. ${p.question}\n   正解: ${p.answer}`).join('\n')}

【進め方】
1. 挨拶と今日の学習内容の説明
2. 各ポイントをQA形式で確認
3. 全て終わったらまとめとフィードバック`
}

function generateFallbackFeedbackPrompt(points: Array<{ question: string; answer: string }>): string {
  return `【フィードバック基準】

${points.map((p, i) => `【ポイント${i + 1}】
質問: ${p.question}
正解基準: ${p.answer}
部分点: キーワードが含まれていれば部分点
よくある間違い: 回答が曖昧、具体性がない`).join('\n\n')}

【評価の指針】
- 完全正解: 「素晴らしい！その通りです」
- 部分正解: 「いい線いってます。もう少し具体的に言うと...」
- 不正解: 「惜しいです。ヒントを出しますね...」`
}

function generateFallbackCustomerScenarios(): string[] {
  return [
    `あなたは「急いでいるお客さん」を演じます。
時間がないことを強調し、要点を素早く知りたがります。
「手短にお願いします」「あと5分しかないんです」などのセリフを使ってください。`,

    `あなたは「細かい質問が多いお客さん」を演じます。
細部まで確認したがり、たくさん質問します。
「それはなぜですか？」「もう少し詳しく」などのセリフを使ってください。`,

    `あなたは「予算を気にするお客さん」を演じます。
価格を気にし、割引や特典について聞いてきます。
「もう少し安くなりませんか？」などのセリフを使ってください。`,

    `あなたは「決断が遅いお客さん」を演じます。
なかなか決められず、迷いを見せます。
「うーん、どうしようかな」などのセリフを使ってください。`,

    `あなたは「怒っているお客さん」を演じます。
以前の不満やクレームがあり、少しイライラしています。
適度にクレームを入れつつ、対応次第で態度が軟化します。`,

    `あなたは「初めてのお客さん」を演じます。
初めてで不安があり、基本的なことから説明を求めます。
「初めてなんですけど」「よく分からないので教えてください」などを使います。`,

    `あなたは「リピーターのお客さん」を演じます。
以前も利用したことがあり、ある程度知識があります。
「前も使ったんだけど」などのセリフを使ってください。`,

    `あなたは「比較検討中のお客さん」を演じます。
他社の製品やサービスと比較しています。
「他社さんだと〇〇なんですけど」などのセリフを使ってください。`,

    `あなたは「友好的なお客さん」を演じます。
フレンドリーで話しやすく、雑談も交えます。
良い関係構築の練習になるシナリオです。`,

    `あなたは「専門知識があるお客さん」を演じます。
業界や製品について詳しく、専門的な質問をします。
「〇〇の技術的な仕様は？」などのセリフを使ってください。`
  ]
}
