<template>
  <div class="p-5">
    <div class="summary-container" :class="{ 'filter-collapsed': isFilterCollapsed }">
      <!-- Left Filters -->
      <div class="summary-filters">
        <div class="summary-filters-sticky">
          <DataFilter
            :filter-options="filterOptions"
            @update:filters="handleFiltersUpdate"
            @update:collapsed="handleFilterCollapsed"
          />
        </div>
      </div>

      <!-- Right Content -->
      <div class="summary-content">
        <UCard class="records-card">
          <div class="records-card-header">
            <div class="records-title">
              <UIcon name="i-lucide-award" class="records-title-icon" />
              個人記録
            </div>
            <div class="records-subtitle">コース・レベル・レッスン別の記録一覧</div>
          </div>

          <!-- 選択中のフィルター表示 -->
          <div v-if="hasActiveFilters" class="active-filters-bar">
            <UIcon name="i-lucide-filter" class="filter-bar-icon" />
            <span class="filter-bar-text">フィルター適用中</span>
          </div>

          <!-- コースツリー -->
          <div class="records-tree">
            <div v-if="personalRecords.length === 0" class="empty-state">
              <UIcon name="i-lucide-inbox" class="empty-icon" />
              <p class="empty-text">該当するデータがありません</p>
              <p class="empty-hint">フィルターを調整してみてください</p>
            </div>

            <!-- コース（カテゴリー）ループ -->
            <div v-for="course in personalRecords" :key="course.category" class="course-item">
              <div
                class="course-header"
                @click="toggleCourse(course.category)"
              >
                <UIcon
                  :name="expandedCourses[course.category] ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  class="expand-icon"
                />
                <UIcon name="i-lucide-folder" class="course-icon" />
                <span class="course-name">{{ course.category }}</span>
                <UBadge color="neutral" variant="subtle" size="xs">
                  {{ getLessonCount(course) }}レッスン
                </UBadge>
              </div>

              <!-- レベルリスト（カテゴリー開いたら全て表示） -->
              <div v-show="expandedCourses[course.category]" class="level-list">
                <div v-for="level in course.levels" :key="`${course.category}-${level.level}`" class="level-item">
                  <!-- レベルラベル（左寄せ小さく表示） -->
                  <div class="level-label">
                    <span class="level-badge">Lv.{{ level.level }}</span>
                  </div>

                  <!-- レッスンリスト（常に表示） -->
                  <div class="lesson-list-nested">
                    <div
                      v-for="lesson in level.lessons"
                      :key="lesson.title"
                      class="lesson-item"
                      :class="{ 'expanded': expandedLessons[lesson.title] }"
                    >
                      <!-- レッスン行（クリックで開閉） -->
                      <div
                        class="lesson-row"
                        @click="toggleLesson(lesson.title)"
                      >
                        <UIcon
                          :name="expandedLessons[lesson.title] ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                          class="expand-icon"
                        />
                        <UIcon name="i-lucide-book-open" class="lesson-icon" />
                        <span class="lesson-title">{{ lesson.title }}</span>
                        <div class="lesson-scores">
                          <div class="score-item best">
                            <span class="score-label">ベスト</span>
                            <span class="score-value" :class="getScoreClass(lesson.bestScore)">
                              {{ lesson.bestScore }}点
                            </span>
                          </div>
                          <div class="score-item latest">
                            <span class="score-label">最新</span>
                            <span class="score-value" :class="getScoreClass(lesson.latestScore)">
                              {{ lesson.latestScore }}点
                            </span>
                          </div>
                          <div class="score-item count">
                            <span class="score-label">プレイ</span>
                            <span class="score-value">{{ lesson.playCount }}回</span>
                          </div>
                        </div>
                      </div>

                      <!-- レッスン詳細（ベストスコア + 最新3回分） -->
                      <div v-show="expandedLessons[lesson.title]" class="lesson-detail">
                        <div class="session-list">
                          <!-- ベストスコアのセッション -->
                          <div
                            v-if="getBestSession(lesson)"
                            class="session-item best-session"
                            :class="{ 'expanded': expandedSessions[`${lesson.title}-best`] }"
                          >
                            <!-- ベストスコア行 -->
                            <div
                              class="session-row session-row-best"
                              @click="toggleSession(lesson.title, 'best')"
                            >
                              <UIcon
                                :name="expandedSessions[`${lesson.title}-best`] ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                                class="expand-icon-sm"
                              />
                              <UIcon name="i-lucide-trophy" class="best-icon" />
                              <span class="best-label">ベスト</span>
                              <span class="session-score score-excellent">
                                {{ getBestSession(lesson)!.score }}点
                              </span>
                              <span class="session-time">{{ getBestSession(lesson)!.playTime }}秒</span>
                              <span class="session-date">{{ formatDateTime(getBestSession(lesson)!.date) }}</span>
                              <span class="session-player">{{ getBestSession(lesson)!.player }}</span>
                            </div>

                            <!-- ベストセッション詳細 -->
                            <SessionDetail
                              v-show="expandedSessions[`${lesson.title}-best`]"
                              :session="getBestSession(lesson)!"
                            />
                          </div>

                          <!-- 最新3回分のセッション -->
                          <div
                            v-for="(session, idx) in getLatestSessions(lesson, 3)"
                            :key="idx"
                            class="session-item"
                            :class="{ 'expanded': expandedSessions[`${lesson.title}-${idx}`] }"
                          >
                            <!-- セッション行 -->
                            <div
                              class="session-row"
                              @click="toggleSession(lesson.title, idx)"
                            >
                              <UIcon
                                :name="expandedSessions[`${lesson.title}-${idx}`] ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                                class="expand-icon-sm"
                              />
                              <span class="recent-label">{{ idx === 0 ? '最新' : `${idx + 1}回前` }}</span>
                              <span class="session-score" :class="getScoreClass(session.score)">
                                {{ session.score }}点
                              </span>
                              <span class="session-time">{{ session.playTime }}秒</span>
                              <span class="session-date">{{ formatDateTime(session.date) }}</span>
                              <span class="session-player">{{ session.player }}</span>
                            </div>

                            <!-- セッション詳細 -->
                            <SessionDetail
                              v-show="expandedSessions[`${lesson.title}-${idx}`]"
                              :session="session"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

