# ナレトレ Nuxt実装仕様書

## プロジェクト概要
元の実装(`naretore-design`)をVue 3 + Nuxt 3 + TypeScript + Tailwind CSSで再構築

## 技術スタック
- **フレームワーク**: Nuxt 3.15.1, Vue 3.5.25
- **言語**: TypeScript (strict mode)
- **スタイリング**: Tailwind CSS v4
- **AI API**: Anthropic Claude API, OpenAI Realtime API
- **ファイル処理**: xlsx (SheetJS), OpenAI Vision API (PDF解析)

## 完了済み実装

### Phase 1: ファイルアップロード & パース
- ✅ 型定義: `app/types/file.ts`
- ✅ サーバーユーティリティ: `server/utils/fileParser.ts`
  - PDF解析 (動的import対応)
  - Excel解析 (xlsx統合)
  - テキストファイル解析
- ✅ APIエンドポイント:
  - `server/api/upload.post.ts` - ファイルアップロード
  - `server/api/files.get.ts` - ファイル一覧取得
- ✅ クライアント: `app/composables/useFileUpload.ts`
- ✅ UIコンポーネント: `app/components/FileUpload.vue` (ドラッグ&ドロップ対応)
- ✅ Vite/Nitro設定: Windows絶対パス問題解決済み

### Phase 2: AIエージェント統合
- ✅ 型定義: `app/types/agent.ts`
- ✅ AIクライアント: `server/utils/anthropic.ts`, `server/utils/openai.ts`
- ✅ プロンプトローダー: `server/utils/prompt.ts`
- ✅ プロンプトファイル: `public/prompts/*.md` (10ファイル)
- ✅ APIエンドポイント: `server/api/agents.post.ts` (4種類のエージェント対応)

### Phase 3: Realtime API & ビデオキャラクター
- ✅ Realtime API: `app/composables/useRealtimeAPI.ts`
  - WebSocket接続管理
  - 音声入出力 (PCM16, 24kHz)
  - Server VAD (Voice Activity Detection)
  - イベントコールバック (onTranscript, onAIResponse, onError)
- ✅ APIエンドポイント: `server/api/realtime-session.post.ts` (エフェメラルキー生成)
- ✅ ビデオキャラクター: `app/composables/useVideoCharacter.ts`
  - 5スロット管理 (idle, speaking, video3, video4, video5)
  - Blob URL管理とクリーンアップ
- ✅ UIコンポーネント: `app/components/VideoCharacterSlot.vue` (ドラッグ&ドロップ対応)

### Phase 4: チャットAIサポート
- ✅ チャットAI: `app/composables/useChatAI.ts`
  - 会話履歴管理
  - コンテキスト対応システムプロンプト構築
  - サジェスション機能
- ✅ APIエンドポイント: `server/api/chat.post.ts` (GPT-4o使用)
- ✅ UIコンポーネント: `app/components/NaretoreLogo.vue`
- ✅ FileSelectionDialog: Tailwind CSS v4対応 (plain CSS)

## 未実装機能リスト

### 🎭 ロープレ構築ページ

#### チャット機能
1. ✅ **AI会話サポート** - GPT-4oでチャット応答生成
2. ✅ **ファイルアップロード統合** - チャット内でのファイル添付
3. **ファイル種別自動判定** - AIによる教材/ロープレ/その他の分類

#### コース管理
4. **CRUD機能** - カテゴリー/レベル/レッスンの作成・編集・削除
5. **階層構造表示** - ツリー形式でのコース管理UI

#### ロープレ生成ワークフロー
6. ✅ **ファイル選択ダイアログ** - 生成時の参照ファイル選択モーダル
7. ✅ **Agentオーケストレーター** - 複数エージェントの連携処理
8. ✅ **台本生成** - 字幕モード/ポイントモード/練習モード用スクリプト
9. ✅ **システムプロンプト生成** - 4モード(台本/お手本/確認/実践)用プロンプト

#### ロープレ設計フォーム
10. ✅ **設計フォーム** - シチュエーション/相手設定/ミッション/ポイント入力

#### テストエリア (Realtime API)
11. ✅ **音声入出力** - Realtime API完全実装
12. ✅ **WebSocket管理** - 接続状態管理とステータス表示
13. ✅ **モード切り替え** - 台本/お手本/確認/実践の4モード (システムプロンプト連携)
14. ✅ **フィードバック表示** - スコア/達成項目/改善点のオーバーレイ (FeedbackOverlay.vue)
15. ✅ **エリア開閉** - テストエリアの展開/折りたたみ

#### ビデオキャラクター
16. ✅ **5ビデオスロット** - IDLE/SPEAKING/VIDEO3/VIDEO4/VIDEO5
17. ✅ **ビデオD&D** - ドラッグ&ドロップアップロード
18. ✅ **状態切り替え** - idle ⇔ speaking自動切り替え (Realtime API連携)

#### その他
19. ✅ **キャラクター設定ポップアップ** - 詳細設定モーダル

