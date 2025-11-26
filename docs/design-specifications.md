# デザイン仕様書

このドキュメントは、Naretore管理画面のデザイン仕様を網羅的にまとめたものです。

## 1. フレームワーク・技術スタック

### 1.1 使用技術
- **フレームワーク**: Nuxt 3 + Vue 3 + TypeScript
- **UIフレームワーク**: NuxtUI v3
- **CSSフレームワーク**: Tailwind CSS v4
- **アイコン**: Lucide Icons (`i-lucide-*`)
- **チャートライブラリ**: Chart.js

### 1.2 NuxtUIコンポーネント使用一覧
| コンポーネント | 用途 |
|--------------|------|
| UApp | アプリケーションルート |
| UCard | カード型コンテナ |
| UButton | ボタン |
| UIcon | アイコン表示 |
| USelect | セレクトボックス |
| UCheckbox | チェックボックス |
| UPopover | ポップオーバー |
| UInput | 入力フィールド |

---

## 2. カラーパレット

### 2.1 プライマリカラー（Sky Blue）
```css
--color-primary-50: #f0f9ff
--color-primary-100: #e0f2fe
--color-primary-200: #bae6fd
--color-primary-300: #7dd3fc
--color-primary-400: #38bdf8
--color-primary-500: #0ea5e9
--color-primary-600: #0284c7
--color-primary-700: #0369a1
--color-primary: #0ea5e9
```

### 2.2 セカンダリカラー（Slate）
```css
--color-secondary-50: #f8fafc
--color-secondary-100: #f1f5f9
--color-secondary-200: #e2e8f0
--color-secondary-300: #cbd5e1
--color-secondary-400: #94a3b8
--color-secondary-500: #64748b
--color-secondary-600: #475569
--color-secondary-700: #334155
--color-secondary-800: #1e293b
--color-secondary-900: #0f172a
```

### 2.3 セマンティックカラー
| 色名 | 用途 | カラーコード |
|-----|------|-------------|
| Success | 成功・クリア | #10b981 (Emerald) |
| Warning | 警告・ランキング | #f59e0b (Amber) |
| Error | エラー | #f43f5e (Rose) |
| Info | 情報・ログ | #6366f1 (Indigo) |
| Chart | チャート | #8b5cf6 (Violet) |

### 2.4 カード左ボーダー色
各ページのカードは左側に4pxの色付きボーダーを持つ:
| ページ | カード | 色 |
|-------|-------|-----|
| サマリー | 統計カード | #0ea5e9 (Sky) |
| サマリー | チャートカード | #8b5cf6 (Violet) |
| サマリー | テーブルカード | #10b981 (Emerald) |
| 個人レコード | ランキングカード | #f59e0b (Amber) |
| ログ | ログカード | #6366f1 (Indigo) |

---

## 3. フォント設定

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
font-size: 14px;
line-height: 1.5;
color: #334155;
```

---

## 4. レイアウト構造

### 4.1 全体レイアウト
```
┌─────────────────────────────────────────────────────┐
│  AppSidebar (260px)  │  Main Content Area          │
│  ├─ Logo + Title     │  ├─ AppHeader (64px)        │
│  ├─ Navigation       │  └─ Page Content             │
│  └─ Footer           │                              │
└─────────────────────────────────────────────────────┘
```

### 4.2 サイドバー
- **幅**: 260px（デスクトップ）
- **背景**: 白 (#ffffff)
- **境界線**: 右側に1px (#e2e8f0)
- **ナビゲーションアイテム**:
  - アクティブ時: グラデーション背景 + 左ボーダー3px (#0ea5e9)
  - ホバー時: 薄いグレー背景 (#f1f5f9)

### 4.3 ヘッダー
- **高さ**: 64px
- **背景**: 白
- **下部境界線**: 1px (#e2e8f0)
- **position**: sticky (top: 0)
- **z-index**: 40

### 4.4 フィルターパネル（サマリー/ランキング/ログ）
- **幅**: 300px（展開時）、50px（折りたたみ時）
- **背景**: 白
- **境界線**: 右側に1px (#e2e8f0)
- **アニメーション**: width 0.3s ease

---

## 5. コンポーネント詳細

### 5.1 統計カード（サマリーページ）
```css
.stats-card {
  border-left: 4px solid #0ea5e9;
}

.stat-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 3px solid transparent;
}

