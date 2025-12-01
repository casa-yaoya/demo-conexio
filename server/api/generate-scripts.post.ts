import { getOpenAIClient } from '../utils/openai'
import type { ResponseFormatJSONSchema } from 'openai/resources/shared'

interface GenerateScriptsRequest {
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

interface GenerateScriptsResponse {
  teacherScript: string
  customerScript: string
}

// 台本の行形式
interface ScriptLine {
  speaker: 'self' | 'opponent' | 'narrator'
  text: string
}

// Structured Outputs用JSON Schema（台本）
const scriptResponseSchema: ResponseFormatJSONSchema = {
  type: 'json_schema',
  json_schema: {
    name: 'script_response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              speaker: {
                type: 'string',
                enum: ['self', 'opponent', 'narrator'],
                description: '話者：self（ユーザー/練習者）、opponent（相手/先生/お客様）、narrator（ナレーター/解説）'
              },
              text: {
                type: 'string',
                description: 'セリフまたは解説文'
              }
            },
            required: ['speaker', 'text'],
            additionalProperties: false
          }
        }
      },
      required: ['lines'],
      additionalProperties: false
    }
  }
}

// 台本行をテキストに変換
function linesToText(lines: ScriptLine[], opponentLabel: string): string {
  return lines.map(line => {
    if (line.speaker === 'self') {
      return `ユーザー: ${line.text}`
    } else if (line.speaker === 'opponent') {
      return `${opponentLabel}: ${line.text}`
    } else {
      return `ナレーター: ${line.text}`
    }
  }).join('\n')
}

export default defineEventHandler(async (event): Promise<GenerateScriptsResponse> => {
  const body = await readBody<GenerateScriptsRequest>(event)
  const { files = [], goals = [], additionalInfo = [], points = [], roleplayDesign } = body

  console.log('📝 Generating roleplay scripts...')

  try {
    const openai = getOpenAIClient()

    // ファイル内容を整理
    const fileContents = files.map(f => `【${f.dataType}】${f.name}:\n${f.content || '内容なし'}`).join('\n\n')
    const goalsText = goals.length > 0 ? goals.join('、') : '特になし'
    const additionalText = additionalInfo.length > 0 ? additionalInfo.join('\n') : '特になし'
    const pointsText = points.map((p, i) => `${i + 1}. 問: ${p.question} / 答: ${p.answer}`).join('\n')

    // vs先生 台本生成（Structured Outputs使用）
    const teacherResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: scriptResponseSchema,
      messages: [
        {
          role: 'system',
          content: `あなたはロールプレイ研修の台本作成専門家です。
「先生とユーザー（学習者）」の対話形式の台本を作成してください。

【話者の指定】
- opponent: 先生のセリフ
- self: ユーザー（学習者）のセリフ
- narrator: シーンの説明や注釈

【特徴】
- 先生がポイントを質問形式で確認していく
- ユーザーが回答し、先生がフィードバックする
- 各ポイントを順番にカバーする
- 実際のロールプレイで使える実践的な内容`
        },
        {
          role: 'user',
          content: `以下の情報を元に、先生と学習者の対話台本を作成してください。

【トレーニングのゴール】
${goalsText}

【習得すべきポイント】
${pointsText}

【参考資料】
${fileContents}

【追加情報】
${additionalText}

上記を踏まえて、先生がポイントをQA形式で確認していく台本を作成してください。`
        }
      ]
    })

    // vsお客様 台本生成（Structured Outputs使用）
    // 台本は常に「営業担当（自分）vsお客様（相手）」の形式で生成
    const customerResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: scriptResponseSchema,
      messages: [
        {
          role: 'system',
          content: `あなたはロールプレイ研修の台本作成専門家です。
「お客様とユーザー（営業担当/接客スタッフ）」の対話形式の台本を作成してください。

【話者の指定】
- self: ユーザー（営業担当/接客スタッフ）のセリフ
- opponent: お客様のセリフ
- narrator: シーンの説明や注釈

【台本の特徴】
- 実際の営業・接客シーンを再現した対話形式
- ユーザー（営業側）がお客様に商品説明や提案を行う流れ
- 各学習ポイントを自然な会話の中に盛り込む
- お客様からの質問や要望に対する適切な対応例を含める
- 実務で即活用できる実践的な内容`
        },
        {
          role: 'user',
          content: `以下の情報を元に、営業担当とお客様の対話台本を作成してください。

【トレーニングのゴール】
${goalsText}

【習得すべきポイント】
${pointsText}

【参考資料】
${fileContents}

【追加情報】
${additionalText}

上記を踏まえて、営業担当がお客様に対応する実践的な対話シナリオを作成してください。
台本は「あなた（営業）」と「お客様」の会話形式で構成してください。`
        }
      ]
    })

    // Structured Outputsの結果をパースしてテキストに変換
    let teacherScript = generateFallbackTeacherScript(points)
    let customerScript = generateFallbackCustomerScript(points)

    try {
      const teacherContent = teacherResponse.choices[0]?.message?.content
      if (teacherContent) {
        const parsed = JSON.parse(teacherContent) as { lines: ScriptLine[] }
        teacherScript = linesToText(parsed.lines, '先生')
      }
    } catch (e) {
      console.error('Teacher script parse error:', e)
    }

    try {
      const customerContent = customerResponse.choices[0]?.message?.content
      if (customerContent) {
        const parsed = JSON.parse(customerContent) as { lines: ScriptLine[] }
        customerScript = linesToText(parsed.lines, 'お客さん')
      }
    } catch (e) {
      console.error('Customer script parse error:', e)
    }

    return {
      teacherScript,
      customerScript
    }
  } catch (error: any) {
    console.error('Generate Scripts API Error:', error)

    return {
      teacherScript: generateFallbackTeacherScript(points),
      customerScript: generateFallbackCustomerScript(points)
    }
  }
})

function generateFallbackTeacherScript(points: Array<{ question: string; answer: string }>): string {
  const lines = ['先生: それでは、今日のポイントを確認していきましょう。']

  points.forEach((p, i) => {
    lines.push(`\n先生: まず${i + 1}つ目、${p.question}`)
    lines.push(`ユーザー: ${p.answer}`)
    lines.push(`先生: その通りです！よくできました。`)
  })

  lines.push('\n先生: 全てのポイントを確認できました。お疲れ様でした！')
  return lines.join('\n')
}

function generateFallbackCustomerScript(points: Array<{ question: string; answer: string }>): string {
  const lines = ['お客さん: すみません、ちょっといいですか？']
  lines.push('ユーザー: はい、いらっしゃいませ。どのようなご用件でしょうか？')

  points.slice(0, 3).forEach((p) => {
    lines.push(`\nお客さん: ${p.question.replace('？', 'んですけど...')}`)
    lines.push(`ユーザー: ${p.answer}`)
    lines.push(`お客さん: なるほど、ありがとうございます。`)
  })

  lines.push('\nお客さん: よく分かりました。ありがとうございました。')
  lines.push('ユーザー: ありがとうございました。またのお越しをお待ちしております。')
  return lines.join('\n')
}
