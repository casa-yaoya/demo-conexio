<template>
  <div class="prompts-page">
    <div class="page-header">
      <h1 class="page-title">プロンプト管理</h1>
      <p class="page-description">フローをクリックすると処理詳細とプロンプトを表示</p>
    </div>

    <!-- フロー1: ロープレ構築まで -->
    <div class="flow-section">
      <div class="flow-section-header">
        <span class="flow-section-number">1</span>
        <span class="flow-section-title">ロープレ構築</span>
      </div>
      <div class="flow-container">
        <div class="flow-line">
          <!-- ファイルアップロード -->
          <div class="flow-node flow-node-start" @click="openPopup('upload')">
            <div class="node-header">
              <span class="node-icon">📁</span>
              <span class="node-label">アップロード</span>
            </div>
            <div class="node-desc">ファイルをドロップ</div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- ファイル形式分岐 -->
          <div class="flow-branch-vertical">
            <div class="branch-header">形式判定</div>
            <div class="branch-items-vertical">
              <div class="flow-node-mini" @click="openPopup('pdf')">
                <span class="node-icon-mini">📑</span>
                <span class="node-label-mini">PDF</span>
                <span class="node-api api-openai">GPT-4o</span>
              </div>
              <div class="flow-node-mini" @click="openPopup('excel')">
                <span class="node-icon-mini">📊</span>
                <span class="node-label-mini">Excel</span>
                <span class="node-api api-lib">xlsx</span>
              </div>
              <div class="flow-node-mini" @click="openPopup('pptx')">
                <span class="node-icon-mini">📝</span>
                <span class="node-label-mini">PPTX/Word</span>
                <span class="node-api api-lib">JSZip</span>
              </div>
              <div class="flow-node-mini" @click="openPopup('audio')">
                <span class="node-icon-mini">🎵</span>
                <span class="node-label-mini">音声</span>
                <span class="node-api api-openai">Whisper</span>
              </div>
              <div class="flow-node-mini" @click="openPopup('video')">
                <span class="node-icon-mini">🎬</span>
                <span class="node-label-mini">動画</span>
                <span class="node-api api-openai">Whisper</span>
              </div>
            </div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- 範囲選択 -->
          <div class="flow-node flow-node-question" @click="openPopup('range')">
            <div class="node-header">
              <span class="node-icon">📐</span>
              <span class="node-label">範囲選択</span>
            </div>
            <div class="node-desc">ページ/シート指定</div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- 種別選択 -->
          <div class="flow-node flow-node-question" @click="openPopup('type')">
            <div class="node-header">
              <span class="node-icon">🏷️</span>
              <span class="node-label">種別選択</span>
            </div>
            <div class="node-desc">見本/教材/自社/顧客</div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- ゴール選択 -->
          <div class="flow-node flow-node-question" @click="openPopup('goal')">
            <div class="node-header">
              <span class="node-icon">🎯</span>
              <span class="node-label">ゴール選択</span>
            </div>
            <div class="node-desc">暗記/切り返し/ヒアリング</div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- ロープレ構築 -->
          <div class="flow-node flow-node-ai" @click="openPopup('build')">
            <div class="node-header">
              <span class="node-icon">🤖</span>
              <span class="node-label">ロープレ構築</span>
              <span class="node-api api-responses">Responses API</span>
            </div>
            <div class="node-desc">ポイント抽出・台本生成</div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- 完了 -->
          <div class="flow-node flow-node-end">
            <div class="node-header">
              <span class="node-icon">✅</span>
              <span class="node-label">構築完了</span>
            </div>
            <div class="node-desc">設計パネルに表示</div>
          </div>
        </div>
      </div>
    </div>

    <!-- フロー2: ロープレ実行 -->
    <div class="flow-section">
      <div class="flow-section-header">
        <span class="flow-section-number">2</span>
        <span class="flow-section-title">ロープレ実行</span>
      </div>
      <div class="flow-container">
        <div class="flow-line">
          <!-- モード選択 -->
          <div class="flow-branch-vertical">
            <div class="branch-header">モード選択</div>
            <div class="branch-items-vertical">
              <div class="flow-node-mini flow-node-mode" @click="openPopup('mode-subtitle')">
                <span class="node-icon-mini">📖</span>
                <span class="node-label-mini">台本モード</span>
                <span class="node-desc-mini">字幕を読み上げ</span>
              </div>
              <div class="flow-node-mini flow-node-mode" @click="openPopup('mode-demo')">
                <span class="node-icon-mini">✨</span>
                <span class="node-label-mini">お手本モード</span>
                <span class="node-desc-mini">AIがお手本実演</span>
              </div>
              <div class="flow-node-mini flow-node-mode" @click="openPopup('mode-confirmation')">
                <span class="node-icon-mini">✅</span>
                <span class="node-label-mini">確認モード</span>
                <span class="node-desc-mini">Q&Aで理解度確認</span>
              </div>
              <div class="flow-node-mini flow-node-mode" @click="openPopup('mode-practice')">
                <span class="node-icon-mini">👔</span>
                <span class="node-label-mini">実践モード</span>
                <span class="node-desc-mini">難しい顧客役</span>
              </div>
            </div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- 音声会話 -->
          <div class="flow-node flow-node-realtime" @click="openPopup('realtime')">
            <div class="node-header">
              <span class="node-icon">🎤</span>
              <span class="node-label">音声会話</span>
              <span class="node-api api-realtime">Realtime API</span>
            </div>
            <div class="node-desc">リアルタイム音声認識・合成</div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- 会話ログ -->
          <div class="flow-node flow-node-data">
            <div class="node-header">
              <span class="node-icon">💬</span>
              <span class="node-label">会話ログ</span>
            </div>
            <div class="node-desc">全発話を記録</div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- フィードバック生成 -->
          <div class="flow-node flow-node-ai" @click="openPopup('feedback')">
            <div class="node-header">
              <span class="node-icon">📊</span>
              <span class="node-label">評価生成</span>
              <span class="node-api api-responses">Responses API</span>
            </div>
            <div class="node-desc">100点満点で採点</div>
          </div>

          <div class="flow-arrow">→</div>

          <!-- 結果表示 -->
          <div class="flow-node flow-node-end" @click="openPopup('result')">
            <div class="node-header">
              <span class="node-icon">🏆</span>
              <span class="node-label">結果表示</span>
            </div>
            <div class="node-desc">スコア・改善点</div>
          </div>
        </div>
      </div>
    </div>

    <!-- API凡例 -->
    <div class="api-legend">
      <span class="legend-title">使用API:</span>
      <span class="legend-item"><span class="node-api api-openai">GPT-4o</span> OpenAI Vision/Whisper</span>
      <span class="legend-item"><span class="node-api api-lib">lib</span> ライブラリ処理</span>
      <span class="legend-item"><span class="node-api api-responses">Responses</span> Responses API (gpt-4.1)</span>
      <span class="legend-item"><span class="node-api api-realtime">Realtime</span> Realtime API</span>
    </div>

    <!-- ポップアップ -->
    <UModal v-model:open="showPopup" :title="popupTitle">
      <template #body>
        <div class="popup-content">
          <div class="popup-section">
            <h4 class="popup-section-title">処理概要</h4>
            <p class="popup-description">{{ popupDescription }}</p>
          </div>

          <div v-if="popupApi" class="popup-section">
            <h4 class="popup-section-title">使用API</h4>
            <UBadge :color="getApiColor(popupApi)" variant="subtle">{{ popupApi }}</UBadge>
          </div>

          <div v-if="popupPrompt" class="popup-section">
            <h4 class="popup-section-title">
              プロンプト
              <UButton
                variant="ghost"
                size="xs"
                icon="i-lucide-copy"
                class="popup-copy-btn"
                @click="copyPrompt"
              />
            </h4>
            <textarea
              v-model="popupPrompt"
              class="popup-prompt-textarea"
              :rows="15"
            />
          </div>

          <div v-if="popupFilePath" class="popup-section">
            <span class="popup-file-path">{{ popupFilePath }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="popup-footer">
          <UButton variant="ghost" color="neutral" @click="showPopup = false">閉じる</UButton>
          <UButton v-if="popupPrompt" color="primary" @click="savePrompt">保存</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const showPopup = ref(false)
const popupTitle = ref('')
const popupDescription = ref('')
const popupApi = ref('')
const popupPrompt = ref('')
const popupFilePath = ref('')
const currentNodeId = ref('')

interface NodeInfo {
  title: string
  description: string
  api?: string
  filePath?: string
  prompt?: string
}

const nodeInfoMap: Record<string, NodeInfo> = {
  'upload': {
    title: 'ファイルアップロード',
    description: 'ユーザーがファイルをドラッグ&ドロップまたは選択してアップロードします。\n\n対応形式:\n- PDF\n- Excel (.xlsx, .xls)\n- PowerPoint (.pptx)\n- Word (.docx)\n- 音声 (MP3, WAV, M4A)\n- 動画 (MP4, MOV, WebM)\n- テキスト (.txt)',
  },
  'pdf': {
    title: 'PDF処理',
    description: 'PDFを画像として読み取り、GPT-4oのビジョン機能でテキストを抽出します。図表やレイアウトも理解して構造化されたテキストに変換します。',
    api: 'OpenAI API (GPT-4o Vision)',
    filePath: 'server/api/analyze.post.ts',
    prompt: `PDFの各ページを画像として処理し、以下の指示に従ってテキストを抽出してください：

1. ページの内容を正確に読み取る
2. 見出し、本文、リストなどの構造を維持
3. 図表がある場合は、その内容を説明
4. 重要なキーワードやポイントを識別

出力形式：
- ページごとに区切って出力
- マークダウン形式で構造化`
  },
  'excel': {
    title: 'Excel処理',
    description: 'xlsx.jsライブラリを使用してExcelファイルを解析し、各シートのデータをCSV形式に変換します。\n\nAIは使用せず、ローカルで処理します。',
    api: 'ライブラリ (xlsx.js)',
    filePath: 'server/utils/fileParser.ts'
  },
  'pptx': {
    title: 'PowerPoint / Word処理',
    description: 'JSZipライブラリでOOXML形式のファイルを解凍し、XMLからテキストを抽出します。\n\nスライドごと・段落ごとに構造化されたテキストを取得します。AIは使用しません。',
    api: 'ライブラリ (JSZip)',
    filePath: 'server/utils/fileParser.ts'
  },
  'audio': {
    title: '音声処理',
    description: 'OpenAI Whisper APIを使用して音声ファイルを文字起こしします。\n\n日本語に最適化されており、高精度なテキスト変換が可能です。',
    api: 'OpenAI API (Whisper)',
    filePath: 'server/api/upload.post.ts'
  },
  'video': {
    title: '動画処理',
    description: '動画ファイルから音声トラックを抽出し、OpenAI Whisper APIで文字起こしを行います。\n\n長時間の動画も対応可能です。',
    api: 'OpenAI API (Whisper)',
    filePath: 'server/api/upload.post.ts'
  },
  'range': {
    title: '範囲選択',
    description: 'ファイルの中から使用する範囲を選択します。不要な部分を除外することで、より精度の高いロープレ構築が可能になります。\n\n選択方法:\n- PDF/PPTX: ページ/スライド番号\n- Excel: シート名\n- 全部: すべて使用',
  },
  'type': {
    title: 'データ種別選択',
    description: 'アップロードしたファイルの種類を選択します。種別に応じて最適な処理方法が適用されます。\n\n種別:\n- 見本データ: お手本の会話や台本\n- 教材データ: 学習内容や資料\n- 自社データ: 商品・サービス情報\n- 顧客データ: 顧客・取引先情報',
  },
  'goal': {
    title: 'ゴール選択',
    description: 'ロープレで達成したい目標を選択します。選択したゴールに応じて台本やプロンプトが最適化されます。\n\nゴール:\n- 暗記: 基本フレーズを覚える\n- 切り返し: 反論への対応力\n- ヒアリング: 情報引き出し力\n- 話し方: トーンや表現力',
  },
  'build': {
    title: 'ロープレ構築',
    description: 'OpenAI Responses APIを使用して、アップロードされたデータとゴールに基づいてロープレを構築します。\n\n処理内容:\n1. ファイル内容から重要ポイントを抽出\n2. ゴールに応じた学習ポイントを整理\n3. 各モード用の台本・プロンプトを生成',
    api: 'OpenAI Responses API (gpt-4.1)',
    filePath: 'server/api/agent/chat.post.ts',
    prompt: `あなたはロープレ（ロールプレイング）学習コンテンツを作成するアシスタントです。

## 役割
ユーザーがアップロードしたファイルと選択したゴールに基づいて、効果的なロープレ設計を行います。

## 処理内容
1. ファイル内容から重要ポイントを抽出
2. ゴールに応じた学習ポイントを整理
3. 各モード用の台本・プロンプトを生成

## 出力形式
- ポイント一覧（Q&A形式）
- 概要（ロープレの目的と流れ）
- 各モード用台本`
  },
  'mode-subtitle': {
    title: '台本モード',
    description: 'ユーザーが台本を読み上げ、AIが正しく話せているかチェックします。\n\nお手本の流れを学ぶ学習モードです。間違いがあれば優しく指摘し、再チャレンジを促します。',
    api: 'OpenAI Realtime API',
    filePath: 'prompts/runtime/mode-subtitle.md',
    prompt: `あなたは台本チェックの先生です。

## あなたの役割
ユーザーが台本通りに話せているかをチェックします。

## 動作
- ユーザーの発言を台本と比較
- 正しく話せていれば次に進む
- 間違いがあれば優しく指摘して再度チャレンジを促す

## 話し方
- 優しく励ましながら進行
- 間違いを恐れさせない雰囲気作り
- 成功時は具体的に褒める`
  },
  'mode-demo': {
    title: 'お手本モード',
    description: 'AIが先生役として模範的な営業トークを実演します。\n\nユーザーは顧客役として参加し、プロの対応を学びます。',
    api: 'OpenAI Realtime API',
    filePath: 'prompts/runtime/mode-demo.md',
    prompt: `あなたはお手本を見せる先生です。

## あなたの役割
ユーザーに営業トークのお手本を見せます。ユーザーは顧客役を演じます。

## 動作
- プロとしての模範的な対応を見せる
- 質問の仕方、提案の仕方のお手本を実演
- ユーザー（顧客役）の反応に柔軟に対応

## 話し方
- プロフェッショナルで丁寧
- 自然な会話の流れを重視
- 学習ポイントが伝わるように意識`
  },
  'mode-confirmation': {
    title: '確認モード',
    description: 'AIがQ&A形式でユーザーの理解度を確認します。\n\nポイントごとに質問を投げかけ、理解が不足している部分を補足説明します。',
    api: 'OpenAI Realtime API',
    filePath: 'prompts/runtime/mode-confirmation.md',
    prompt: `あなたは理解度を確認する先生です。

## あなたの役割
Q&A形式でユーザーの理解度を確認します。

## 動作
- ポイントに基づいた質問を投げかける
- ユーザーの回答を評価
- 不足があれば補足説明

## 話し方
- 質問は明確に
- 回答への反応は具体的に
- 間違いも学びの機会として前向きに扱う`
  },
  'mode-practice': {
    title: '実践モード',
    description: 'AIが難しい顧客役として振る舞い、ユーザーの対応力を試します。\n\nリアルな営業シーンを想定した実践的なトレーニングです。',
    api: 'OpenAI Realtime API',
    filePath: 'prompts/runtime/mode-practice.md',
    prompt: `ロープレをしたいので、あなたはお客さん役として、以下に示す設定の役を演じてください。

## 話し方
- 敬語だが、少し高圧的な口調。淡々と話す
- 質問に回答する時は、単語や情報だけでなく、話し言葉で「かなぁ」等と話す
- 質問された事以外は答えないが、質問に附随する内容は教える
- 一回の発言は30文字以内で、簡潔に短く答える

### 口癖（毎回使うわけではない）
- うーん、
- まあ、
- ○○かなぁ。
- そうだねえ。
- いやー

## ロープレのクリア条件
相手はあなたに対してヒアリングの質問をします。
（最重要の目標）と（最重要の課題）の内容を全てヒアリングできていれば、ロープレクリアとして判定し、成功ステートに移ってください。`
  },
  'realtime': {
    title: '音声会話',
    description: 'OpenAI Realtime APIを使用して、リアルタイムの音声会話を実現します。\n\nユーザーの発話を即座に認識し、AIが自然な音声で応答します。WebSocketでサーバーと常時接続し、低遅延での会話を実現しています。',
    api: 'OpenAI Realtime API (gpt-4o-realtime-preview)',
    filePath: 'app/composables/useRealtimeAPI.ts'
  },
  'feedback': {
    title: '評価生成',
    description: '会話ログを分析し、100点満点で採点・評価を行います。\n\n各ポイントについて正答率を計算し、具体的な改善アドバイスを提供します。',
    api: 'OpenAI Responses API (gpt-4.1)',
    filePath: 'prompts/evaluation/feedback.md',
    prompt: `あなたはロープレ学習の評価を行う専門家です。

## あなたの役割
「あなた」（学習者）が以下のリストの問に対して、正解をヒントをもらわずに答えられているかで採点してください。

## 採点ルール
- 正解やヒントを相手からもらっているケースも多くありますが、この場合は減点または０点としてください
- 各問に対して採点を行い、全体で100点満点で整数値で採点してください

## 採点基準
- 各ポイントについて、自力で正解できている場合：満点
- 部分的に正解だが不足がある場合：50〜80%の点数
- ヒントをもらって答えた場合：20〜40%の点数
- 全く答えられなかった、または誤答の場合：0点`
  },
  'result': {
    title: '結果表示',
    description: 'ロープレの評価結果を表示します。\n\n表示内容:\n- 総合スコア（100点満点）\n- 各ポイントの達成度\n- 改善アドバイス\n\n結果は履歴として保存され、成長を追跡できます。',
  }
}

const openPopup = (nodeId: string) => {
  currentNodeId.value = nodeId
  const info = nodeInfoMap[nodeId]
  if (info) {
    popupTitle.value = info.title
    popupDescription.value = info.description
    popupApi.value = info.api || ''
    popupPrompt.value = info.prompt || ''
    popupFilePath.value = info.filePath || ''
    showPopup.value = true
  }
}

const getApiColor = (api: string) => {
  if (api.includes('Realtime')) return 'info'
  if (api.includes('Responses')) return 'success'
  if (api.includes('OpenAI')) return 'success'
  if (api.includes('Claude')) return 'orange'
  if (api.includes('ライブラリ')) return 'neutral'
  return 'neutral'
}

const copyPrompt = async () => {
  if (popupPrompt.value) {
    await navigator.clipboard.writeText(popupPrompt.value)
  }
}

const savePrompt = async () => {
  // TODO: サーバーにプロンプトを保存
  console.log('Saving prompt for:', currentNodeId.value, popupPrompt.value)
  showPopup.value = false
}
</script>

<style scoped>
.prompts-page {
  padding: 24px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  margin-bottom: 8px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.page-description {
  font-size: 13px;
  color: #64748b;
}

/* フローセクション */
.flow-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.flow-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.flow-section-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 14px;
  font-weight: 700;
  border-radius: 50%;
}

.flow-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

/* フローコンテナ */
.flow-container {
  padding: 24px;
  overflow-x: auto;
}

.flow-line {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: fit-content;
}

/* 標準ノード */
.flow-node {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 10px;
  background: white;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
}

.flow-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.node-icon {
  font-size: 18px;
}

.node-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.node-desc {
  font-size: 11px;
  color: #6b7280;
  padding-left: 26px;
}

/* ノードタイプ別 */
.flow-node-start {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.flow-node-end {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.flow-node-question {
  border-color: #8b5cf6;
  background: #faf5ff;
}

.flow-node-ai {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.flow-node-realtime {
  border-color: #0ea5e9;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.flow-node-data {
  border-color: #94a3b8;
  background: #f8fafc;
}

/* 矢印 */
.flow-arrow {
  color: #9ca3af;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
}

/* 縦分岐 */
.flow-branch-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}

.branch-header {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.branch-items-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ミニノード（分岐内） */
.flow-node-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.15s;
}

.flow-node-mini:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.flow-node-mini.flow-node-mode {
  border-left: 3px solid #3b82f6;
}

.node-icon-mini {
  font-size: 14px;
  flex-shrink: 0;
}

.node-label-mini {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
}

.node-desc-mini {
  font-size: 10px;
  color: #9ca3af;
  margin-left: auto;
}

/* APIバッジ */
.node-api {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
  margin-left: auto;
}

.api-openai {
  background: #dcfce7;
  color: #166534;
}

.api-lib {
  background: #f3f4f6;
  color: #6b7280;
}

.api-responses {
  background: #d1fae5;
  color: #065f46;
}

.api-realtime {
  background: #dbeafe;
  color: #1e40af;
}

/* API凡例 */
.api-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 11px;
  color: #64748b;
  flex-wrap: wrap;
}

.legend-title {
  font-weight: 600;
  color: #475569;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ポップアップ */
.popup-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.popup-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popup-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.popup-copy-btn {
  margin-left: auto;
}

.popup-description {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  margin: 0;
  white-space: pre-wrap;
}

.popup-prompt-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #334155;
  background: #f8fafc;
  resize: vertical;
}

.popup-prompt-textarea:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.popup-file-path {
  font-size: 11px;
  color: #94a3b8;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .prompts-page {
    padding: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .api-legend {
    gap: 8px;
  }

  .flow-node {
    min-width: 120px;
    padding: 10px 12px;
  }

  .node-label {
    font-size: 12px;
  }
}
</style>
