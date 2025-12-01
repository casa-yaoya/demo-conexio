import { getOpenAIClient } from '../utils/openai'

interface GenerateFeedbackRequest {
  evaluationPrompt: string
  transcript: string
}

interface GenerateFeedbackResponse {
  score: number
  feedback: string
  details?: Array<{
    name: string
    score: number
    comment: string
  }>
}

export default defineEventHandler(async (event): Promise<GenerateFeedbackResponse> => {
  const body = await readBody<GenerateFeedbackRequest>(event)
  const { evaluationPrompt, transcript } = body

  if (!evaluationPrompt || !transcript) {
    throw createError({
      statusCode: 400,
      statusMessage: '評価プロンプトと会話ログが必要です'
    })
  }

  console.log('📊 Generating feedback for roleplay...')

  try {
    const openai = getOpenAIClient()

    // GPT-4.1を使用してフィードバック生成
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: `あなたはロールプレイの評価エージェントです。
与えられた評価プロンプトに基づいて、会話ログを分析し、フィードバックを提供してください。

出力は必ず以下のJSON形式で返してください：
{
  "score": 0-100の数値（総合スコア）,
  "feedback": "総評コメント（改行を含む文字列）",
  "details": [
    {
      "name": "評価項目名",
      "score": 0-100の数値,
      "comment": "項目ごとのコメント"
    }
  ]
}

JSONのみを出力し、他のテキストは含めないでください。`
        },
        {
          role: 'user',
          content: `以下の評価プロンプトに基づいて、会話ログを評価してください。

【評価プロンプト】
${evaluationPrompt}

【会話ログ】
${transcript}

上記の会話を評価し、JSON形式でフィードバックを返してください。`
        }
      ]
    })

    const content = response.choices[0]?.message?.content || ''
    console.log('📊 Raw response:', content)

    // JSONをパース
    let result: GenerateFeedbackResponse
    try {
      // JSONブロックを抽出（```json ... ``` で囲まれている場合も対応）
      let jsonStr = content
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      } else {
        // JSONオブジェクトを直接探す
        const objectMatch = content.match(/\{[\s\S]*\}/)
        if (objectMatch) {
          jsonStr = objectMatch[0]
        }
      }

      result = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      // パースに失敗した場合はデフォルト値を返す
      result = {
        score: 50,
        feedback: content || 'フィードバックの解析に失敗しました。',
        details: []
      }
    }

    // スコアの範囲を0-100に制限
    result.score = Math.max(0, Math.min(100, result.score || 0))
    if (result.details) {
      result.details = result.details.map(d => ({
        ...d,
        score: Math.max(0, Math.min(100, d.score || 0))
      }))
    }

    console.log('✅ Feedback generated:', result.score)
    return result

  } catch (error: any) {
    console.error('❌ Generate Feedback API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `フィードバック生成エラー: ${error.message || 'Unknown error'}`
    })
  }
})
