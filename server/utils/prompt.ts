import { promises as fs } from 'fs'
import path from 'path'

// プロンプトカテゴリの定義
type PromptCategory = 'chat' | 'generation' | 'runtime' | 'evaluation' | 'agent'

// プロンプト名からカテゴリとファイル名へのマッピング
const PROMPT_MAPPING: Record<string, { category: PromptCategory; file: string }> = {
  // チャット系
  'design-assistant': { category: 'chat', file: 'design-assistant.md' },
  'roleplay-support-agent': { category: 'chat', file: 'design-assistant.md' }, // 後方互換性
  'file-upload-handler': { category: 'chat', file: 'file-upload-handler.md' },
  'roleplay-chat': { category: 'chat', file: 'file-upload-handler.md' }, // 後方互換性

  // 生成系（台本）
  'script-subtitle': { category: 'generation', file: 'script-subtitle.md' },
  'script-generation-subtitle': { category: 'generation', file: 'script-subtitle.md' }, // 後方互換性
  'script-points': { category: 'generation', file: 'script-points.md' },
  'script-generation-points': { category: 'generation', file: 'script-points.md' }, // 後方互換性
  'script-practice': { category: 'generation', file: 'script-practice.md' },
  'script-generation-practice': { category: 'generation', file: 'script-practice.md' }, // 後方互換性

  // 実行時（音声会話用）
  'mode-subtitle': { category: 'runtime', file: 'mode-subtitle.md' },
  'system-prompt-subtitle-mode': { category: 'runtime', file: 'mode-subtitle.md' }, // 後方互換性
  'mode-demo': { category: 'runtime', file: 'mode-demo.md' },
  'system-prompt-aiDemo-mode': { category: 'runtime', file: 'mode-demo.md' }, // 後方互換性
  'mode-confirmation': { category: 'runtime', file: 'mode-confirmation.md' },
  'system-prompt-confirmation-mode': { category: 'runtime', file: 'mode-confirmation.md' }, // 後方互換性
  'mode-practice': { category: 'runtime', file: 'mode-practice.md' },
  'system-prompt-practice-mode': { category: 'runtime', file: 'mode-practice.md' }, // 後方互換性

  // 評価系
  'feedback': { category: 'evaluation', file: 'feedback.md' },
  'feedback-prompt': { category: 'evaluation', file: 'feedback.md' }, // 後方互換性

  // エージェント系（Responses API用）
  'agent-design-assistant': { category: 'agent', file: 'design-assistant.md' },
  'agent-script-generator': { category: 'agent', file: 'script-generator.md' },
  'agent-content-analyzer': { category: 'agent', file: 'content-analyzer.md' },
}

/**
 * プロンプトファイルを読み込む
 * @param promptName プロンプト名（新旧どちらの命名規則でも対応）
 * @returns プロンプト文字列
 */
export async function loadPrompt(promptName: string): Promise<string> {
  try {
    const mapping = PROMPT_MAPPING[promptName]

    let promptPath: string
    if (mapping) {
      // マッピングが存在する場合は新しい構成のパスを使用
      promptPath = path.join(process.cwd(), 'prompts', mapping.category, mapping.file)
    } else {
      // マッピングにない場合は旧来の方式でフォールバック
      const fileName = promptName.endsWith('.md') ? promptName : `${promptName}.md`
      promptPath = path.join(process.cwd(), 'prompts', fileName)
    }

    const content = await fs.readFile(promptPath, 'utf-8')

    // プロンプトセクションのみを抽出（```で囲まれた部分）
    return extractPromptContent(content)
  } catch (error) {
    console.error(`プロンプト読み込みエラー (${promptName}):`, error)
    return ''
  }
}

/**
 * カテゴリを指定してプロンプトを読み込む
 * @param category プロンプトカテゴリ
 * @param fileName ファイル名
 * @returns プロンプト文字列
 */
export async function loadPromptByCategory(category: PromptCategory, fileName: string): Promise<string> {
  try {
    const file = fileName.endsWith('.md') ? fileName : `${fileName}.md`
    const promptPath = path.join(process.cwd(), 'prompts', category, file)
    const content = await fs.readFile(promptPath, 'utf-8')
    return extractPromptContent(content)
  } catch (error) {
    console.error(`プロンプト読み込みエラー (${category}/${fileName}):`, error)
    return ''
  }
}

/**
 * Markdownファイルからプロンプト本文を抽出
 * ## プロンプト または ## プロンプトテンプレート セクション内の```で囲まれた部分を取得
 */
function extractPromptContent(markdown: string): string {
  // プロンプトセクションを探す
  const promptSectionMatch = markdown.match(/## プロンプト(?:テンプレート)?\s*\n([\s\S]*?)(?=\n## |$)/)

  if (promptSectionMatch) {
    const section = promptSectionMatch[1]
    // ```で囲まれた部分を抽出
    const codeBlockMatch = section.match(/```\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim()
    }
  }

  // セクションが見つからない場合はファイル全体を返す（旧形式対応）
  return markdown.trim()
}

/**
 * プロンプト内の変数を置換する
 * @param template プロンプトテンプレート
 * @param variables 変数のマップ
 * @returns 置換後のプロンプト
 */
export function replacePromptVariables(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, value)
  }
  return result
}
