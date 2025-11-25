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
                <select v-model="summaryFilters.category" class="filter-select" @change="onCategoryChange">
                  <option value="">全カテゴリー</option>
                  <option v-for="cat in filterOptions.categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
                <select
                  v-model="summaryFilters.level"
                  class="filter-select"
                  :disabled="!summaryFilters.category"
                  @change="onLevelChange"
                >
                  <option value="">全レベル</option>
                  <option
                    v-for="lvl in availableLevels"
                    :key="lvl"
                    :value="lvl"
                  >Lv.{{ lvl }}</option>
                </select>
                <select
                  v-model="summaryFilters.lesson"
                  class="filter-select"
                  :disabled="!summaryFilters.level"
                >
                  <option value="">全レッスン</option>
                  <option
                    v-for="lsn in availableLessons"
                    :key="lsn"
                    :value="lsn"
                  >{{ lsn }}</option>
                </select>
              </div>
            </div>

            <div class="filter-panel">
              <div class="filter-title">プレイヤー絞り込み</div>
              <div class="hierarchy-filter">
                <select v-model="summaryFilters.selectedPlayers" class="filter-select" multiple>
                  <option v-for="player in filterOptions.players" :key="player" :value="player">{{ player }}</option>
                </select>
                <div class="filter-hint">{{ summaryFilters.selectedPlayers.length > 0 ? `${summaryFilters.selectedPlayers.length}名選択中` : '全プレイヤー' }}</div>
              </div>
            </div>

            <div class="filter-panel">
              <div class="filter-title">期間絞り込み</div>
              <div class="date-filter">
                <input type="month" class="date-input" v-model="summaryFilters.dateFrom">
                <span>〜</span>
                <input type="month" class="date-input" v-model="summaryFilters.dateTo">
              </div>
            </div>

            <div class="filter-panel">
              <button class="filter-clear-button" @click="clearSummaryFilters">フィルターをクリア</button>
            </div>
          </div>
        </div>

        <!-- Right Content -->
        <div class="summary-content">
          <!-- Chart -->
          <div class="card mb-4">
            <TrendChart
              :labels="trendChartLabels"
              :datasets="trendChartDatasets"
            />
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
      <!-- プレイヤー詳細が選択されている場合 -->
      <div v-if="selectedPlayerDetails" class="player-detail-container">
        <div class="player-detail-header">
          <button class="back-button" @click="closePlayerDetails">
            ← 一覧に戻る
          </button>
          <h2 class="player-detail-title">{{ selectedPlayerDetails.player }} の詳細</h2>
        </div>

        <!-- 基本情報カード -->
        <div class="player-info-grid">
          <div class="player-info-card">
            <div class="player-info-label">組織</div>
            <div class="player-info-value">{{ selectedPlayerDetails.org }}</div>
          </div>
          <div class="player-info-card">
            <div class="player-info-label">総プレイ数</div>
            <div class="player-info-value">{{ selectedPlayerDetails.totalPlays }}</div>
          </div>
          <div class="player-info-card">
            <div class="player-info-label">平均スコア</div>
            <div class="player-info-value highlight">{{ selectedPlayerDetails.avgScore }}</div>
          </div>
          <div class="player-info-card">
            <div class="player-info-label">総プレイ時間</div>
            <div class="player-info-value">{{ formatTime(selectedPlayerDetails.totalPlayTime) }}</div>
          </div>
          <div class="player-info-card">
            <div class="player-info-label">初回プレイ</div>
            <div class="player-info-value-sm">{{ formatDate(selectedPlayerDetails.firstPlay) }}</div>
          </div>
          <div class="player-info-card">
            <div class="player-info-label">最終プレイ</div>
            <div class="player-info-value-sm">{{ formatDate(selectedPlayerDetails.lastPlay) }}</div>
          </div>
        </div>

        <!-- トレンドグラフ -->
        <div class="card mb-4" v-if="selectedPlayerDetails.monthlyTrend.labels.length > 0">
          <h3 class="text-base font-semibold text-gray-800 mb-3">月別推移</h3>
          <TrendChart
            :labels="selectedPlayerDetails.monthlyTrend.labels"
            :datasets="[
              {
                label: 'プレイ数',
                data: selectedPlayerDetails.monthlyTrend.playCountData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              },
              {
                label: '平均スコア',
                data: selectedPlayerDetails.monthlyTrend.avgScoreData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
              }
            ]"
          />
        </div>

        <!-- カテゴリー別統計 -->
        <div class="card mb-4">
          <h3 class="text-base font-semibold text-gray-800 mb-3">カテゴリー別統計</h3>
          <div class="overflow-x-auto">
            <table class="data-table text-sm">
              <thead>
                <tr>
                  <th>カテゴリー</th>
                  <th>プレイ数</th>
                  <th>平均スコア</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cat, index) in selectedPlayerDetails.categoryBreakdown" :key="index">
                  <td>{{ cat.category }}</td>
                  <td>{{ cat.playCount }}</td>
                  <td>{{ cat.avgScore }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- レッスン別統計 -->
        <div class="card mb-4">
          <h3 class="text-base font-semibold text-gray-800 mb-3">レッスン別統計</h3>
          <div class="overflow-x-auto">
            <table class="data-table text-sm">
              <thead>
                <tr>
                  <th>レッスン</th>
                  <th>カテゴリー</th>
                  <th>レベル</th>
                  <th>プレイ数</th>
                  <th>平均スコア</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(lesson, index) in selectedPlayerDetails.lessonBreakdown" :key="index">
                  <td>{{ lesson.lesson }}</td>
                  <td>{{ lesson.category }}</td>
                  <td>Lv.{{ lesson.level }}</td>
                  <td>{{ lesson.playCount }}</td>
                  <td>{{ lesson.avgScore }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 直近のセッション -->
        <div class="card">
          <h3 class="text-base font-semibold text-gray-800 mb-3">直近のセッション（最新10件）</h3>
          <div class="overflow-x-auto">
            <table class="data-table text-sm">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>レッスン</th>
                  <th>スコア</th>
                  <th>発話時間</th>
                  <th>プレイ時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(session, index) in selectedPlayerDetails.recentSessions" :key="index">
                  <td>{{ formatDate(session.date) }}</td>
                  <td>{{ session.lesson }}</td>
                  <td>{{ session.score }}</td>
                  <td>{{ session.speechTime }}s</td>
                  <td>{{ session.playTime }}s</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- プレイヤー一覧（詳細が選択されていない場合） -->
      <div v-else class="card">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">個人記録</h2>
        <p class="text-sm text-gray-500 mb-3">プレイヤー名をクリックすると詳細を表示します</p>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" :class="{ sorted: playerSortState.column === 'player' }" @click="togglePlayerSort('player')">
                  <span class="th-content">プレイヤー<span class="sort-icon">{{ getPlayerSortIcon('player') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: playerSortState.column === 'org' }" @click="togglePlayerSort('org')">
                  <span class="th-content">組織<span class="sort-icon">{{ getPlayerSortIcon('org') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: playerSortState.column === 'totalPlays' }" @click="togglePlayerSort('totalPlays')">
                  <span class="th-content">総プレイ数<span class="sort-icon">{{ getPlayerSortIcon('totalPlays') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: playerSortState.column === 'avgScore' }" @click="togglePlayerSort('avgScore')">
                  <span class="th-content">平均スコア<span class="sort-icon">{{ getPlayerSortIcon('avgScore') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: playerSortState.column === 'totalPlayTime' }" @click="togglePlayerSort('totalPlayTime')">
                  <span class="th-content">総プレイ時間<span class="sort-icon">{{ getPlayerSortIcon('totalPlayTime') }}</span></span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="sortedPlayerStats.length === 0">
                <td colspan="5" class="text-center text-gray-600">データがありません</td>
              </tr>
              <tr
                v-for="(player, index) in sortedPlayerStats"
                :key="index"
                class="clickable-row"
                @click="showPlayerDetails(player.player)"
              >
                <td class="player-name-cell">{{ player.player }}</td>
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
                <th class="sortable" :class="{ sorted: rankingSortState.column === 'rank' }" @click="toggleRankingSort('rank')">
                  <span class="th-content">順位<span class="sort-icon">{{ getRankingSortIcon('rank') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: rankingSortState.column === 'player' }" @click="toggleRankingSort('player')">
                  <span class="th-content">プレイヤー<span class="sort-icon">{{ getRankingSortIcon('player') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: rankingSortState.column === 'org' }" @click="toggleRankingSort('org')">
                  <span class="th-content">組織<span class="sort-icon">{{ getRankingSortIcon('org') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: rankingSortState.column === 'totalScore' }" @click="toggleRankingSort('totalScore')">
                  <span class="th-content">総スコア<span class="sort-icon">{{ getRankingSortIcon('totalScore') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: rankingSortState.column === 'avgScore' }" @click="toggleRankingSort('avgScore')">
                  <span class="th-content">平均スコア<span class="sort-icon">{{ getRankingSortIcon('avgScore') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: rankingSortState.column === 'totalPlays' }" @click="toggleRankingSort('totalPlays')">
                  <span class="th-content">総プレイ数<span class="sort-icon">{{ getRankingSortIcon('totalPlays') }}</span></span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="sortedRankingData.length === 0">
                <td colspan="6" class="text-center text-gray-600">データがありません</td>
              </tr>
              <tr v-for="item in sortedRankingData" :key="item.rank">
                <td class="rank-cell" :class="getRankClass(item.rank)">{{ item.rank }}位</td>
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
                <th class="sortable" :class="{ sorted: logSortState.column === 'date' }" @click="toggleLogSort('date')">
                  <span class="th-content">日付<span class="sort-icon">{{ getLogSortIcon('date') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: logSortState.column === 'player' }" @click="toggleLogSort('player')">
                  <span class="th-content">プレイヤー<span class="sort-icon">{{ getLogSortIcon('player') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: logSortState.column === 'lesson' }" @click="toggleLogSort('lesson')">
                  <span class="th-content">レッスン<span class="sort-icon">{{ getLogSortIcon('lesson') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: logSortState.column === 'score' }" @click="toggleLogSort('score')">
                  <span class="th-content">スコア<span class="sort-icon">{{ getLogSortIcon('score') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: logSortState.column === 'speechTime' }" @click="toggleLogSort('speechTime')">
                  <span class="th-content">発話時間<span class="sort-icon">{{ getLogSortIcon('speechTime') }}</span></span>
                </th>
                <th class="sortable" :class="{ sorted: logSortState.column === 'playTime' }" @click="toggleLogSort('playTime')">
                  <span class="th-content">プレイ時間<span class="sort-icon">{{ getLogSortIcon('playTime') }}</span></span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="sortedLogData.length === 0">
                <td colspan="6" class="text-center text-gray-600">データがありません</td>
              </tr>
              <tr v-for="(session, index) in sortedLogData" :key="index">
                <td>{{ formatDateTime(session.date) }}</td>
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
          <input
            type="file"
            accept=".csv"
            style="display: none;"
            ref="csvFileInput"
            @change="handleCSVFileChange"
          >
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
          <div v-if="csvUploadStatus" class="upload-status" :class="{ error: csvUploadStatus.startsWith('エラー'), success: csvUploadStatus.startsWith('✓') }">
            {{ csvUploadStatus }}
          </div>
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
      <div
        class="cc-operation-component"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @dragover.prevent="handleDragOver"
        @drop.prevent="handleFileDrop"
      >
        <!-- ドラッグオーバーレイ -->
        <div v-if="isDragging" class="cc-drag-overlay">
          <div class="cc-drag-overlay-content">
            <span class="cc-drag-icon">📁</span>
            <span class="cc-drag-text">ファイルをドロップしてアップロード</span>
          </div>
        </div>
        <!-- カテゴリー選択 -->
        <div class="cc-category-selector">
          <div class="cc-category-select-wrapper">
            <label class="cc-category-label">コース:</label>
            <select class="cc-category-select" v-model="selectedCategory">
              <option value="sales-basics" selected>営業基礎</option>
              <option value="customer-service">カスタマーサービス</option>
              <option value="presentation">プレゼンテーション</option>
              <option value="negotiation">交渉術</option>
              <option value="leadership">リーダーシップ</option>
            </select>
          </div>
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
                  <div
                    class="cc-chat-dropzone"
                    @click="attachFile"
                  >
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
                    <!-- ファイルメッセージの場合 -->
                    <template v-if="message.type === 'file' && message.file">
                      <div class="cc-file-message">
                        <span class="cc-file-icon">📎</span>
                        <div class="cc-file-info">
                          <div class="cc-file-name">{{ message.file.name }}</div>
                          <div class="cc-file-size">{{ formatFileSize(message.file.size) }}</div>
                        </div>
                      </div>
                    </template>
                    <!-- 通常のテキストメッセージ -->
                    <template v-else>
                      <span v-html="message.content"></span>
                    </template>
                  </div>
                </div>

                <!-- ファイルタイプ選択ボタン（ペンディングファイルがある場合） -->
                <div v-if="pendingFileForType" class="cc-file-type-buttons">
                  <button class="cc-chat-suggestion-btn" @click="selectFileType('sample')">📖 見本データ（商談や接客の正解例）</button>
                  <button class="cc-chat-suggestion-btn" @click="selectFileType('material')">📚 教材データ（学ばせたい内容の資料）</button>
                  <button class="cc-chat-suggestion-btn" @click="selectFileType('company')">🏢 自社データ（商品情報や会社概要）</button>
                  <button class="cc-chat-suggestion-btn" @click="selectFileType('customer')">👥 顧客データ（想定顧客やペルソナ）</button>
                  <button class="cc-chat-suggestion-btn" @click="selectFileType('other')">📄 その他</button>
                </div>
              </div>

              <!-- チャット入力エリア -->
              <div class="cc-chat-input-area">
                <textarea
                  ref="chatTextareaRef"
                  class="cc-textarea"
                  v-model="chatInput"
                  placeholder="メッセージを入力...（Enter: 送信 / Shift+Enter: 改行）"
                  rows="1"
                  :disabled="isChatLoading"
                  @keydown.enter.exact.prevent="handleSendMessage"
                  @input="adjustTextareaHeight"
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
          @click="closeContextMenu"
        >
          <div class="cc-course-manager">
            <!-- コース追加ボタン -->
            <div class="cc-course-add-section">
              <button class="cc-button cc-button-primary" @click="addNewCategory">➕ カテゴリーを追加</button>
            </div>

            <!-- コースリストコンテナ -->
            <div class="cc-course-list">
              <!-- 空の状態 -->
              <div v-if="courseCategories.length === 0" class="cc-raw-data-empty">
                <div class="cc-empty-icon">📚</div>
                <div class="cc-empty-text">コース管理</div>
                <div class="cc-empty-hint">カテゴリーを追加してコースを作成してください</div>
              </div>

              <!-- カテゴリーリスト -->
              <div v-else class="cc-category-list">
                <div v-for="category in courseCategories" :key="category.id" class="cc-category-item">
                  <!-- カテゴリーヘッダー -->
                  <div class="cc-category-header" @click="toggleCategoryExpand(category.id)">
                    <span class="cc-expand-icon">{{ expandedCategories.has(category.id) ? '▼' : '▶' }}</span>
                    <span class="cc-category-name">📁 {{ category.name }}</span>
                    <button class="cc-settings-btn" @click.stop="showContextMenu($event, 'category', category)">⚙️</button>
                  </div>

                  <!-- レベルリスト（展開時） -->
                  <div v-if="expandedCategories.has(category.id)" class="cc-level-list">
                    <div v-for="level in category.levels" :key="level.id" class="cc-level-item">
                      <!-- レベルヘッダー -->
                      <div class="cc-level-header" @click="toggleLevelExpand(level.id)">
                        <span class="cc-expand-icon">{{ expandedLevels.has(level.id) ? '▼' : '▶' }}</span>
                        <span class="cc-level-name">{{ level.name }}</span>
                        <button class="cc-settings-btn" @click.stop="showContextMenu($event, 'level', level)">⚙️</button>
                      </div>

                      <!-- レッスンリスト（展開時） -->
                      <div v-if="expandedLevels.has(level.id)" class="cc-lesson-list">
                        <div
                          v-for="lesson in level.lessons"
                          :key="lesson.id"
                          class="cc-lesson-item"
                          :class="{
                            'cc-lesson-selected': selectedLesson === lesson.id,
                            'cc-lesson-dragging': draggedLesson?.id === lesson.id,
                            'cc-lesson-dragover': dragOverLessonId === lesson.id
                          }"
                          draggable="true"
                          @click="selectLesson(lesson)"
                          @dragstart="onDragStart($event, lesson)"
                          @dragover="onDragOver($event, lesson.id)"
                          @dragleave="onDragLeave"
                          @drop="onDrop($event, lesson)"
                          @dragend="onDragEnd"
                        >
                          <span class="cc-lesson-icon">📝</span>
                          <span class="cc-lesson-name">{{ lesson.name }}</span>
                          <button class="cc-settings-btn" @click.stop="showContextMenu($event, 'lesson', lesson)">⚙️</button>
                        </div>

                        <!-- レッスンが空の場合 -->
                        <div v-if="level.lessons.length === 0" class="cc-empty-lessons">
                          レッスンがありません
                        </div>
                      </div>
                    </div>

                    <!-- レベルが空の場合 -->
                    <div v-if="category.levels.length === 0" class="cc-empty-levels">
                      レベルがありません
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- コンテキストメニュー -->
          <div
            v-if="contextMenu.show"
            class="cc-context-menu"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            @click.stop
          >
            <!-- カテゴリーメニュー -->
            <template v-if="contextMenu.type === 'category'">
              <div class="cc-context-menu-item" @click="renameCategory((contextMenu.item as Category).id); closeContextMenu()">
                ✏️ 名前変更
              </div>
              <div class="cc-context-menu-item" @click="addLevel((contextMenu.item as Category).id); closeContextMenu()">
                ➕ レベルを追加
              </div>
              <div class="cc-context-menu-item cc-context-menu-danger" @click="deleteCategory((contextMenu.item as Category).id); closeContextMenu()">
                🗑️ 削除
              </div>
            </template>

            <!-- レベルメニュー -->
            <template v-if="contextMenu.type === 'level'">
              <div class="cc-context-menu-item" @click="addLesson((contextMenu.item as Level).categoryId, (contextMenu.item as Level).id); closeContextMenu()">
                ➕ レッスンを追加
              </div>
              <div class="cc-context-menu-item cc-context-menu-danger" @click="deleteLevel((contextMenu.item as Level).categoryId, (contextMenu.item as Level).id); closeContextMenu()">
                🗑️ 削除
              </div>
            </template>

            <!-- レッスンメニュー -->
            <template v-if="contextMenu.type === 'lesson'">
              <div class="cc-context-menu-item" @click="renameLesson((contextMenu.item as Lesson).categoryId, (contextMenu.item as Lesson).levelId, (contextMenu.item as Lesson).id); closeContextMenu()">
                ✏️ 名前変更
              </div>
              <div class="cc-context-menu-item cc-context-menu-danger" @click="deleteLesson((contextMenu.item as Lesson).categoryId, (contextMenu.item as Lesson).levelId, (contextMenu.item as Lesson).id); closeContextMenu()">
                🗑️ 削除
              </div>
            </template>
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
            <select class="cc-lesson-dropdown" v-model="selectedLesson" @change="onLessonSelect">
              <option value="">レッスンを選択...</option>
              <!-- コースデータがある場合は動的に生成 -->
              <template v-if="courseCategories.length > 0">
                <template v-for="category in courseCategories" :key="category.id">
                  <optgroup v-for="level in category.levels" :key="level.id" :label="`${category.name} - ${level.name}`">
                    <option v-for="lesson in level.lessons" :key="lesson.id" :value="lesson.id">
                      {{ level.name }}: {{ lesson.name }}
                    </option>
                  </optgroup>
                </template>
              </template>
              <!-- コースデータがない場合はサンプルオプション -->
              <template v-else>
                <optgroup label="Lv.1">
                  <option value="lv1-1">Lv.1: 飛び込み学習モード</option>
                  <option value="lv1-2">Lv.1: 話すことまとめ</option>
                </optgroup>
                <optgroup label="Lv.2">
                  <option value="lv2-1">Lv.2: 相手に寄り添うトーク</option>
                  <option value="lv2-2">Lv.2: 言葉の選び方</option>
                </optgroup>
              </template>
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
            <!-- 台本カード（各モード） -->
            <template v-for="mode in (['subtitle', 'points', 'practice'] as const)" :key="mode">
              <div v-if="generatedScripts[mode]" class="cc-script-card">
                <!-- カードヘッダー -->
                <div class="cc-script-card-header" @click="toggleScriptExpand(mode)">
                  <span class="cc-script-expand-icon">{{ scriptExpanded[mode] ? '▼' : '▶' }}</span>
                  <span class="cc-script-card-title">📝 {{ getScriptTitle(mode) }}</span>
                  <button
                    v-if="!scriptEditMode[mode]"
                    class="cc-script-edit-btn"
                    @click.stop="startScriptEdit(mode)"
                  >
                    ✏️ 編集
                  </button>
                  <div v-else class="cc-script-edit-actions" @click.stop>
                    <button class="cc-script-save-btn" @click="saveScriptEdit(mode)">
                      💾 保存
                    </button>
                    <button class="cc-script-cancel-btn" @click="cancelScriptEdit(mode)">
                      ✖️ キャンセル
                    </button>
                  </div>
                </div>

                <!-- カードコンテンツ（展開時） -->
                <div v-if="scriptExpanded[mode]" class="cc-script-card-content">
                  <!-- 編集モード -->
                  <textarea
                    v-if="scriptEditMode[mode]"
                    v-model="editingScriptContent[mode]"
                    class="cc-script-textarea"
                    placeholder="台本内容を入力..."
                  ></textarea>
                  <!-- 表示モード -->
                  <pre v-else class="cc-script-content">{{ formatScript(generatedScripts[mode]) }}</pre>
                </div>
              </div>
            </template>
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
            <div v-if="generatedSystemPrompts.subtitle || generatedSystemPrompts.aiDemo || generatedSystemPrompts.confirmation || generatedSystemPrompts.practice" class="cc-prompts-container">
              <!-- プロンプトカード（各モード） -->
              <template v-for="mode in (['subtitle', 'aiDemo', 'confirmation', 'practice'] as const)" :key="mode">
                <div v-if="generatedSystemPrompts[mode]" class="cc-prompt-card-editable">
                  <!-- カードヘッダー -->
                  <div class="cc-prompt-card-header" @click="togglePromptExpand(mode)">
                    <span class="cc-prompt-expand-icon">{{ promptExpanded[mode] ? '▼' : '▶' }}</span>
                    <span class="cc-prompt-card-title">🎯 {{ getPromptTitle(mode) }}プロンプト</span>
                    <button
                      v-if="!promptEditMode[mode]"
                      class="cc-prompt-edit-btn"
                      @click.stop="startPromptEdit(mode)"
                    >
                      ✏️ 編集
                    </button>
                    <div v-else class="cc-prompt-edit-actions" @click.stop>
                      <button class="cc-prompt-save-btn" @click="savePromptEdit(mode)">
                        💾 保存
                      </button>
                      <button class="cc-prompt-cancel-btn" @click="cancelPromptEdit(mode)">
                        ✖️ キャンセル
                      </button>
                    </div>
                  </div>

                  <!-- カードコンテンツ（展開時） -->
                  <div v-if="promptExpanded[mode]" class="cc-prompt-card-content">
                    <!-- 編集モード -->
                    <textarea
                      v-if="promptEditMode[mode]"
                      v-model="editingPromptContent[mode]"
                      class="cc-prompt-textarea"
                      placeholder="プロンプト内容を入力..."
                    ></textarea>
                    <!-- 表示モード -->
                    <pre v-else class="cc-prompt-content-text">{{ generatedSystemPrompts[mode] }}</pre>
                  </div>
                </div>
              </template>
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

    <!-- Feedback Overlay -->
    <FeedbackOverlay
      :is-visible="isFeedbackVisible"
      :feedback="feedbackData"
      @close="closeFeedback"
      @retry="retryPractice"
    />

    <!-- Character Settings Popup -->
    <CharacterSettingsPopup
      :is-open="isCharacterSettingsOpen"
      :current-settings="characterSettings"
      @close="isCharacterSettingsOpen = false"
      @apply="applyCharacterSettings"
    />
  </div>
</template>

<script setup lang="ts">
import type { UploadedFile } from '~/types/file'
import type { FeedbackData } from '~/components/FeedbackOverlay.vue'
import type { CharacterSettings } from '~/components/CharacterSettingsPopup.vue'
import type { Category, Level, Lesson } from '~/types/roleplay'

definePageMeta({
  layout: 'default'
})

// グローバルな状態管理用のComposableを使用
const currentView = useState('currentView', () => 'roleplay')

// File upload integration
const { uploadedFiles, fetchFiles, uploadFile, isUploading, formatFileSize } = useFileUpload()

// Drag and drop state
const isDragging = ref(false)
const dragCounter = ref(0)
const pendingFileForType = ref<{ file: File; name: string } | null>(null)

// Agent orchestrator
const {
  isGenerating,
  currentStep: generationStep,
  generateRoleplay,
  getChatSupport
} = useAgentOrchestrator()

// File selection dialog state
const isFileDialogOpen = ref(false)

// Feedback overlay state
const isFeedbackVisible = ref(false)
const feedbackData = ref<FeedbackData | null>(null)

// Character settings popup state
const isCharacterSettingsOpen = ref(false)
const characterSettings = ref<CharacterSettings>({
  character: 'businessman',
  voice: 'alloy',
  speechRate: 1.0,
  tone: 'neutral',
  responseStyle: 'professional',
  difficulty: 'normal'
})

// RoleplayDesignForm ref
const roleplayDesignFormRef = ref<any>(null)

// Generated scripts and prompts
const generatedScripts = ref<{
  subtitle?: any
  points?: any
  practice?: any
}>({})

// 台本の編集状態
const scriptEditMode = ref<{
  subtitle: boolean
  points: boolean
  practice: boolean
}>({ subtitle: false, points: false, practice: false })

// 台本カードの展開状態
const scriptExpanded = ref<{
  subtitle: boolean
  points: boolean
  practice: boolean
}>({ subtitle: true, points: false, practice: false })

// 編集中の台本内容（JSONテキスト）
const editingScriptContent = ref<{
  subtitle?: string
  points?: string
  practice?: string
}>({})

const generatedSystemPrompts = ref<{
  subtitle?: string
  aiDemo?: string
  confirmation?: string
  practice?: string
}>({})

// プロンプトの編集状態
const promptEditMode = ref<{
  subtitle: boolean
  aiDemo: boolean
  confirmation: boolean
  practice: boolean
}>({ subtitle: false, aiDemo: false, confirmation: false, practice: false })

// プロンプトカードの展開状態
const promptExpanded = ref<{
  subtitle: boolean
  aiDemo: boolean
  confirmation: boolean
  practice: boolean
}>({ subtitle: true, aiDemo: false, confirmation: false, practice: false })

// 編集中のプロンプト内容
const editingPromptContent = ref<{
  subtitle?: string
  aiDemo?: string
  confirmation?: string
  practice?: string
}>({})

// デモデータ管理
const {
  loadDemoData: loadData,
  loadFromCSVFile,
  clearData,
  getPlayerStats,
  getPlayerDetails,
  getRankingData,
  getLogData,
  getDataStats,
  getSummaryDataByLesson,
  getSummaryDataByLevel,
  getSummaryDataByCategory,
  getMonthlyTrendData,
  getFilterOptions,
  getDateRange,
  getFilteredSummaryData
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
  addMessage: addChatMessage,
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

// プレイヤー詳細データ
const selectedPlayerDetails = ref<any>(null)

// サマリーフィルター
const summaryFilters = reactive({
  category: '',
  level: '',
  lesson: '',
  selectedPlayers: [] as string[],
  dateFrom: '',
  dateTo: ''
})

// フィルターオプション
const filterOptions = computed(() => getFilterOptions())

// 利用可能なレベル（選択されたカテゴリーに依存）
const availableLevels = computed(() => {
  if (!summaryFilters.category) return []
  return filterOptions.value.levels[summaryFilters.category] || []
})

// 利用可能なレッスン（選択されたカテゴリー/レベルに依存）
const availableLessons = computed(() => {
  if (!summaryFilters.category || !summaryFilters.level) return []
  const key = `${summaryFilters.category}|${summaryFilters.level}`
  return filterOptions.value.lessons[key] || []
})

// カテゴリー変更時にレベル/レッスンをリセット
const onCategoryChange = () => {
  summaryFilters.level = ''
  summaryFilters.lesson = ''
}

// レベル変更時にレッスンをリセット
const onLevelChange = () => {
  summaryFilters.lesson = ''
}

// フィルタークリア
const clearSummaryFilters = () => {
  summaryFilters.category = ''
  summaryFilters.level = ''
  summaryFilters.lesson = ''
  summaryFilters.selectedPlayers = []
  summaryFilters.dateFrom = ''
  summaryFilters.dateTo = ''
}

// テーブルソート機能
const {
  sortState: playerSortState,
  sortedData: sortedPlayerStats,
  toggleSort: togglePlayerSort,
  getSortIcon: getPlayerSortIcon
} = useTableSort(playerStats)

const {
  sortState: rankingSortState,
  sortedData: sortedRankingData,
  toggleSort: toggleRankingSort,
  getSortIcon: getRankingSortIcon
} = useTableSort(rankingData)

// ログデータ用のソート
const logDataArray = computed(() => logData.value.data)
const {
  sortState: logSortState,
  sortedData: sortedLogData,
  toggleSort: toggleLogSort,
  getSortIcon: getLogSortIcon
} = useTableSort(logDataArray)

// ロープレ構築ビューの状態管理
const selectedCategory = ref('sales-basics')
const selectedLesson = ref('')
const activeOperationTab = ref('chat')
const activeDesignTab = ref('roleplay')

// コース管理の状態
const courseCategories = ref<Category[]>([])
const expandedCategories = ref<Set<string>>(new Set())
const expandedLevels = ref<Set<string>>(new Set())
const contextMenu = ref<{
  show: boolean
  x: number
  y: number
  type: 'category' | 'level' | 'lesson'
  item: Category | Level | Lesson | null
}>({
  show: false,
  x: 0,
  y: 0,
  type: 'category',
  item: null
})

// ドラッグ&ドロップ用の状態
const draggedLesson = ref<Lesson | null>(null)
const dragOverLessonId = ref<string | null>(null)

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

// ランキング順位のクラス名を返す
const getRankClass = (rank: number): string => {
  if (rank === 1) return 'rank-1'
  if (rank === 2) return 'rank-2'
  if (rank === 3) return 'rank-3'
  return ''
}

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

// Realtime APIのspeaking状態を監視してビデオ状態を切り替え
watch(realtimeSpeaking, (isSpeaking) => {
  if (isSpeaking) {
    switchVideoState('speaking')
  } else {
    switchVideoState('idle')
  }
})

// すべてのデータを更新
const refreshAllData = () => {
  playerStats.value = getPlayerStats()
  rankingData.value = getRankingData()
  logData.value = getLogData(currentLogPage.value, 20)
  dataStats.value = getDataStats()
  updateSummaryData()
}

// サマリーデータを更新（フィルター対応）
const updateSummaryData = () => {
  // フィルターが設定されている場合はフィルター適用
  const hasFilters =
    summaryFilters.category ||
    summaryFilters.level ||
    summaryFilters.lesson ||
    summaryFilters.selectedPlayers.length > 0 ||
    summaryFilters.dateFrom ||
    summaryFilters.dateTo

  if (hasFilters) {
    summaryData.value = getFilteredSummaryData(summaryDisplayUnit.value, {
      category: summaryFilters.category || undefined,
      level: summaryFilters.level || undefined,
      lesson: summaryFilters.lesson || undefined,
      players: summaryFilters.selectedPlayers.length > 0 ? summaryFilters.selectedPlayers : undefined,
      dateFrom: summaryFilters.dateFrom ? new Date(summaryFilters.dateFrom + '-01') : null,
      dateTo: summaryFilters.dateTo ? new Date(summaryFilters.dateTo + '-01') : null
    })
  } else {
    // フィルターなしの場合は既存のメソッドを使用
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
}

// 表示単位が変更されたらサマリーデータを更新
watch(summaryDisplayUnit, () => {
  updateSummaryData()
})

// フィルターが変更されたらサマリーデータを更新
watch(
  () => [
    summaryFilters.category,
    summaryFilters.level,
    summaryFilters.lesson,
    summaryFilters.selectedPlayers,
    summaryFilters.dateFrom,
    summaryFilters.dateTo
  ],
  () => {
    updateSummaryData()
  },
  { deep: true }
)

// トレンドチャートのデータ
const trendChartLabels = computed(() => {
  return getMonthlyTrendData().labels
})

const trendChartDatasets = computed(() => {
  const data = getMonthlyTrendData()
  return [
    {
      label: 'プレイ回数',
      data: data.playCountData,
      type: 'line' as const,
      borderColor: '#3b82f6',
      backgroundColor: 'transparent',
      yAxisID: 'y'
    },
    {
      label: 'クリア回数',
      data: data.clearCountData,
      type: 'line' as const,
      borderColor: '#10b981',
      backgroundColor: 'transparent',
      yAxisID: 'y'
    },
    {
      label: '平均スコア',
      data: data.avgScoreData,
      type: 'bar' as const,
      borderColor: '#f97316',
      backgroundColor: 'rgba(251, 146, 60, 0.6)',
      yAxisID: 'y1'
    }
  ]
})

const resetChat = () => {
  // TODO: チャットリセット処理
  console.log('Reset chat')
}

// CSV読み込み状態
const csvUploadStatus = ref('')
const csvFileInput = ref<HTMLInputElement | null>(null)

const selectCSVFile = () => {
  // ファイル入力をトリガー
  if (csvFileInput.value) {
    csvFileInput.value.click()
  }
}

const handleCSVFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!file.name.endsWith('.csv')) {
    csvUploadStatus.value = 'エラー: CSVファイルを選択してください'
    return
  }

  csvUploadStatus.value = '読み込み中...'

  try {
    await loadFromCSVFile(file)
    refreshAllData()
    csvUploadStatus.value = `✓ ${dataStats.value.recordCount.toLocaleString()}件のデータを読み込みました`

    // ステータスを数秒後にクリア
    setTimeout(() => {
      csvUploadStatus.value = ''
    }, 5000)
  } catch (error) {
    console.error('CSV file load error:', error)
    csvUploadStatus.value = `エラー: ${error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました'}`
  }

  // 入力をリセット（同じファイルを再選択できるように）
  input.value = ''
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

// ログビュー用: 日時を "YYYY/MM/DD HH:mm" 形式でJST表示
const formatDateTime = (date: Date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  // 時間がある場合は「◯時間◯分◯秒」、ない場合は「◯分◯秒」
  if (hours > 0) {
    return `${hours}時間${mins}分${secs}秒`
  } else if (mins > 0) {
    return `${mins}分${secs}秒`
  } else {
    return `${secs}秒`
  }
}

// プレイヤー詳細を表示
const showPlayerDetails = (playerName: string) => {
  selectedPlayerDetails.value = getPlayerDetails(playerName)
}

// プレイヤー詳細を閉じる
const closePlayerDetails = () => {
  selectedPlayerDetails.value = null
}

// チャットメッセージエリアのref
const chatMessagesRef = ref<HTMLElement | null>(null)

// チャットテキストエリアのref
const chatTextareaRef = ref<HTMLTextAreaElement | null>(null)

// テキストエリアの高さを自動調整（Shift+Enter改行時）
const adjustTextareaHeight = () => {
  const textarea = chatTextareaRef.value
  if (textarea) {
    // 一度高さをリセットしてscrollHeightを正確に取得
    textarea.style.height = 'auto'
    // 最大高さを150pxに制限（約6行分）
    const maxHeight = 150
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${newHeight}px`
  }
}

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

  // テキストエリアの高さをリセット
  if (chatTextareaRef.value) {
    chatTextareaRef.value.style.height = 'auto'
  }

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
      await handleFileUpload(file)
    }
  }
  input.click()
}

// ドラッグ&ドロップハンドラ
const handleDragEnter = (e: DragEvent) => {
  // チャットタブまたはファイルタブがアクティブな場合のみ
  if (activeOperationTab.value !== 'chat' && activeOperationTab.value !== 'files') return
  dragCounter.value++
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  if (activeOperationTab.value !== 'chat' && activeOperationTab.value !== 'files') return
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
}

const handleDragOver = (e: DragEvent) => {
  if (activeOperationTab.value !== 'chat' && activeOperationTab.value !== 'files') return
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

const handleFileDrop = async (e: DragEvent) => {
  dragCounter.value = 0
  isDragging.value = false

  // チャットタブまたはファイルタブがアクティブでない場合は何もしない
  if (activeOperationTab.value !== 'chat' && activeOperationTab.value !== 'files') return

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  if (files.length > 1) {
    alert('ファイルは1つずつアップロードしてください')
    return
  }

  const file = files[0]
  await handleFileUpload(file)
}

// 対応ファイル形式
const allowedExtensions = ['.txt', '.pdf', '.ppt', '.pptx', '.xlsx', '.xls', '.mp3', '.wav', '.mp4', '.mov']

// ファイルアップロード処理
const handleFileUpload = async (file: File) => {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

  if (!allowedExtensions.includes(fileExtension)) {
    alert('対応していないファイル形式です。\n対応形式: ' + allowedExtensions.join(', '))
    return
  }

  // チャットにファイルメッセージを追加
  addChatMessage('user', '', {
    type: 'file',
    file: {
      name: file.name,
      size: file.size,
      type: file.type
    }
  })

  // PowerPointファイルの場合、PDF変換を推奨
  const isPowerPoint = ['.ppt', '.pptx'].includes(fileExtension)

  let messageContent = 'アップロードしたファイルは、どのタイプのデータですか？'
  if (isPowerPoint) {
    messageContent = `PowerPointファイルをアップロードしていただきました。<br><br>
      <strong style="color: #3b82f6;">💡 推奨：PDFに変換してアップロード</strong><br>
      PowerPointをPDFに変換してアップロードすると、図表・画像・レイアウトも含めて正確に解析できます。<br><br>
      このままPowerPointファイルを処理することもできますが、テキストのみの抽出となります。<br><br>
      どのタイプのデータですか？`
  }

  // AIの質問メッセージを追加
  addChatMessage('assistant', messageContent)

  // ファイルタイプ選択待ちの状態にする
  pendingFileForType.value = { file, name: file.name }

  scrollToBottom()
}

// ファイルタイプ選択
const selectFileType = async (dataType: string) => {
  console.log('📁 selectFileType called with:', dataType)
  if (!pendingFileForType.value) {
    console.log('❌ No pending file')
    return
  }

  const file = pendingFileForType.value.file
  const fileName = pendingFileForType.value.name
  console.log('📄 Uploading file:', fileName, 'size:', file.size)

  // タイプ選択のフィードバック
  const typeLabels: Record<string, string> = {
    sample: '見本データ',
    material: '教材データ',
    company: '自社データ',
    customer: '顧客データ',
    other: 'その他'
  }

  addChatMessage('user', `「${typeLabels[dataType]}」として登録します`)

  // ペンディング状態をクリア
  pendingFileForType.value = null

  // サーバーにアップロード
  const mappedType = dataType === 'material' ? 'textbook' : dataType === 'sample' ? 'roleplay' : 'other'
  console.log('🚀 Calling uploadFile with mappedType:', mappedType)

  try {
    const uploadedFile = await uploadFile(file, mappedType as 'textbook' | 'roleplay' | 'other')
    console.log('📤 Upload result:', uploadedFile)

    if (uploadedFile) {
      addChatMessage('assistant', `「${fileName}」を${typeLabels[dataType]}として登録しました。\n\n他にもファイルがあればアップロードしてください。または、ロープレ設計を進めることもできます。`)
    } else {
      console.log('❌ Upload returned null')
      addChatMessage('assistant', `ファイルのアップロードに失敗しました。もう一度お試しください。`)
    }
  } catch (error) {
    console.error('❌ Upload error:', error)
    addChatMessage('assistant', `ファイルのアップロードに失敗しました。エラー: ${error}`)
  }

  scrollToBottom()
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

    // 選択中のレッスンがあればデータを更新
    if (selectedLesson.value) {
      updateSelectedLessonData(design, result)
    }

    // Switch to flow tab to show generated scripts
    activeDesignTab.value = 'flow'

  } catch (error) {
    console.error('Roleplay generation failed:', error)
    alert('ロープレ生成に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
  }
}

// 選択中のレッスンデータを更新
const updateSelectedLessonData = (design: any, result: any) => {
  const lessonId = selectedLesson.value
  if (!lessonId) return

  for (const category of courseCategories.value) {
    for (const level of category.levels) {
      const lesson = level.lessons.find(l => l.id === lessonId)
      if (lesson) {
        lesson.design = design
        lesson.scripts = result.scripts
        lesson.systemPrompts = result.systemPrompts
        console.log('Updated lesson data:', lesson)
        return
      }
    }
  }
}

// ===== コース管理関数 =====

// ユニークID生成
const generateId = () => Math.random().toString(36).substring(2, 11)

// カテゴリー追加
const addNewCategory = () => {
  const name = prompt('カテゴリー名を入力してください:')
  if (!name?.trim()) return

  const newCategory: Category = {
    id: generateId(),
    name: name.trim(),
    levels: []
  }
  courseCategories.value.push(newCategory)
  expandedCategories.value.add(newCategory.id)
}

// レベル追加
const addLevel = (categoryId: string) => {
  const category = courseCategories.value.find(c => c.id === categoryId)
  if (!category) return

  const levelNumber = category.levels.length + 1
  const newLevel: Level = {
    id: generateId(),
    name: `Lv.${levelNumber}`,
    categoryId,
    lessons: []
  }
  category.levels.push(newLevel)
  expandedLevels.value.add(newLevel.id)
}

// レッスン追加
const addLesson = (categoryId: string, levelId: string) => {
  const category = courseCategories.value.find(c => c.id === categoryId)
  const level = category?.levels.find(l => l.id === levelId)
  if (!level) return

  const name = prompt('レッスン名を入力してください:')
  if (!name?.trim()) return

  const newLesson: Lesson = {
    id: generateId(),
    name: name.trim(),
    levelId,
    categoryId
  }
  level.lessons.push(newLesson)
}

// カテゴリー名変更
const renameCategory = (categoryId: string) => {
  const category = courseCategories.value.find(c => c.id === categoryId)
  if (!category) return

  const name = prompt('新しいカテゴリー名を入力してください:', category.name)
  if (!name?.trim()) return

  category.name = name.trim()
}

// レッスン名変更
const renameLesson = (categoryId: string, levelId: string, lessonId: string) => {
  const category = courseCategories.value.find(c => c.id === categoryId)
  const level = category?.levels.find(l => l.id === levelId)
  const lesson = level?.lessons.find(l => l.id === lessonId)
  if (!lesson) return

  const name = prompt('新しいレッスン名を入力してください:', lesson.name)
  if (!name?.trim()) return

  lesson.name = name.trim()
}

// カテゴリー削除
const deleteCategory = (categoryId: string) => {
  const category = courseCategories.value.find(c => c.id === categoryId)
  if (!category) return

  if (!confirm(`カテゴリー「${category.name}」を削除しますか？\n含まれるレベル・レッスンも全て削除されます。`)) return

  courseCategories.value = courseCategories.value.filter(c => c.id !== categoryId)
  expandedCategories.value.delete(categoryId)
}

// レベル削除
const deleteLevel = (categoryId: string, levelId: string) => {
  const category = courseCategories.value.find(c => c.id === categoryId)
  const level = category?.levels.find(l => l.id === levelId)
  if (!category || !level) return

  if (!confirm(`${level.name}を削除しますか？\n含まれるレッスンも全て削除されます。`)) return

  category.levels = category.levels.filter(l => l.id !== levelId)
  // レベル番号を再割り当て
  category.levels.forEach((l, i) => {
    l.name = `Lv.${i + 1}`
  })
  expandedLevels.value.delete(levelId)
}

// レッスン削除
const deleteLesson = (categoryId: string, levelId: string, lessonId: string) => {
  const category = courseCategories.value.find(c => c.id === categoryId)
  const level = category?.levels.find(l => l.id === levelId)
  if (!level) return

  const lesson = level.lessons.find(l => l.id === lessonId)
  if (!lesson) return

  if (!confirm(`レッスン「${lesson.name}」を削除しますか？`)) return

  level.lessons = level.lessons.filter(l => l.id !== lessonId)
}

// 展開/折りたたみトグル
const toggleCategoryExpand = (categoryId: string) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

const toggleLevelExpand = (levelId: string) => {
  if (expandedLevels.value.has(levelId)) {
    expandedLevels.value.delete(levelId)
  } else {
    expandedLevels.value.add(levelId)
  }
}

// コンテキストメニュー表示
const showContextMenu = (e: MouseEvent, type: 'category' | 'level' | 'lesson', item: Category | Level | Lesson) => {
  e.preventDefault()
  e.stopPropagation()
  contextMenu.value = {
    show: true,
    x: e.clientX,
    y: e.clientY,
    type,
    item
  }
}

// コンテキストメニューを閉じる
const closeContextMenu = () => {
  contextMenu.value.show = false
}

// ドラッグ開始
const onDragStart = (e: DragEvent, lesson: Lesson) => {
  draggedLesson.value = lesson
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

// ドラッグオーバー
const onDragOver = (e: DragEvent, lessonId: string) => {
  e.preventDefault()
  dragOverLessonId.value = lessonId
}

// ドラッグリーブ
const onDragLeave = () => {
  dragOverLessonId.value = null
}

// ドロップ
const onDrop = (e: DragEvent, targetLesson: Lesson) => {
  e.preventDefault()
  dragOverLessonId.value = null

  if (!draggedLesson.value || draggedLesson.value.id === targetLesson.id) {
    draggedLesson.value = null
    return
  }

  // 同じレベル内の場合のみ並び替え
  if (draggedLesson.value.levelId === targetLesson.levelId) {
    const category = courseCategories.value.find(c => c.id === targetLesson.categoryId)
    const level = category?.levels.find(l => l.id === targetLesson.levelId)
    if (level) {
      const fromIndex = level.lessons.findIndex(l => l.id === draggedLesson.value!.id)
      const toIndex = level.lessons.findIndex(l => l.id === targetLesson.id)

      if (fromIndex !== -1 && toIndex !== -1) {
        const [removed] = level.lessons.splice(fromIndex, 1)
        level.lessons.splice(toIndex, 0, removed)
      }
    }
  }

  draggedLesson.value = null
}

// ドラッグ終了
const onDragEnd = () => {
  draggedLesson.value = null
  dragOverLessonId.value = null
}

// レッスン選択（コースタブから）
const selectLesson = (lesson: Lesson) => {
  selectedLesson.value = lesson.id
  loadLessonData(lesson)
}

// レッスン選択（ドロップダウンから）
const onLessonSelect = () => {
  const lessonId = selectedLesson.value
  if (!lessonId) return

  // コースデータからレッスンを検索
  for (const category of courseCategories.value) {
    for (const level of category.levels) {
      const lesson = level.lessons.find(l => l.id === lessonId)
      if (lesson) {
        loadLessonData(lesson)
        return
      }
    }
  }
}

// レッスンデータをロード
const loadLessonData = (lesson: Lesson) => {
  console.log('Loading lesson data:', lesson)

  // レッスンのスクリプトとプロンプトをロード
  if (lesson.scripts) {
    generatedScripts.value = { ...lesson.scripts }
  }
  if (lesson.systemPrompts) {
    generatedSystemPrompts.value = { ...lesson.systemPrompts }
  }

  // ロープレ設計フォームにデザインをセット
  if (lesson.design && roleplayDesignFormRef.value) {
    roleplayDesignFormRef.value.setDesign(lesson.design)
  }
}

// ===== 台本編集関数 =====

type ScriptMode = 'subtitle' | 'points' | 'practice'

// 台本カードの展開トグル
const toggleScriptExpand = (mode: ScriptMode) => {
  scriptExpanded.value[mode] = !scriptExpanded.value[mode]
}

// 台本編集モード開始
const startScriptEdit = (mode: ScriptMode) => {
  const script = generatedScripts.value[mode]
  editingScriptContent.value[mode] = typeof script === 'string' ? script : JSON.stringify(script, null, 2)
  scriptEditMode.value[mode] = true
}

// 台本編集を保存
const saveScriptEdit = (mode: ScriptMode) => {
  try {
    const content = editingScriptContent.value[mode]
    if (content) {
      // JSONとしてパース可能か確認
      try {
        generatedScripts.value[mode] = JSON.parse(content)
      } catch {
        // JSONでなければそのまま保存
        generatedScripts.value[mode] = content
      }
    }
    scriptEditMode.value[mode] = false
  } catch (error) {
    console.error('Failed to save script:', error)
    alert('台本の保存に失敗しました。')
  }
}

// 台本編集をキャンセル
const cancelScriptEdit = (mode: ScriptMode) => {
  scriptEditMode.value[mode] = false
  editingScriptContent.value[mode] = undefined
}

// 台本をフォーマットして表示
const formatScript = (script: any): string => {
  if (!script) return ''
  if (typeof script === 'string') {
    try {
      const parsed = JSON.parse(script)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return script
    }
  }
  return JSON.stringify(script, null, 2)
}

// 台本タイトル取得
const getScriptTitle = (mode: ScriptMode): string => {
  const titles: Record<ScriptMode, string> = {
    subtitle: '台本モード - 会話の流れ',
    points: 'ポイントモード - 会話の流れ',
    practice: '練習モード - 会話の流れ'
  }
  return titles[mode]
}

// ===== プロンプト編集関数 =====

type PromptMode = 'subtitle' | 'aiDemo' | 'confirmation' | 'practice'

// プロンプトカードの展開トグル
const togglePromptExpand = (mode: PromptMode) => {
  promptExpanded.value[mode] = !promptExpanded.value[mode]
}

// プロンプト編集モード開始
const startPromptEdit = (mode: PromptMode) => {
  editingPromptContent.value[mode] = generatedSystemPrompts.value[mode] || ''
  promptEditMode.value[mode] = true
}

// プロンプト編集を保存
const savePromptEdit = (mode: PromptMode) => {
  generatedSystemPrompts.value[mode] = editingPromptContent.value[mode]
  promptEditMode.value[mode] = false
}

// プロンプト編集をキャンセル
const cancelPromptEdit = (mode: PromptMode) => {
  promptEditMode.value[mode] = false
  editingPromptContent.value[mode] = undefined
}

// プロンプトタイトル取得
const getPromptTitle = (mode: PromptMode): string => {
  const titles: Record<PromptMode, string> = {
    subtitle: '台本モード',
    aiDemo: 'お手本モード',
    confirmation: '確認モード',
    practice: '実践モード'
  }
  return titles[mode]
}

const selectMode = (mode: string) => {
  selectedMode.value = mode
  console.log('Selected mode:', mode)

  // モードに応じたシステムプロンプトを取得してRealtime APIに送信
  let systemPrompt = ''
  switch (mode) {
    case 'subtitle':
      systemPrompt = generatedSystemPrompts.value.subtitle || ''
      break
    case 'ai-demo':
      systemPrompt = generatedSystemPrompts.value.aiDemo || ''
      break
    case 'confirmation':
      systemPrompt = generatedSystemPrompts.value.confirmation || ''
      break
    case 'practice':
      systemPrompt = generatedSystemPrompts.value.practice || ''
      break
  }

  // Realtime APIの接続中であればシステムプロンプトを更新
  if (isConnected.value && systemPrompt) {
    updateRealtimeInstructions(systemPrompt)
    console.log('Updated system prompt for mode:', mode)
  }
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
  isCharacterSettingsOpen.value = true
}

const applyCharacterSettings = (settings: CharacterSettings) => {
  characterSettings.value = settings
  selectedCharacter.value = settings.character
  voiceType.value = settings.voice
  console.log('Applied character settings:', settings)
}

const togglePlayComponent = () => {
  isDesignExpanded.value = !isDesignExpanded.value
  console.log('Design expanded:', isDesignExpanded.value)
}

// フィードバック関連の関数
const showFeedback = (data: FeedbackData) => {
  feedbackData.value = data
  isFeedbackVisible.value = true
}

const closeFeedback = () => {
  isFeedbackVisible.value = false
}

const retryPractice = () => {
  isFeedbackVisible.value = false
  // 実践モードを再開
  if (selectedMode.value === 'practice') {
    toggleRoleplay()
  }
}

// 実践モード終了時にフィードバックを表示（デモ用）
const handlePracticeEnd = () => {
  // TODO: 実際のフィードバックデータはAIから取得
  const demoFeedback: FeedbackData = {
    score: 75,
    achieved: [
      '挨拶が適切でした',
      'お客様のニーズを確認できました',
      '商品説明が分かりやすかったです'
    ],
    improvements: [
      'クロージングのタイミングをもう少し早くしましょう',
      '価格説明時にもう少し自信を持って話しましょう'
    ],
    summary: '全体的に良い対応でした。クロージングスキルを磨くことで、さらに成約率が上がるでしょう。'
  }
  showFeedback(demoFeedback)
}

// Realtime APIの終了時にフィードバックを表示（実践モードの場合）
watch(isPlaying, (playing, wasPlaying) => {
  if (wasPlaying && !playing && selectedMode.value === 'practice') {
    // 少し遅延してからフィードバックを表示
    setTimeout(() => {
      handlePracticeEnd()
    }, 500)
  }
})
</script>
