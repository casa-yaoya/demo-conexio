<template>
  <div class="session-result">
    <!-- セッション情報（横1行） -->
    <div class="result-info-row">
      <div class="info-item">
        <span class="info-label">スコア</span>
        <span class="info-value" :class="getScoreClass(score)">{{ score }}点</span>
      </div>
      <div class="info-item">
        <span class="info-label">プレイ時間</span>
        <span class="info-value">{{ formatTime(playTime) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">発話時間</span>
        <span class="info-value">{{ formatTime(speechTime) }}</span>
      </div>
    </div>

    <!-- フィードバック -->
    <div class="result-section">
      <div class="section-header">
        <UIcon name="i-lucide-clipboard-check" class="section-icon" />
        フィードバック
      </div>
      <div class="feedback-container">
        <div class="feedback-content" v-if="feedback">
          <p v-html="feedback"></p>
        </div>
        <div class="feedback-content dummy" v-else>
          <p class="dummy-text">フィードバックはまだありません</p>
        </div>
      </div>
    </div>

    <!-- 会話記録 -->
    <div class="result-section">
      <div class="section-header">
        <UIcon name="i-lucide-message-circle" class="section-icon" />
        会話記録
      </div>
      <div class="transcript-container">
        <div class="transcript-messages" v-if="transcript.length > 0">
          <div
            v-for="(message, index) in transcript"
            :key="index"
            class="transcript-message"
            :class="message.role"
          >
            <div class="message-avatar">
              <UIcon :name="message.role === 'ai' ? 'i-lucide-bot' : 'i-lucide-user'" class="avatar-icon" />
            </div>
            <div class="message-bubble">
              <p>{{ message.content }}</p>
            </div>
          </div>
        </div>
        <div class="transcript-messages dummy" v-else>
          <!-- ダミーデータ表示 -->
          <div class="transcript-message ai">
            <div class="message-avatar">
              <UIcon name="i-lucide-bot" class="avatar-icon" />
            </div>
            <div class="message-bubble">
              <p>あああああああああああああああああああああああ</p>
            </div>
          </div>
          <div class="transcript-message user">
            <div class="message-bubble">
              <p>いいいいいいいいいいいいいいいいいいいいいい</p>
            </div>
            <div class="message-avatar">
              <UIcon name="i-lucide-user" class="avatar-icon" />
            </div>
          </div>
          <div class="transcript-message ai">
            <div class="message-avatar">
              <UIcon name="i-lucide-bot" class="avatar-icon" />
            </div>
            <div class="message-bubble">
              <p>うううううううううううううううううううううううううううううう</p>
            </div>
          </div>
          <div class="transcript-message user">
            <div class="message-bubble">
              <p>えええええええええええええええええ</p>
            </div>
            <div class="message-avatar">
              <UIcon name="i-lucide-user" class="avatar-icon" />
            </div>
          </div>
          <div class="transcript-message ai">
            <div class="message-avatar">
              <UIcon name="i-lucide-bot" class="avatar-icon" />
            </div>
            <div class="message-bubble">
              <p>おおおおおおおおおおおおおおおおおおおおおおおおお</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TranscriptMessage {
  role: 'ai' | 'user'
  content: string
}

withDefaults(defineProps<{
  score: number
  playTime: number
  speechTime: number
  feedback?: string
  transcript?: TranscriptMessage[]
}>(), {
  score: 0,
  playTime: 0,
  speechTime: 0,
  feedback: '',
  transcript: () => []
})

// スコアに応じたクラスを取得
const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 70) return 'score-good'
  if (score >= 50) return 'score-average'
  return 'score-low'
}

// 時間フォーマット
const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}秒`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}
</script>

<style scoped>
.session-result {
  padding: 16px;
  background: var(--ui-bg);
}

/* 結果情報（横1行） */
.result-info-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 18px;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-muted);
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--ui-text);
}

/* スコア色分け */
.score-excellent { color: #10b981; }
.score-good { color: #0ea5e9; }
.score-average { color: #f59e0b; }
.score-low { color: #ef4444; }

/* セクション共通 */
.result-section {
  margin-bottom: 20px;
}

.result-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-text);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ui-border);
}

.section-icon {
  font-size: 16px;
  color: var(--ui-primary);
}

/* フィードバック */
.feedback-container {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  padding: 14px;
}

.feedback-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--ui-text);
}

.feedback-content p {
  margin: 0;
}

.feedback-content.dummy .dummy-text {
  color: var(--ui-text-muted);
  font-style: italic;
}

/* 会話記録 */
.transcript-container {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  padding: 14px;
  max-height: 400px;
  overflow-y: auto;
}

.transcript-messages {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.transcript-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.transcript-message.user {
  justify-content: flex-end;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.transcript-message.ai .message-avatar {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.transcript-message.user .message-avatar {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.avatar-icon {
  font-size: 16px;
  color: white;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
}

.transcript-message.ai .message-bubble {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-top-left-radius: 4px;
}

.transcript-message.user .message-bubble {
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  border-top-right-radius: 4px;
}

.transcript-messages.dummy .message-bubble {
  color: var(--ui-text-muted);
  font-style: italic;
}

.message-bubble p {
  margin: 0;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .result-info-row {
    flex-wrap: wrap;
    gap: 12px;
  }

  .info-item {
    min-width: calc(50% - 6px);
  }

  .message-bubble {
    max-width: 85%;
  }
}

@media (max-width: 480px) {
  .info-item {
    min-width: 100%;
    justify-content: space-between;
  }
}
</style>
