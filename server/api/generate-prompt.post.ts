import { getOpenAIClient } from '../utils/openai'

interface GeneratePromptRequest {
  mode: 'subtitle' | 'ai-demo' | 'confirmation' | 'practice'
  metaPrompt?: string  // エージェントに渡すメタプロンプト
  roleplayDesign?: {
    situation?: string
    opponentSetting?: string
    script?: string  // 台本データ
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
  settings?: {
    speakingStyle?: string  // フレンドリー、ていねい、厳しい
    maxTurnCount?: number   // 上限ターン数
    endOnCall?: boolean     // 終了コールで終了するか
  }
  files?: Array<{
    name: string
    content?: string
    summary?: string
  }>
}

interface GeneratePromptResponse {
  mode: string
  systemPrompt: string
  conversationFlow?: string
}

// Mode-specific prompt templates
const modeTemplates: Record<string, string> = {
  'subtitle': `あなたは台本モードのロールプレイAIです。

【役割】
ユーザーに台本を読み上げ、正しい応対の流れを学ばせます。

【設計情報】
{{DESIGN}}

【指示】
- 台本に忠実に進行してください
- ユーザーが間違えた場合は優しく訂正してください
- 各ステップでポイントを説明してください`,

  'ai-demo': `あなたはお手本モードのロールプレイAIです。

【役割】
理想的な接客/営業対応を実演し、ユーザーに見せます。

【設計情報】
{{DESIGN}}

【指示】
- プロフェッショナルな対応を実演してください
- 各シーンで重要なポイントを解説してください
- ユーザーの質問には丁寧に答えてください`,

  'confirmation': `あなたは確認モードのロールプレイAIです。

【役割】
ユーザーの理解度を確認しながら、段階的に進めます。

【設計情報】
{{DESIGN}}

【指示】
- 各ポイントについてユーザーに質問してください
- 正解の場合は褒めて次に進んでください
- 間違いの場合はヒントを出して再度チャレンジさせてください`,

  'practice': `あなたは実戦モードのロールプレイAIです。

【役割】
リアルな顧客/取引先として振る舞い、ユーザーの対応力を試します。

【設計情報】
{{DESIGN}}

【指示】
- リアルな顧客として自然に対話してください
- ユーザーの対応を内部で評価してください
- セッション終了時にフィードバックを提供してください`
}

export default defineEventHandler(async (event): Promise<GeneratePromptResponse> => {
  const body = await readBody<GeneratePromptRequest>(event)
  const { mode, metaPrompt, roleplayDesign, settings, files = [] } = body

  if (!mode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mode is required'
    })
  }

  console.log(`📝 Generating prompt for mode: ${mode}`, settings)

  try {
    const openai = getOpenAIClient()

    // Build the design context
    const designContext = buildDesignContext(roleplayDesign, files)

    // メタプロンプトがある場合はそれを使用、なければデフォルトのテンプレート
    if (metaPrompt) {
      // メタプロンプトを使用してプロンプト生成エージェントに依頼（Responses API: gpt-4.1）
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: metaPrompt
          },
          {
            role: 'user',
            content: `以下の情報を元に、${getModeLabel(mode)}用のシステムプロンプトを生成してください。

【状況・概要】
${roleplayDesign?.situation || '設定なし'}

${roleplayDesign?.script ? `【台本】\n${roleplayDesign.script}\n` : ''}

${roleplayDesign?.points?.length ? `【ポイント】\n${roleplayDesign.points.map((p, i) =>
  `${i + 1}. ${p.question}\n   基準: ${p.criteria}\n   例: ${p.example}`
).join('\n')}\n` : ''}

${files.length > 0 ? `【参考ファイル情報】\n${files.map(f => `- ${f.name}: ${f.summary || f.content?.substring(0, 500) || '内容なし'}`).join('\n')}` : ''}

【会話設定】
- 話し方スタイル: ${settings?.speakingStyle || 'フレンドリー'}
- 上限ターン数: ${settings?.maxTurnCount || 10}ターン
- 終了コール対応: ${settings?.endOnCall ? 'プレイヤーまたはAIが「会話終了」などの終了コールをしたら会話を終了する' : '終了コールでは終了しない'}

上記を踏まえて、AIに与えるシステムプロンプトを生成してください。
話し方スタイルに合わせた口調で話すよう指示を含めてください。
ターン数の上限と終了条件も必ずプロンプトに含めてください。
キャラクター情報は末尾に追加されるので含めないでください。
出力はプロンプトのみ、マークダウン装飾なしでお願いします。`
          }
        ]
      })

      const generatedPrompt = response.choices[0]?.message?.content || ''

      return {
        mode,
        systemPrompt: generatedPrompt,
        conversationFlow: generateConversationFlow(mode, roleplayDesign)
      }
    }

    // 従来の処理（metaPromptがない場合）
    // Get the base template
    const baseTemplate = modeTemplates[mode] || modeTemplates['practice']
    const templateWithDesign = baseTemplate.replace('{{DESIGN}}', designContext)

    // Use OpenAI to enhance and customize the prompt（Responses API: gpt-4.1）
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: `あなたはロールプレイ用システムプロンプトの専門家です。
与えられたテンプレートと設計情報を元に、最適化されたシステムプロンプトを生成してください。

出力形式:
- 最適化されたシステムプロンプトをそのまま出力してください
- マークダウンや余計な装飾は不要です
- 実際にAIが使用できる形式で出力してください`
        },
        {
          role: 'user',
          content: `以下のテンプレートと設計情報を元に、${getModeLabel(mode)}用のシステムプロンプトを生成してください。

【テンプレート】
${templateWithDesign}

【追加のファイル情報】
${files.map(f => `- ${f.name}: ${f.summary || f.content || '内容なし'}`).join('\n') || 'なし'}

上記を踏まえて、最適化されたシステムプロンプトを生成してください。`
        }
      ]
    })

    const generatedPrompt = response.choices[0]?.message?.content || templateWithDesign

    return {
      mode,
      systemPrompt: generatedPrompt,
      conversationFlow: generateConversationFlow(mode, roleplayDesign)
    }
  } catch (error: any) {
    console.error('Generate Prompt API Error:', error)

    // Return a fallback template if API fails
    const designContext = buildDesignContext(roleplayDesign, files)
    const fallbackPrompt = (modeTemplates[mode] || modeTemplates['practice'])
      .replace('{{DESIGN}}', designContext)

    return {
      mode,
      systemPrompt: fallbackPrompt,
      conversationFlow: generateConversationFlow(mode, roleplayDesign)
    }
  }
})

function buildDesignContext(
  design: GeneratePromptRequest['roleplayDesign'],
  files: GeneratePromptRequest['files']
): string {
  if (!design) return '設計情報なし'

  const sections: string[] = []

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

  return sections.join('\n\n') || '設計情報なし'
}

function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    'subtitle': '台本モード',
    'ai-demo': 'お手本モード',
    'confirmation': '確認モード',
    'practice': '実践モード'
  }
  return labels[mode] || mode
}

function generateConversationFlow(
  mode: string,
  design: GeneratePromptRequest['roleplayDesign']
): string {
  if (!design?.points?.length) {
    return '会話の流れは設計情報から自動生成されます。'
  }

  const steps = design.points.map((point, i) => {
    return `ステップ${i + 1}: ${point.question}`
  })

  return steps.join('\n→ ')
}