// デモデータ管理
const { isDataLoaded, loadDemoData, getFilterOptions, getFilteredPersonalRecords } = useDemoData()

// 現在のフィルター値
const currentFilters = ref<{
  lessons?: string[]
  levels?: string[]
  players?: string[]
  dateFrom: Date | null
  dateTo: Date | null
}>({
  dateFrom: null,
  dateTo: null
})

// フィルターオプション
const filterOptions = computed(() => getFilterOptions())

// フィルター折りたたみ状態
const isFilterCollapsed = ref(false)

const handleFilterCollapsed = (collapsed: boolean) => {
  isFilterCollapsed.value = collapsed
}

// フィルター適用中かどうか
const hasActiveFilters = computed(() => {
  return (currentFilters.value.lessons && currentFilters.value.lessons.length > 0) ||
    (currentFilters.value.levels && currentFilters.value.levels.length > 0) ||
    (currentFilters.value.players && currentFilters.value.players.length > 0) ||
    currentFilters.value.dateFrom !== null ||
    currentFilters.value.dateTo !== null
})

// 展開状態
const expandedCourses = reactive<Record<string, boolean>>({})
const expandedLessons = reactive<Record<string, boolean>>({})
const expandedSessions = reactive<Record<string, boolean>>({})

// 個人記録データ
const personalRecords = computed(() => getFilteredPersonalRecords(currentFilters.value))

// フィルター更新ハンドラ
const handleFiltersUpdate = (filters: {
  lessons?: string[]
  levels?: string[]
  players?: string[]
  dateFrom: Date | null
  dateTo: Date | null
}) => {
  currentFilters.value = filters
}

// レッスン数をカウント
const getLessonCount = (course: { levels: { lessons: any[] }[] }) => {
  return course.levels.reduce((sum, level) => sum + level.lessons.length, 0)
}

// 展開トグル
const toggleCourse = (category: string) => {
  expandedCourses[category] = !expandedCourses[category]
}

const toggleLesson = (title: string) => {
  expandedLessons[title] = !expandedLessons[title]
}

const toggleSession = (lessonTitle: string, idx: number | string) => {
  const key = `${lessonTitle}-${idx}`
  expandedSessions[key] = !expandedSessions[key]
}

// ベストスコアのセッションを取得
const getBestSession = (lesson: { sessions: any[], bestScore: number }) => {
  return lesson.sessions.find(s => s.score === lesson.bestScore)
}

// 最新N回分のセッションを取得（日付降順で既にソート済み）
const getLatestSessions = (lesson: { sessions: any[] }, count: number) => {
  return lesson.sessions.slice(0, count)
}

// 日時フォーマット
const formatDateTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// スコアに応じたクラスを取得
const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 70) return 'score-good'
  if (score >= 50) return 'score-average'
  return 'score-low'
}

// 初期化
onMounted(async () => {
  if (!isDataLoaded.value) {
    try {
      await loadDemoData()
    } catch (error) {
      console.error('デモデータの読み込みに失敗しました:', error)
    }
  }
})
</script>

<style scoped>
/* ========================================
   レコードカード - Nuxt UI Dashboard Style
   ======================================== */
.records-card {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  box-shadow: var(--ui-shadow-sm);
}

.records-card-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ui-border);
}

.records-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  margin-bottom: 4px;
}

.records-title-icon {
  font-size: 18px;
  color: #f59e0b;
}

.records-subtitle {
  font-size: 12px;
  color: var(--ui-text-muted);
  margin-left: 28px;
}

/* アクティブフィルターバー */
.active-filters-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: var(--ui-radius);
  margin-bottom: 16px;
}