/* 各統計項目の色分け */
.stat-time { border-left-color: #0ea5e9; }    /* 時間 - Sky */
.stat-play { border-left-color: #10b981; }    /* プレイ - Emerald */
.stat-players { border-left-color: #8b5cf6; } /* プレイヤー - Violet */
.stat-lessons { border-left-color: #f59e0b; } /* レッスン - Amber */
```

### 5.2 カードヘッダー
各カードのヘッダーは統一されたスタイル:
```css
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.card-header-icon {
  font-size: 20px;
  /* 色はカードのテーマカラーに合わせる */
}
```

### 5.3 ツールバー
テーブル上部のツールバー:
```css
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  background: white;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}
```

### 5.4 データテーブル
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
  color: #475569;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}
```

### 5.5 ランキング行ハイライト
```css
/* 1位 - ゴールド */
.row-gold {
  background: linear-gradient(90deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%) !important;
}

/* 2位 - シルバー */
.row-silver {
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%) !important;
}

/* 3位 - ブロンズ */
.row-bronze {
  background: linear-gradient(90deg, #fed7aa 0%, #fdba74 50%, #fed7aa 100%) !important;
}
```

### 5.6 ページネーション
```css
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.pagination-current {
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 4px 10px;
  border-radius: 6px;
}
```

### 5.7 列設定ポップアップ
```css
.column-settings-popup {
  padding: 8px;
  min-width: 180px;
}

.column-settings-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.column-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
}

.column-option:hover {
  background: #f1f5f9;
}
```

---

## 6. トレンドチャート仕様

### 6.1 チャートタイプ
- 複合チャート: 折れ線グラフ + 棒グラフ + 面グラフ

### 6.2 データセット
| データ | タイプ | 色 | Y軸 |
|-------|-------|-----|-----|
| ユニークプレイ人数 | 面グラフ | #8b5cf6 (30%透過) | 左軸 |
| クリア数 | 棒グラフ | #10b981 (60%透過) | 左軸 |
| プレイ数 | 棒グラフ | #3b82f6 (80%透過) | 左軸 |
| 平均スコア | 折れ線 | #f97316 | 右軸 |
| ベストスコア | 折れ線 | #ef4444 | 右軸 |

### 6.3 折れ線グラフ設定
```javascript
tension: 0,         // 直線で点を結ぶ（曲線にしない）
pointRadius: 4,     // 点のサイズ
pointHoverRadius: 6,
spanGaps: false     // データがない点は線でつながない
```

### 6.4 Y軸設定
- **左軸 (y)**: 回数（プレイ回数、クリア回数、人数）
- **右軸 (y1)**: スコア（0-100固定）
- 右軸のグリッド線は非表示

### 6.5 最小表示月数
- 最低6ヶ月分を表示
- データが6ヶ月未満の場合、前月を追加して6ヶ月表示

---

## 7. フィルターコンポーネント

### 7.1 構造
- 期間絞り込み（常時展開）
- レッスンで絞り込み（折りたたみ可）
- レベルで絞り込み（折りたたみ可）
- プレイヤー絞り込み（折りたたみ可）

### 7.2 スタイル
```css
.filter-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 12px;
}

.filter-section-primary {
  border-color: #0ea5e9;
  border-left-width: 4px;
}

.filter-section-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #f8fafc;
  cursor: pointer;
}

.filter-count {
  font-size: 11px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  padding: 3px 10px;
  border-radius: 12px;
}
```

---

## 8. ロープレ構築ビュー

### 8.1 グリッドレイアウト
```css
.content-creation-container {
  display: grid;
  grid-template-columns: 450px 1fr;
  grid-template-rows: auto 1fr;
  gap: 20px;
  height: calc(100vh - 65px);
  padding: 20px;
}
```

### 8.2 操作コンポーネント
- 左列で2行分スパン
- タブ: チャット / コース / ファイル

### 8.3 モード選択
- 4つのモード: 台本モード / お手本モード / 確認モード / 実戦モード
- アクティブ時: グラデーション背景

### 8.4 設計コンポーネント
- タブ: ロープレ設計 / 会話の流れ / 設計書
- 展開/折りたたみアニメーション

---

## 9. アニメーション

### 9.1 基本アニメーション
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 9.2 トランジション
```css
.transition-all {
  transition-property: all;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 10. レスポンシブ対応

### 10.1 ブレークポイント
| サイズ | 幅 | 対応 |
|-------|-----|------|
| デスクトップ | > 1024px | フルレイアウト |
| タブレット | 768px - 1024px | サイドバー折りたたみ |
| モバイル | < 768px | シングルカラム |

### 10.2 サイドバー
- **デスクトップ**: 固定表示 (260px)
- **モバイル**: オーバーレイ表示（ハンバーガーメニューで開閉）

### 10.3 統計グリッド
```css
/* デスクトップ */
grid-template-columns: repeat(4, 1fr);

/* タブレット */
@media (max-width: 1024px) {
  grid-template-columns: repeat(2, 1fr);
}

/* モバイル */
@media (max-width: 640px) {
  grid-template-columns: 1fr;
}
```

---

## 11. スクロールバー

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

---

## 12. アイコン一覧

### 12.1 ナビゲーション
| アイコン | 用途 |
|---------|------|
| i-lucide-bar-chart-3 | サマリー |
| i-lucide-trophy | 個人レコード |
| i-lucide-file-text | ログ |
| i-lucide-pencil | ロープレ構築 |

### 12.2 アクション
| アイコン | 用途 |
|---------|------|
| i-lucide-download | ダウンロード |
| i-lucide-settings | 列設定 |
| i-lucide-filter | フィルター |
| i-lucide-columns | 列選択 |
| i-lucide-chevron-left/right | ページネーション |

### 12.3 統計
| アイコン | 用途 |
|---------|------|
| i-lucide-clock | 総プレイ時間 |
| i-lucide-play-circle | 総プレイ数 |
| i-lucide-users | 総プレイヤー数 |
| i-lucide-book-open | 総レッスン数 |
| i-lucide-trending-up | トレンドチャート |
| i-lucide-table | サマリーテーブル |
| i-lucide-list | ログ件数 |
| i-lucide-calendar | 期間 |

---

## 付録: 実装チェックリスト

### 高優先度 - ✅ 全て実装済み
1. ✅ チャート: tension: 0（直線で点を結ぶ）
2. ✅ チャート: spanGaps: false（欠損データの点を結ばない）
3. ✅ チャート: 複合チャート（棒グラフ+折れ線+面グラフ）
4. ✅ チャート: 最小6ヶ月表示
5. ✅ チャート: nullデータ処理
6. ✅ チャート: 二軸設定
7. ✅ NuxtUI v3 への完全移行

### 中優先度 - ✅ 全て実装済み
8. ✅ ランキングの順位スタイル（金/銀/銅グラデーション）
9. ✅ ログビューのページネーション
10. ✅ 時間表示フォーマット（◯時間◯分◯秒）
11. ✅ 日付フォーマット（YYYY/MM/DD HH:mm）
12. ✅ 各カードの左ボーダー色分け
13. ✅ カードヘッダーのアイコン表示
14. ✅ ツールバーのバッジ表示
