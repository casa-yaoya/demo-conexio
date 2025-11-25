import { promises as fs } from 'fs'
import path from 'path'

export async function loadPrompt(promptName: string): Promise<string> {
  try {
    // Handle both with and without .md extension
    const fileName = promptName.endsWith('.md') ? promptName : `${promptName}.md`
    const promptPath = path.join(process.cwd(), 'public', 'prompts', fileName)
    return await fs.readFile(promptPath, 'utf-8')
  } catch (error) {
    console.error(`プロンプト読み込みエラー (${promptName}):`, error)
    return ''
  }
}
