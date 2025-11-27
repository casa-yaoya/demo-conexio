import { getOpenAIClient } from '../utils/openai'

interface GeneratePointsRequest {
  files: Array<{
    name: string
    content?: string
    dataType: string
  }>
  goals: string[]
  additionalInfo: string[]
  roleplayDesign?: any
}

interface PointItem {
  question: string
  answer: string
}

interface GeneratePointsResponse {
  points: PointItem[]
}

export default defineEventHandler(async (event): Promise<GeneratePointsResponse> => {
  const body = await readBody<GeneratePointsRequest>(event)
  const { files = [], goals = [], additionalInfo = [], roleplayDesign } = body

  console.log('📋 Generating points summary...')

  try {
    const openai = getOpenAIClient()

    // ファイル内容を整理
    const fileContents = files.map(f => `【${f.dataType}】${f.name}:\n${f.content || '内容なし'}`).join('\n\n')
    const goalsText = goals.length > 0 ? goals.join('、') : '特になし'
    const additionalText = additionalInfo.length > 0 ? additionalInfo.join('\n') : '特になし'

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `あなたはロールプレイ研修の専門家です。
与えられた資料から、ユーザーが習得すべき重要なポイントを「問と正答のセット」として抽出してください。

出力形式はJSON配列で、以下の形式で出力してください：
[
  {"question": "質問1", "answer": "正答1"},
  {"question": "質問2", "answer": "正答2"},
  ...
]

注意事項：
- 実務で使える具体的なポイントを抽出してください
- ゴール（暗記、切り返し、ヒアリング、話し方）に関連するポイントを優先してください
- 10〜15個程度のポイントを抽出してください
- JSON形式のみを出力してください（説明文は不要）`
        },
        {
          role: 'user',
          content: `以下の情報から、ロールプレイで習得すべきポイントを抽出してください。

【トレーニングのゴール】
${goalsText}

【アップロードされた資料】
${fileContents}

【追加情報】
${additionalText}

${roleplayDesign ? `【ロープレ設計】\n${JSON.stringify(roleplayDesign, null, 2)}` : ''}

上記を踏まえて、問と正答のセットを生成してください。`
        }
      ]
    })

    const content = response.choices[0]?.message?.content || '[]'

    // JSONをパース
    let points: PointItem[] = []
    try {
      // コードブロックを除去
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      points = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // フォールバック
      points = [
        { question: '挨拶の基本は何ですか？', answer: '明るく元気な声で「いらっしゃいませ」と言うこと' },
        { question: 'お客様の話を聞く際のポイントは？', answer: '相槌を打ち、適度にメモを取りながら聞くこと' }
      ]
    }

    return { points }
  } catch (error: any) {
    console.error('Generate Points API Error:', error)

    // フォールバック
    return {
      points: [
        { question: '基本的な挨拶の仕方は？', answer: '明るく元気に、相手の目を見て挨拶する' },
        { question: 'お客様の要望を聞く際のポイントは？', answer: '傾聴の姿勢を示し、適切な質問で深掘りする' }
      ]
    }
  }
})