.filter-bar-icon {
  font-size: 14px;
  color: #0ea5e9;
}

.filter-bar-text {
  font-size: 12px;
  font-weight: 500;
  color: #0284c7;
}

/* 空の状態 */
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: var(--ui-text-muted);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.7;
}

/* レコードツリー */
.records-tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* コースアイテム */
.course-item {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  overflow: hidden;
}

.course-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--ui-bg-elevated);
  cursor: pointer;
  transition: background 0.15s ease;
}

.course-header:hover {
  background: var(--ui-bg-accented);
}

.expand-icon {
  font-size: 12px;
  color: var(--ui-text-dimmed);
  width: 16px;
  flex-shrink: 0;
}

.course-icon {
  font-size: 16px;
  color: #f59e0b;
}

.course-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

/* レベルリスト */
.level-list {
  padding: 8px 8px 8px 24px;
  border-top: 1px solid var(--ui-border);
}

.level-item {
  margin-bottom: 6px;
}

.level-item:last-child {
  margin-bottom: 0;
}

/* レベルラベル（左寄せ小さく表示） */
.level-label {
  padding: 4px 0 6px 0;
}

.level-badge {
  font-size: 11px;
  font-weight: 600;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

/* レッスンリスト（ネスト構造） */
.lesson-list-nested {
  padding: 0 0 4px 16px;
  border-left: 2px solid rgba(139, 92, 246, 0.2);
  margin-left: 4px;
}

.lesson-item {
  margin-bottom: 4px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  overflow: hidden;
  transition: all 0.15s ease;
}

.lesson-item:last-child {
  margin-bottom: 0;
}

.lesson-item.expanded {
  border-color: var(--ui-primary);
  box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.1);
}

.lesson-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.lesson-row:hover {
  background: var(--ui-bg-elevated);
}

.lesson-icon {
  font-size: 14px;
  color: #10b981;
}

.lesson-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--ui-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lesson-scores {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.score-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--ui-text-muted);
  text-transform: uppercase;
}

.score-value {
  font-size: 13px;
  font-weight: 600;
}

/* スコア色分け */
.score-excellent { color: #10b981; }
.score-good { color: #0ea5e9; }
.score-average { color: #f59e0b; }
.score-low { color: #ef4444; }

/* レッスン詳細 */
.lesson-detail {
  border-top: 1px solid var(--ui-border);
  background: var(--ui-bg-muted);
}

.session-list {
  padding: 8px 12px;
}

.session-item {
  margin-bottom: 4px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  overflow: hidden;
}

.session-item:last-child {
  margin-bottom: 0;
}

.session-item.expanded {
  border-color: rgba(14, 165, 233, 0.4);
}

/* ベストスコアのセッション */
.session-item.best-session {
  background: linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%);
  border-color: #f59e0b;
}

.session-item.best-session .session-row-best {
  background: transparent;
}

.session-row-best {
  background: rgba(245, 158, 11, 0.05);
}

.best-icon {
  font-size: 14px;
  color: #f59e0b;
}

.best-label {
  font-size: 11px;
  font-weight: 700;
  color: #b45309;
  background: rgba(245, 158, 11, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  min-width: 50px;
  text-align: center;
}

.recent-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--ui-text-muted);
  background: var(--ui-bg-elevated);
  padding: 2px 8px;
  border-radius: 4px;
  min-width: 50px;
  text-align: center;
}

.session-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
  font-size: 12px;
}

.session-row:hover {
  background: var(--ui-bg-elevated);
}

.expand-icon-sm {
  font-size: 10px;
  color: var(--ui-text-dimmed);
  width: 12px;
  flex-shrink: 0;
}

.session-date {
  color: var(--ui-text-muted);
  min-width: 130px;
}

.session-player {
  flex: 1;
  color: var(--ui-text);
  font-weight: 500;
}

.session-score {
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.session-time {
  color: var(--ui-text-muted);
  min-width: 50px;
  text-align: right;
}

/* ========================================
   レスポンシブ
   ======================================== */
@media (max-width: 768px) {
  .lesson-scores {
    flex-direction: column;
    gap: 4px;
  }

  .score-item {
    flex-direction: row;
    gap: 6px;
    min-width: auto;
  }

  .session-row {
    flex-wrap: wrap;
  }

  .session-date {
    min-width: auto;
  }

  .session-player {
    width: 100%;
    order: -1;
    margin-bottom: 4px;
  }
}

@media (max-width: 480px) {
  .records-card-header {
    padding-bottom: 12px;
    margin-bottom: 12px;
  }

  .records-title {
    font-size: 14px;
  }

  .course-header {
    padding: 12px;
  }

  .level-list {
    padding-left: 16px;
  }

  .lesson-list {
    padding-left: 16px;
  }

  .lesson-row {
    padding: 10px 12px;
  }

  .lesson-title {
    font-size: 12px;
  }
}
</style>
