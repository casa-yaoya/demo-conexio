<template>
  <div>
    <!-- サマリービュー -->
    <div v-show="currentView === 'summary'" class="p-5">
      <div class="summary-container">
        <!-- Left Filters -->
        <div class="summary-filters">
          <div class="summary-filters-sticky">
            <div class="filter-panel">
              <div class="filter-title">レッスン絞り込み</div>
              <div class="hierarchy-filter">
                <button class="filter-button">レッスンを選択</button>
              </div>
            </div>

            <div class="filter-panel">
              <div class="filter-title">プレイヤー絞り込み</div>
              <div class="hierarchy-filter">
                <button class="filter-button">プレイヤーを選択</button>
              </div>
            </div>

            <div class="filter-panel">
              <div class="filter-title">期間絞り込み</div>
              <div class="date-filter">
                <input type="month" class="date-input">
                <span>〜</span>
                <input type="month" class="date-input">
              </div>
            </div>
          </div>
        </div>

        <!-- Right Content -->
        <div class="summary-content">
          <!-- Chart -->
          <div class="card mb-4">
            <canvas id="trendChart" height="80"></canvas>
          </div>

          <!-- Table -->
          <div class="card">
            <div class="mb-4 flex items-center gap-3">
              <label class="font-semibold text-sm text-gray-800">表示単位:</label>
              <select v-model="summaryDisplayUnit" class="select-input">
                <option value="lesson">レッスン</option>
                <option value="level">レベル</option>
                <option value="category">カテゴリー</option>
              </select>
            </div>
            <div class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr v-if="summaryDisplayUnit === 'lesson'">
                    <th>レッスン</th>
                    <th>プレイ数</th>
                    <th>平均スコア</th>
                  </tr>
                  <tr v-else-if="summaryDisplayUnit === 'level'">
                    <th>レベル</th>
                    <th>プレイ数</th>
                    <th>平均スコア</th>
                  </tr>
                  <tr v-else>
                    <th>カテゴリー</th>
                    <th>プレイ数</th>
                    <th>平均スコア</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="summaryData.length === 0">
                    <td colspan="3" class="text-center text-gray-600">データがありません</td>
                  </tr>
                  <tr v-for="(item, index) in summaryData" :key="index">
                    <td v-if="summaryDisplayUnit === 'lesson'">{{ item.lesson }}</td>
                    <td v-else-if="summaryDisplayUnit === 'level'">{{ item.level }}</td>
                    <td v-else>{{ item.category }}</td>
                    <td>{{ item.playCount }}</td>
                    <td>{{ item.avgScore }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 個人記録ビュー -->
    <div v-show="currentView === 'personal-records'" class="p-5">
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">個人記録</h2>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>プレイヤー</th>
                <th>組織</th>
                <th>総プレイ数</th>
                <th>平均スコア</th>
                <th>総プレイ時間</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="playerStats.length === 0">
                <td colspan="5" class="text-center text-gray-600">データがありません</td>
              </tr>
              <tr v-for="(player, index) in playerStats" :key="index">
                <td>{{ player.player }}</td>
                <td>{{ player.org }}</td>
                <td>{{ player.totalPlays }}</td>
                <td>{{ player.avgScore }}</td>
                <td>{{ formatTime(player.totalPlayTime) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ランキングビュー -->
    <div v-show="currentView === 'ranking'" class="p-5">
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">ランキング</h2>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>順位</th>
                <th>プレイヤー</th>
                <th>組織</th>
                <th>総スコア</th>
                <th>平均スコア</th>
                <th>総プレイ数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="rankingData.length === 0">
                <td colspan="6" class="text-center text-gray-600">データがありません</td>
              </tr>
              <tr v-for="item in rankingData" :key="item.rank">
                <td>{{ item.rank }}</td>
                <td>{{ item.player }}</td>
                <td>{{ item.org }}</td>
                <td>{{ item.totalScore }}</td>
                <td>{{ item.avgScore }}</td>
                <td>{{ item.totalPlays }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ログビュー -->
    <div v-show="currentView === 'logs'" class="p-5">
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">ログ</h2>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>プレイヤー</th>
                <th>レッスン</th>
                <th>スコア</th>
                <th>発話時間</th>
                <th>プレイ時間</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="logData.data.length === 0">
                <td colspan="6" class="text-center text-gray-600">データがありません</td>
              </tr>
              <tr v-for="(session, index) in logData.data" :key="index">
                <td>{{ formatDate(session.date) }}</td>
                <td>{{ session.player }}</td>
                <td>{{ session.lesson }}</td>
                <td>{{ session.score }}</td>
                <td>{{ session.speechTime }}s</td>
                <td>{{ session.playTime }}s</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-center items-center gap-2 mt-4">
          <button
            class="pagination-button"
            :disabled="currentLogPage <= 1"
            @click="changePage(-1)"
          >
            &lt;
          </button>
          <span class="text-sm text-gray-600">ページ {{ currentLogPage }} / {{ logData.totalPages || 1 }}</span>
          <button
            class="pagination-button"
            :disabled="currentLogPage >= logData.totalPages"
            @click="changePage(1)"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>

    <!-- データ読み込みビュー -->
    <div v-show="currentView === 'data-import'" class="p-5">
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">データ読込</h2>

        <!-- Current Data Info -->
        <div class="data-info-grid mb-6">
          <div>
            <div class="data-info-label">総レコード数</div>
            <div class="data-info-value">{{ dataStats.recordCount.toLocaleString() }}</div>
          </div>
          <div>
            <div class="data-info-label">プレイヤー数</div>
            <div class="data-info-value">{{ dataStats.playerCount.toLocaleString() }}</div>
          </div>
          <div>
            <div class="data-info-label">レッスン数</div>
            <div class="data-info-value">{{ dataStats.lessonCount.toLocaleString() }}</div>
          </div>
          <div>
            <div class="data-info-label">期間</div>
            <div class="data-info-value-sm">{{ dataStats.dateRange }}</div>
          </div>
        </div>

        <!-- File Upload -->
        <div class="upload-area">
          <input type="file" accept=".csv" style="display: none;" ref="csvFileInput">
          <div class="flex gap-3 justify-center flex-wrap">
            <button class="button-primary" @click="selectCSVFile">
              CSVファイルを選択
            </button>
            <button class="button-success" @click="loadDemoDataManually">
              デモデータを読み込む
            </button>
          </div>
          <div class="upload-hint">
            フォーマット: 日付,Org,Account,Group,Player,カテゴリ,レベル,レッスン,スコア,発話時間,プレイ時間
          </div>
          <div class="upload-status"></div>
        </div>

        <!-- Sample Data Preview -->
        <div class="mt-6">
          <h3 class="font-semibold mb-3">データプレビュー（最新10件）</h3>
          <div class="overflow-x-auto">
            <table class="data-table text-xs">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>組織</th>
                  <th>プレイヤー</th>
                  <th>レッスン</th>
                  <th>スコア</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="logData.data.length === 0">
                  <td colspan="5" class="text-center text-gray-600">データがありません</td>
                </tr>
                <tr v-for="(session, index) in logData.data.slice(0, 10)" :key="index">
                  <td>{{ formatDate(session.date) }}</td>
                  <td>{{ session.org }}</td>
                  <td>{{ session.player }}</td>
                  <td>{{ session.lesson }}</td>
                  <td>{{ session.score }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ロープレ構築ビュー (デフォルト) - 2列レイアウト -->
    <div v-show="currentView === 'roleplay'" class="content-creation-container">
      <!-- 左カラム: 操作コンポーネント (2行分) -->
      <div class="cc-operation-component">
        <!-- カテゴリーセレクター -->
        <div class="cc-category-selector">
          <select class="cc-category-select" v-model="selectedCategory">
            <option value="">カテゴリーを選択してください</option>
            <option value="営業">営業</option>
            <option value="接客">接客</option>
            <option value="面接">面接</option>
          </select>
        </div>

        <!-- タブナビゲーション -->
        <div class="cc-operation-tabs">
          <button
            class="cc-operation-tab"
            :class="{ active: activeOperationTab === 'chat' }"
            @click="activeOperationTab = 'chat'"
          >
            チャット
          </button>
          <button
            class="cc-operation-tab"
            :class="{ active: activeOperationTab === 'course' }"
            @click="activeOperationTab = 'course'"
          >
            コース
          </button>
          <button
            class="cc-operation-tab"
            :class="{ active: activeOperationTab === 'files' }"
            @click="activeOperationTab = 'files'"
          >
            ファイル
          </button>
        </div>

        <!-- タブコンテンツ -->
        <div
          class="cc-operation-tab-content"
          :class="{ active: activeOperationTab === 'chat' }"
        >
          <div class="cc-chat-component">
            <div class="cc-ai-chat-component">
              <!-- チャットメッセージエリア -->
              <div class="cc-chat-messages" ref="chatMessagesRef">
                <!-- 初期状態：メッセージがない場合 -->
                <template v-if="chatMessages.length === 0">
                  <div class="cc-chat-dropzone">
                    <div class="cc-dropzone-icon">📁</div>
                    <div class="cc-dropzone-text">
                      ファイルをアップロードするか、<br>
                      テキスト入力で構築を開始。<br>
                      ドラッグ&ドロップも可<br>
                      <span class="cc-dropzone-hint">推奨データ：PDF, EXCEL, 録音, 録画</span>
                    </div>
                  </div>

                  <!-- サジェスションボタン -->
                  <div class="cc-chat-suggestions">
                    <button
                      v-for="(suggestion, index) in chatSuggestions"
                      :key="index"
                      class="cc-chat-suggestion-btn"
                      @click="useSuggestion(suggestion.text)"
                    >
                      {{ suggestion.icon }} {{ suggestion.text }}
                    </button>
                  </div>
                </template>

                <!-- メッセージ一覧 -->
                <div
                  v-for="message in chatMessages"
                  :key="message.id"
                  class="cc-message"
                  :class="message.role"
                >
                  <div class="cc-message-avatar">
                    <template v-if="message.role === 'assistant'">
                      <NaretoreLogo class="cc-avatar-logo" />
                    </template>
                    <template v-else>👤</template>
                  </div>
                  <div class="cc-message-bubble">
                    {{ message.content }}
                  </div>
                </div>
              </div>

              <!-- チャット入力エリア -->
              <div class="cc-chat-input-area">
                <textarea
                  class="cc-textarea"
                  v-model="chatInput"
                  placeholder="メッセージを入力..."
                  rows="1"
                  :disabled="isChatLoading"
                  @keydown.enter.exact.prevent="handleSendMessage"
                ></textarea>
                <div class="cc-button-group">
                  <button class="cc-button cc-button-secondary" @click="attachFile">📎 ファイルを添付</button>
                  <button
                    class="cc-button cc-button-primary"
                    :disabled="isChatLoading || !chatInput.trim()"
                    @click="handleSendMessage"
                  >
                    {{ isChatLoading ? '送信中...' : '送信' }}
                  </button>
                </div>
                <div class="cc-roleplay-generate-wrapper">
                  <button class="cc-button cc-button-generate" @click="openFileSelectionDialog">🎭 ロープレ生成</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="cc-operation-tab-content"
          :class="{ active: activeOperationTab === 'course' }"
        >
          <div class="cc-course-manager">
            <!-- コース追加ボタン -->
            <div class="cc-course-add-section">
              <button class="cc-button cc-button-primary" @click="addNewCategory">➕ カテゴリーを追加</button>
            </div>

            <!-- コースリストコンテナ -->
            <div class="cc-course-list">
              <div class="cc-raw-data-empty">
                <div class="cc-empty-icon">📚</div>
                <div class="cc-empty-text">コース管理</div>
                <div class="cc-empty-hint">コースとレッスンを管理します</div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="cc-operation-tab-content"
          :class="{ active: activeOperationTab === 'files' }"
        >
          <div class="cc-raw-data-container">
            <FileUpload />
          </div>
        </div>
      </div>

      <!-- 右カラム上段: プレイコンポーネント -->
      <div class="cc-play-component">
        <!-- プレイヘッダー -->
        <div class="cc-play-header">
          <div class="cc-lesson-selector">
            <label class="cc-lesson-label">レッスン:</label>
            <select class="cc-lesson-dropdown" v-model="selectedLesson">
              <option value="">レッスンを選択...</option>
              <optgroup label="Lv.1">
                <option value="lv1-1">Lv.1: 飛び込み学習モード</option>
                <option value="lv1-2">Lv.1: 話すことまとめ</option>
              </optgroup>
              <optgroup label="Lv.2">
                <option value="lv2-1">Lv.2: 相手に寄り添うトーク</option>
                <option value="lv2-2">Lv.2: 言葉の選び方</option>
              </optgroup>
            </select>
          </div>
        </div>

        <!-- プレイコンテンツ -->
        <div class="cc-play-content">
          <!-- ロープレモード選択コンポーネント (Left) -->
          <div class="cc-roleplay-mode-component">
            <div class="cc-mode-title">モードを選ぶ</div>
            <div class="cc-mode-buttons">
              <button
                class="cc-mode-button"
                :class="{ active: selectedMode === 'subtitle' }"
                @click="selectMode('subtitle')"
              >
                台本モード
              </button>
              <button
                class="cc-mode-button"
                :class="{ active: selectedMode === 'ai-demo' }"
                @click="selectMode('ai-demo')"
              >
                お手本モード
              </button>
              <button
                class="cc-mode-button"
                :class="{ active: selectedMode === 'confirmation' }"
                @click="selectMode('confirmation')"
              >
                確認モード
              </button>
              <button
                class="cc-mode-button"
                :class="{ active: selectedMode === 'practice' }"
                @click="selectMode('practice')"
              >
                実践モード
              </button>
            </div>
          </div>

          <!-- 再生コンポーネント (Center: Video Display) -->
          <div class="cc-playback-component">
            <!-- Video Window -->
            <div class="cc-video-window-container">
              <div class="cc-character-window">
                <!-- Video element (shown when video is loaded) -->
                <video
                  v-if="currentVideoUrl"
                  ref="characterVideoRef"
                  class="cc-character-video"
                  :src="currentVideoUrl"
                  autoplay
                  loop
                  muted
                  playsinline
                ></video>

                <!-- Fallback emoji (shown when no video) -->
                <div v-else class="cc-character">{{ selectedCharacterIcon }}</div>

                <!-- Speaking indicator overlay -->
                <div v-if="realtimeSpeaking" class="cc-speaking-indicator">
                  <span class="cc-speaking-waves"></span>
                </div>

                <!-- Connection Status -->
                <div class="cc-video-connection-status">
                  <div class="cc-connection-status">
                    <span
                      class="cc-status-indicator"
                      :class="isConnected ? 'cc-status-connected' : 'cc-status-disconnected'"
                    ></span>
                    <span class="cc-status-text">{{ connectionStatus }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作コンポーネント (Control Buttons) -->
            <div class="cc-control-component">
              <!-- Start/Stop Button (Left) -->
              <button
                class="cc-start-button-new"
                @click="toggleRoleplay"
              >
                {{ isPlaying ? '■ 停止' : '▶ スタート' }}
              </button>

              <!-- Microphone Button (Right of Start Button) -->
              <button
                class="cc-mic-button-new"
                :class="{ active: realtimeRecording }"
                @click="toggleMic"
                :disabled="!isConnected"
              >
                <span class="cc-mic-icon">🎤</span>
                <span class="cc-mic-text">{{ realtimeRecording ? 'ON' : 'OFF' }}</span>
              </button>
            </div>
          </div>

          <!-- 設定コンポーネント (Right: Settings - Scrollable) -->
          <div class="cc-settings-component">
            <!-- キャラクター設定コンポーネント -->
            <div class="cc-character-settings-component">
              <div class="cc-settings-label">相手:</div>
              <div class="cc-character-icon-box" @click="openCharacterSettings">
                {{ selectedCharacterIcon }}
              </div>
              <select v-model="selectedCharacter" class="cc-character-select">
                <option value="businessman">ビジネスマン</option>
                <option value="saleswoman">営業ウーマン</option>
                <option value="manager">マネージャー</option>
                <option value="customer">顧客</option>
              </select>
            </div>

            <!-- 音声設定コンポーネント -->
            <div class="cc-voice-settings-component">
              <div class="cc-setting-row">
                <label class="cc-setting-label">音声タイプ:</label>
                <select v-model="voiceType" class="cc-voice-select">
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="nova">Nova</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              </div>
            </div>

            <!-- ビデオキャラクター設定コンポーネント -->
            <div class="cc-video-slots-component">
              <div class="cc-settings-label">動画キャラ:</div>
              <div class="cc-video-slots-grid">
                <VideoCharacterSlot
                  v-for="slot in videoSlots"
                  :key="slot.id"
                  :slot="slot"
                  @file-selected="(file) => handleVideoFile(slot.id, file)"
                  @remove="removeVideo(slot.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右カラム下段: 設計コンポーネント -->
      <div class="cc-design-component" :class="{ expanded: isDesignExpanded }">
        <!-- テストエリア開閉ボタン -->
        <button class="cc-play-toggle-button" @click="togglePlayComponent">
          <span class="cc-play-toggle-icon">{{ isDesignExpanded ? '▼' : '▲' }}</span>
          <span class="cc-play-toggle-text">{{ isDesignExpanded ? 'テストエリアを表示' : 'テストエリアを閉じる' }}</span>
        </button>

        <!-- タブナビゲーション -->
        <div class="cc-tabs">
          <button
            class="cc-tab"
            :class="{ active: activeDesignTab === 'roleplay' }"
            @click="activeDesignTab = 'roleplay'"
          >
            ロープレ設計
          </button>
          <button
            class="cc-tab"
            :class="{ active: activeDesignTab === 'flow' }"
            @click="activeDesignTab = 'flow'"
          >
            会話の流れ
          </button>
          <button
            class="cc-tab"
            :class="{ active: activeDesignTab === 'document' }"
            @click="activeDesignTab = 'document'"
          >
            設計書
          </button>
        </div>

        <!-- タブコンテンツ -->
        <div
          class="cc-tab-content"
          :class="{ active: activeDesignTab === 'roleplay' }"
        >
          <RoleplayDesignForm ref="roleplayDesignFormRef" />
        </div>

        <div
          class="cc-tab-content"
          :class="{ active: activeDesignTab === 'flow' }"
        >
          <!-- 生成中表示 -->
          <div v-if="isGenerating" class="cc-generating-indicator">
            <div class="cc-generating-spinner"></div>
            <div class="cc-generating-text">{{ generationStep }}</div>
          </div>

          <!-- 生成結果がある場合 -->
          <div v-else-if="generatedScripts.subtitle || generatedScripts.points || generatedScripts.practice" class="cc-scripts-container">
            <!-- 字幕モード台本 -->
            <div v-if="generatedScripts.subtitle" class="cc-script-section">
              <h4 class="cc-script-title">台本モード</h4>
              <pre class="cc-script-content">{{ JSON.stringify(generatedScripts.subtitle, null, 2) }}</pre>
            </div>

            <!-- ポイントモード台本 -->
            <div v-if="generatedScripts.points" class="cc-script-section">
              <h4 class="cc-script-title">ポイントモード</h4>
              <pre class="cc-script-content">{{ JSON.stringify(generatedScripts.points, null, 2) }}</pre>
            </div>

            <!-- 練習モード台本 -->
            <div v-if="generatedScripts.practice" class="cc-script-section">
              <h4 class="cc-script-title">練習モード</h4>
              <pre class="cc-script-content">{{ JSON.stringify(generatedScripts.practice, null, 2) }}</pre>
            </div>
          </div>

          <!-- 未生成状態 -->
          <div v-else class="cc-input-data-container">
            <div class="cc-input-data-empty">
              <div class="cc-empty-icon">📝</div>
              <div class="cc-empty-text">まだ会話の流れが生成されていません</div>
              <div class="cc-empty-hint">「ロープレ生成」ボタンから生成できます</div>
            </div>
          </div>
        </div>

        <div
          class="cc-tab-content"
          :class="{ active: activeDesignTab === 'document' }"
        >
          <div class="cc-config-content-wrapper">
            <!-- 生成されたシステムプロンプト -->
            <div v-if="generatedSystemPrompts.subtitle || generatedSystemPrompts.aiDemo || generatedSystemPrompts.confirmation || generatedSystemPrompts.practice" class="cc-prompts-grid">
              <div v-if="generatedSystemPrompts.subtitle" class="cc-prompt-card">
                <h4 class="cc-prompt-title">台本モード</h4>
                <pre class="cc-prompt-content">{{ generatedSystemPrompts.subtitle }}</pre>
              </div>
              <div v-if="generatedSystemPrompts.aiDemo" class="cc-prompt-card">
                <h4 class="cc-prompt-title">お手本モード</h4>
                <pre class="cc-prompt-content">{{ generatedSystemPrompts.aiDemo }}</pre>
              </div>
              <div v-if="generatedSystemPrompts.confirmation" class="cc-prompt-card">
                <h4 class="cc-prompt-title">確認モード</h4>
                <pre class="cc-prompt-content">{{ generatedSystemPrompts.confirmation }}</pre>
              </div>
              <div v-if="generatedSystemPrompts.practice" class="cc-prompt-card">
                <h4 class="cc-prompt-title">実践モード</h4>
                <pre class="cc-prompt-content">{{ generatedSystemPrompts.practice }}</pre>
              </div>
            </div>

            <!-- 未生成状態 -->
            <div v-else class="cc-input-data-empty">
              <div class="cc-empty-icon">📋</div>
              <div class="cc-empty-text">まだ設計書が生成されていません</div>
              <div class="cc-empty-hint">「ロープレ生成」ボタンから生成できます</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Selection Dialog -->
    <FileSelectionDialog
      :is-open="isFileDialogOpen"
      :files="uploadedFiles"
      @close="isFileDialogOpen = false"
      @generate="handleGenerateRoleplay"
    />
  </div>
</template>

<script setup lang="ts">
import type { UploadedFile } from '~/types/file'

definePageMeta({
  layout: 'default'
})

// グローバルな状態管理用のComposableを使用
const currentView = useState('currentView', () => 'roleplay')

// File upload integration
const { uploadedFiles, fetchFiles } = useFileUpload()

// Agent orchestrator
const {
  isGenerating,
  currentStep: generationStep,
  generateRoleplay,
  getChatSupport
} = useAgentOrchestrator()

// File selection dialog state
const isFileDialogOpen = ref(false)

// RoleplayDesignForm ref
const roleplayDesignFormRef = ref<any>(null)

// Generated scripts and prompts
const generatedScripts = ref<{
  subtitle?: any
  points?: any
  practice?: any
}>({})

const generatedSystemPrompts = ref<{
  subtitle?: string
  aiDemo?: string
  confirmation?: string
  practice?: string
}>({})

// デモデータ管理
const {
  loadDemoData: loadData,
  getPlayerStats,
  getRankingData,
  getLogData,
  getDataStats,
  getSummaryDataByLesson,
  getSummaryDataByLevel,
  getSummaryDataByCategory
} = useDemoData()

// Realtime API統合
const {
  isConnected: realtimeConnected,
  isPlaying: realtimePlaying,
  isRecording: realtimeRecording,
  isSpeaking: realtimeSpeaking,
  connectionStatus,
  toggleRoleplay: toggleRealtimeRoleplay,
  toggleRecording: toggleRealtimeRecording,
  startRoleplay: startRealtimeRoleplay,
  stopRoleplay: stopRealtimeRoleplay,
  sendText: sendRealtimeText,
  updateInstructions: updateRealtimeInstructions,
  onTranscript,
  onAIResponse,
  onError: onRealtimeError
} = useRealtimeAPI()

// ビデオキャラクターシステム
const {
  videoSlots,
  currentState: videoState,
  currentVideoUrl,
  hasVideo,
  handleVideoFile,
  removeVideo,
  switchToState: switchVideoState
} = useVideoCharacter()

// チャットAIサポート
const {
  messages: chatMessages,
  isLoading: isChatLoading,
  suggestions: chatSuggestions,
  sendMessage: sendChatMessage,
  clearChat
} = useChatAI()

// 各ビューのデータ
const playerStats = ref<any[]>([])
const rankingData = ref<any[]>([])
const logData = ref<any>({ data: [], total: 0, totalPages: 0 })
const dataStats = ref<any>({ recordCount: 0, playerCount: 0, lessonCount: 0, dateRange: '-' })
const currentLogPage = ref(1)
const summaryDisplayUnit = ref<'lesson' | 'level' | 'category'>('lesson')
const summaryData = ref<any[]>([])

// ロープレ構築ビューの状態管理
const selectedCategory = ref('')
const selectedLesson = ref('')
const activeOperationTab = ref('chat')
const activeDesignTab = ref('roleplay')

// チャット関連の状態
const chatInput = ref('')

// プレイコンポーネントの状態
const selectedMode = ref('')
// isConnected と isPlaying は useRealtimeAPI から取得
const isConnected = realtimeConnected
const isPlaying = realtimePlaying
// isMicOnはrealtimeRecordingを使用
const selectedCharacter = ref('businessman')
const voiceType = ref('alloy')
const characterVideoRef = ref<HTMLVideoElement | null>(null)

// 設計コンポーネントの状態
const isDesignExpanded = ref(false)

// キャラクターアイコンマップ
const characterIcons = {
  businessman: '👔',
  saleswoman: '👩‍💼',
  manager: '👨‍💼',
  customer: '🙋'
}

const selectedCharacterIcon = computed(() => {
  return characterIcons[selectedCharacter.value as keyof typeof characterIcons] || '👔'
})

// ページ読み込み時にデータを自動的に読み込む
onMounted(async () => {
  try {
    await loadData()
    refreshAllData()
  } catch (error) {
    console.error('Failed to load demo data:', error)
  }
})

// ビュー切り替えを監視
watch(() => currentView.value, (newView) => {
  console.log('Current view:', newView)
  refreshAllData()
})

// すべてのデータを更新
const refreshAllData = () => {
  playerStats.value = getPlayerStats()
  rankingData.value = getRankingData()
  logData.value = getLogData(currentLogPage.value, 20)
  dataStats.value = getDataStats()
  updateSummaryData()
}

// サマリーデータを更新
const updateSummaryData = () => {
  switch (summaryDisplayUnit.value) {
    case 'lesson':
      summaryData.value = getSummaryDataByLesson()
      break
    case 'level':
      summaryData.value = getSummaryDataByLevel()
      break
    case 'category':
      summaryData.value = getSummaryDataByCategory()
      break
  }
}

// 表示単位が変更されたらサマリーデータを更新
watch(summaryDisplayUnit, () => {
  updateSummaryData()
})

const resetChat = () => {
  // TODO: チャットリセット処理
  console.log('Reset chat')
}

const selectCSVFile = () => {
  // TODO: CSVファイル選択処理
  console.log('Select CSV file')
}

const loadDemoDataManually = async () => {
  try {
    await loadData()
    refreshAllData()
  } catch (error) {
    console.error('Failed to load demo data:', error)
  }
}

const changePage = (delta: number) => {
  const newPage = currentLogPage.value + delta
  if (newPage >= 1 && newPage <= logData.value.totalPages) {
    currentLogPage.value = newPage
    logData.value = getLogData(currentLogPage.value, 20)
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('ja-JP')
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// チャットメッセージエリアのref
const chatMessagesRef = ref<HTMLElement | null>(null)

// チャット最下部にスクロール
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

// ロープレ構築ビューの関数
const handleSendMessage = async () => {
  if (!chatInput.value.trim() || isChatLoading.value) return

  const message = chatInput.value.trim()
  chatInput.value = ''

  // Get roleplay design data if available
  const roleplayDesign = roleplayDesignFormRef.value?.design

  // Send message via useChatAI
  await sendChatMessage(message, uploadedFiles.value, roleplayDesign)

  scrollToBottom()
}

// サジェスションを使用
const useSuggestion = (text: string) => {
  chatInput.value = text
  handleSendMessage()
}

const attachFile = async () => {
  // 既存のファイルアップロード機能を使用
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.txt,.pdf,.ppt,.pptx,.xlsx,.xls,.mp3,.wav,.mp4,.mov'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }
  input.click()
}

const openFileSelectionDialog = async () => {
  // Fetch latest uploaded files
  await fetchFiles()
  isFileDialogOpen.value = true
}

const handleGenerateRoleplay = async (selectedFiles: UploadedFile[]) => {
  isFileDialogOpen.value = false

  try {
    // Get design data from RoleplayDesignForm via ref
    const design = roleplayDesignFormRef.value?.design || {
      situation: '',
      opponentSetting: '',
      missions: { required: [], scoring: [], failure: [] },
      points: []
    }

    console.log('Generating roleplay with:', { design, files: selectedFiles })

    // Call agent orchestrator
    const result = await generateRoleplay(design, selectedFiles)

    console.log('Generated roleplay:', result)

    // Store generated scripts and prompts
    generatedScripts.value = result.scripts
    generatedSystemPrompts.value = result.systemPrompts

    // Switch to flow tab to show generated scripts
    activeDesignTab.value = 'flow'

  } catch (error) {
    console.error('Roleplay generation failed:', error)
    alert('ロープレ生成に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
  }
}

const addNewCategory = () => {
  console.log('Add new category')
}

const selectMode = (mode: string) => {
  selectedMode.value = mode
  console.log('Selected mode:', mode)
}

const toggleRoleplay = async () => {
  await toggleRealtimeRoleplay()
  console.log('Roleplay playing:', isPlaying.value)
  console.log('Connection status:', connectionStatus.value)
}

const toggleMic = () => {
  toggleRealtimeRecording()
  console.log('Recording:', realtimeRecording.value)
}

const openCharacterSettings = () => {
  console.log('Open character settings')
}

const togglePlayComponent = () => {
  isDesignExpanded.value = !isDesignExpanded.value
  console.log('Design expanded:', isDesignExpanded.value)
}
</script>
