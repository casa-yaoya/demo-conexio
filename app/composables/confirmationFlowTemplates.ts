/**
 * 確認モード専用：不正解時の反応フローテンプレート
 *
 * 確認モードでのみ使用される、不正解時の反応パターン。
 * 流れ設定の一部として合成プロンプトに追加される。
 */

export interface ConfirmationFlowTemplate {
  key: string
  label: string
  template: string
}

/**
 * 不正解時の反応テンプレート定義
 */
export const CONFIRMATION_FLOW_TEMPLATES: Record<string, ConfirmationFlowTemplate> = {
  'show-answer': {
    key: 'show-answer',
    label: '正解を教えて、次にすすむ',
    template: `◆進行フロー◆
（１）問いかけを行う。
（２）回答に対し、以下の分岐でフィードバックする。
・正解であると判定→正解！と言った後、一言だけフィードバックをして、次の問へ。
・不足や誤りがあり、正解でないと判定→不足や誤りがある部分を指摘し、正解を教え、次の問へ。
・相手がまじめに回答していない、何もいっていない等と判定→もう一度いうね、といって、問を繰り返す。
（３）全ての問が終わったら、会話終了。`
  },

  'hint-retry': {
    key: 'hint-retry',
    label: 'ヒントを出して、もう一度',
    template: `◆進行フロー◆
（１）問いかけを行う。
（２）回答に対し、以下の分岐でフィードバックする。
・正解であると判定→正解！と言った後、一言だけフィードバックをして、次の問へ。
・回答に不足や誤りがあると判断した場合→できるだけ正解を伝えないように不足や誤りがある箇所のみを指摘し、もう一度回答させる。２回きいてだめなら、正解を教えて、次の問へ。
・相手がまじめに回答していない、何もいっていない等と判定→もう一度いうね、といって、問を繰り返す。
（３）全ての問が終わったら、会話終了。`
  },

  'no-hint-retry': {
    key: 'no-hint-retry',
    label: 'ヒントを出さずに、もう一度',
    template: `◆進行フロー◆
（１）問いかけを行う。
（２）回答に対し、以下の分岐でフィードバックする。
・正解であると判定→正解！と言った後、一言だけフィードバックをして、次の問へ。
・回答に不足や誤りがあると判定→内容に応じて、「不足があるね、どう？」「誤りがあるね、どう？」のどちらかを言う。２回聞いても正解がでない場合、模範回答を教えて、次の問へ。
・相手がまじめに回答していない、何もいっていない等と判定→もう一度いうね、といって、問を繰り返す。
（３）全ての問が終わったら、会話終了。`
  },

  'ignore-move-on': {
    key: 'ignore-move-on',
    label: '不正解に触れず、自然な流れで',
    template: `◆進行フロー◆
（１）問いかけを行う。
（２）回答に対し、以下の分岐でフィードバックする。
・なんらかの回答があったと判定→相槌をうち、次の問へ。
・相手がまじめに回答していない、何もいっていない等と判定→もう一度いうね、といって、問を繰り返す。
（３）全ての問が終わったら、会話終了。`
  }
}

/**
 * キーからテンプレートを取得
 */
export function getConfirmationFlowTemplate(key: string): string {
  return CONFIRMATION_FLOW_TEMPLATES[key]?.template || ''
}

/**
 * 全テンプレート定義を取得（UI用）
 */
export function getAllConfirmationFlowTemplates(): ConfirmationFlowTemplate[] {
  return Object.values(CONFIRMATION_FLOW_TEMPLATES)
}