### 📊 サマリーページ (6項目)
20. ✅ **Chart.js統合** - トレンドグラフ (TrendChart.vue)
21. ✅ **レッスンフィルター** - 階層的フィルタードロップダウン (カテゴリー→レベル→レッスン)
22. ✅ **プレイヤーフィルター** - プレイヤー複数選択UI
23. ✅ **期間フィルター** - 月範囲選択 (開始/終了)
24. ✅ **表示単位切り替え** - レッスン/レベル/カテゴリー
25. ✅ **サマリーテーブル** - 集計データ表示

### 👤 個人記録ページ (2項目)
26. ✅ **プレイヤーリスト** - 一覧テーブル (ソート機能付き)
27. ✅ **個人詳細** - プレイヤー別詳細データ (クリックで表示、トレンドグラフ、カテゴリー/レッスン別統計)

### 🏆 ランキングページ (2項目)
28. ✅ **ランキングテーブル** - スコアランキング表示 (ソート機能付き)
29. ✅ **ソート機能** - 各列でのソート (useTableSort.ts)

### 📝 ログページ (3項目)
30. ✅ **ログテーブル** - 全セッション履歴 (ソート機能付き)
31. ✅ **ページネーション** - ページ送り機能
32. ✅ **カラムソート** - テーブル列ソート

### 📁 データ読込ページ (4項目)
33. ✅ **CSV読み込み** - CSVファイルパース (loadFromCSVFile)
34. ✅ **統計表示** - レコード数/プレイヤー数/期間
35. ✅ **プレビューテーブル** - データプレビュー
36. ✅ **デモデータ** - 自動読み込み機能

### 🌐 共通機能 (3項目)
37. ✅ **ハンバーガーメニュー** - レスポンシブサイドバー (モバイル対応)
38. ✅ **ビュー切り替え** - ページ遷移管理 (サイドバーナビ)
39. **ログアウト** - 認証解除

## ファイル構成

```
naretore-nuxt/
├── app/
│   ├── types/
│   │   ├── file.ts (完了)
│   │   ├── agent.ts (完了)
│   │   └── roleplay.ts (要作成)
│   ├── components/
│   │   ├── FileUpload.vue (完了)
│   │   ├── RoleplayDesignForm.vue (完了)
│   │   ├── FileSelectionDialog.vue (完了)
│   │   ├── CharacterSettingsPopup.vue (完了)
│   │   ├── FeedbackOverlay.vue (完了)
│   │   ├── TrendChart.vue (完了)
│   │   ├── VideoCharacterSlot.vue (完了)
│   │   └── NaretoreLogo.vue (完了)
│   ├── composables/
│   │   ├── useFileUpload.ts (完了)
│   │   ├── useAgentOrchestrator.ts (完了)
│   │   ├── useRealtimeAPI.ts (完了)
│   │   ├── useVideoCharacter.ts (完了)
│   │   ├── useChatAI.ts (完了)
│   │   ├── useDemoData.ts (完了)
│   │   └── useTableSort.ts (完了)
│   └── pages/
│       ├── index.vue (基本構造のみ)
│       └── content-creation.vue (要作成)
├── server/
│   ├── api/
│   │   ├── upload.post.ts (完了)
│   │   ├── files.get.ts (完了)
│   │   ├── agents.post.ts (完了)
│   │   └── realtime-session.post.ts (要作成)
│   └── utils/
│       ├── fileParser.ts (完了)
│       ├── anthropic.ts (完了)
│       ├── openai.ts (完了)
│       └── prompt.ts (完了)
└── public/
    └── prompts/ (完了 - 10ファイル)
```

## 重要な技術的注意事項

### Windows絶対パス問題
- **問題**: ESMローダーが`C:\...`形式を拒否
- **解決済み**:
  - `xlsx`: `import { read, utils } from 'xlsx'` + Nitro externals inline

### PDF解析
- **メタデータ抽出**: `server/utils/fileParser.ts` - ページ数・サイズのみ
- **内容解析**: OpenAI Vision API (`/api/analyze`) - gpt-4oでPDF内容を抽出

### Nuxt設定 (nuxt.config.ts)
```typescript
vite: {
  optimizeDeps: { exclude: ['xlsx'] },
  ssr: { noExternal: ['xlsx'] }
},
nitro: {
  experimental: { websocket: true },
  externals: { inline: ['xlsx'] }
}
```

### API環境変数
- `ANTHROPIC_API_KEY` - Claude API用
- `OPENAI_API_KEY` - Realtime API用

## 実装優先順位

### High Priority
1. ロープレ生成ワークフロー (項目6-9)
2. Realtime API完全実装 (項目11-12)
3. ビデオキャラクター (項目16-18)

### Medium Priority
4. コース管理 (項目4-5)
5. チャット機能 (項目1-3)
6. サマリービュー (項目20-25)

### Low Priority
7. ログ・ランキング機能
8. データ読込機能

## 元の実装参照
- HTML: `naretore-design/public/index.html`
- JS: `naretore-design/public/js/*.js`
- CSS: `naretore-design/public/css/styles.css`

## 現在のサーバー状態
- URL: http://localhost:5000/
- 状態: 正常稼働中
- エラー: なし
