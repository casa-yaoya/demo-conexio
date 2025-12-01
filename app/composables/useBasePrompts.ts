/**
 * 合成プロンプト構成要素定義
 *
 * プロンプトは4層構造で合成される:
 * ①モード毎の固定指示: モード別の基本指示文
 * ②人格設定: キャラクター設定（「あなたの設定：」として追加）
 * ③流れ設定: 話し方・終了条件などの設定
 * ④内容設定: ポイント・台本などのトレーニング内容
 */

import { getConfirmationFlowTemplate } from './confirmationFlowTemplates'

export interface BasePromptDefinition {
  key: string
  label: string
  prompt: string
}

/**
 * 流れ設定用の設定値
 */
export interface FlowSettings {
  speakingStyle: 'friendly' | 'polite' | 'strict'
  maxTurnCount: number
  endOnCall: boolean
  incorrectResponseType?: 'show-answer' | 'hint-retry' | 'no-hint-retry' | 'ignore-move-on'
}

// 後方互換性のためのエイリアス
export type PromptGenSettings = FlowSettings

/**
 * ①モード毎の固定指示
 */
export const MODE_INSTRUCTIONS: Record<string, string> = {
  'confirmation': 'あなたは先生の役として、相手が理解しているかを確認して。（問）と（正解）の組み合わせのリストを与えるので、これを元に、１つずつ問いかけて。',
  'practice': 'あなたはお客様を演じ、以下に示す役割を演じて。話し相手は、内容の文脈によって変わるが、営業マンや、接客スタッフなどである。',
  'ai-demo': 'あなたは優秀なスタッフとして、以下に指示される内容を解釈し、お客様相手に会話して。',
  'subtitle': 'あなたはお客様として、相手の会話相手をして。ただし、あなたの発言は全て、下記に示される台本の通り、一語一句同じ内容を話して。相手の発言が、台本通りでなかったとしても、無視して自分のターンでは自分の発言を台本通りにして。'
}

// 後方互換性のためのエイリアス
export const BASE_PROMPTS = MODE_INSTRUCTIONS

/**
 * モード別固定指示定義（詳細情報付き）
 */
export const MODE_INSTRUCTION_DEFINITIONS: BasePromptDefinition[] = [
  {
    key: 'confirmation',
    label: '確認モード',
    prompt: MODE_INSTRUCTIONS['confirmation']
  },
  {
    key: 'practice',
    label: '実践モード',
    prompt: MODE_INSTRUCTIONS['practice']
  },
  {
    key: 'ai-demo',
    label: 'お手本モード',
    prompt: MODE_INSTRUCTIONS['ai-demo']
  },
  {
    key: 'subtitle',
    label: '台本モード',
    prompt: MODE_INSTRUCTIONS['subtitle']
  }
]

// 後方互換性のためのエイリアス
export const BASE_PROMPT_DEFINITIONS = MODE_INSTRUCTION_DEFINITIONS

/**
 * ③流れ設定の詳細テンプレート
 * 話し方スタイル別の詳細説明
 */
export const SPEAKING_STYLE_DETAILS: Record<string, string> = {
  'friendly': `◆話し方◆
端的に、伝えるべき内容を短く最低限で伝える。
タメ口だが、優しい話し方。
問いは、書かれている内容をそのまま使うこと。`,

  'polite': `◆話し方◆
端的に、伝えるべき内容を短く最低限で伝える。
敬語で、優しい話し方。間違えても励ましてくれる。
ただし、同じ内容の発言は繰り返さない。
問いは、書かれている内容をそのまま使うこと。`,

  'strict': `◆話し方◆
端的に、伝えるべき内容を短く最低限で伝える。
タメ口で、厳しく、気合をいれてくる。命令口調。
問いは、書かれている内容をそのまま使うこと。`
}

/**
 * ③流れ設定プロンプト生成
 * ポップアップの設定値から、流れ設定テキストを生成する
 */
export function generateFlowSettingsPrompt(modeKey: string, settings: FlowSettings): string {
  const parts: string[] = []

  // 話し方の詳細設定
  if (settings.speakingStyle && SPEAKING_STYLE_DETAILS[settings.speakingStyle]) {
    parts.push(SPEAKING_STYLE_DETAILS[settings.speakingStyle])
  }

  // 終了条件の設定
  if (settings.maxTurnCount > 0) {
    parts.push(`◆終了条件◆\n会話は${settings.maxTurnCount}ターンを上限として終了して。`)
  }
  if (settings.endOnCall) {
    if (parts.length > 0 && !parts[parts.length - 1].includes('◆終了条件◆')) {
      parts.push('◆終了条件◆')
    }
    parts.push('プレイヤーまたはあなたが「会話終了」などの終了コールをした場合は、その時点で会話を終了して。')
  }

  // 確認モード専用: 進行フロー（不正解時の反応を含む）
  if (modeKey === 'confirmation' && settings.incorrectResponseType) {
    const flowTemplate = getConfirmationFlowTemplate(settings.incorrectResponseType)
    if (flowTemplate) {
      parts.push(flowTemplate)
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : ''
}

// 後方互換性のためのエイリアス
export const generateSettingsPrompt = generateFlowSettingsPrompt

/**
 * プロンプト関連ユーティリティ composable
 */
export function useBasePrompts() {
  /**
   * ①モードキーから固定指示を取得
   */
  const getModeInstruction = (modeKey: string): string => {
    return MODE_INSTRUCTIONS[modeKey] || ''
  }

  // 後方互換性のためのエイリアス
  const getBasePrompt = getModeInstruction

  /**
   * ③流れ設定プロンプトを生成
   */
  const getFlowSettingsPrompt = (modeKey: string, settings: FlowSettings): string => {
    return generateFlowSettingsPrompt(modeKey, settings)
  }

  // 後方互換性のためのエイリアス
  const getSettingsPrompt = getFlowSettingsPrompt

  /**
   * モードキーからラベルを取得
   */
  const getModeLabel = (modeKey: string): string => {
    const definition = MODE_INSTRUCTION_DEFINITIONS.find(d => d.key === modeKey)
    return definition?.label || modeKey
  }

  /**
   * 全モード固定指示定義を取得
   */
  const getAllModeInstructions = (): BasePromptDefinition[] => {
    return MODE_INSTRUCTION_DEFINITIONS
  }

  // 後方互換性のためのエイリアス
  const getAllBasePrompts = getAllModeInstructions

  return {
    // 新しいネーミング
    MODE_INSTRUCTIONS,
    MODE_INSTRUCTION_DEFINITIONS,
    SPEAKING_STYLE_DETAILS,
    getModeInstruction,
    getFlowSettingsPrompt,
    getAllModeInstructions,
    // 後方互換性
    BASE_PROMPTS,
    BASE_PROMPT_DEFINITIONS,
    getBasePrompt,
    getSettingsPrompt,
    getModeLabel,
    getAllBasePrompts
  }
}
