import { getOpenAIClient } from '../utils/openai'

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

    // vs先生 台本生成
    const teacherResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `あなたはロールプレイ研修の台本作成専門家です。
「先生とユーザー（学習者）」の対話形式の台本を作成してください。

【形式】
先生: 〇〇〇
ユーザー: 〇〇〇
先生: 〇〇〇
...

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

    // vsお客さん 台本生成
    const customerResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `あなたはロールプレイ研修の台本作成専門家です。
「お客さんとユーザー（営業/接客担当）」の対話形式の台本を作成してください。

【形式】
お客さん: 〇〇〇
ユーザー: 〇〇〇
お客さん: 〇〇〇
...

【特徴】
- リアルな顧客とのやり取りを再現
- ユーザーが適切な対応をする流れ
- 各ポイントを自然に盛り込む
- 実際の現場で役立つ実践的な内容`
        },
        {
          role: 'user',
          content: `以下の情報を元に、お客さんとの対話台本を作成してください。

【トレーニングのゴール】
${goalsText}

【習得すべきポイント】
${pointsText}

【参考資料】
${fileContents}

【追加情報】
${additionalText}

上記を踏まえて、実践的なお客さんとの対話シナリオを作成してください。`
        }
      ]
    })

    const teacherScript = teacherResponse.choices[0]?.message?.content || generateFallbackTeacherScript(points)
    const customerScript = customerResponse.choices[0]?.message?.content || generateFallbackCustomerScript(points)

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
