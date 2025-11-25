# ナレトレ Nuxt

ナレトレ WEB管理画面 - Nuxt 3 + Vue 3 + TypeScript 実装

## 技術スタック

- **Nuxt 3** - フルスタックVueフレームワーク
- **Vue 3** - Composition API
- **TypeScript** - 型安全な開発
- **Tailwind CSS v4** - ユーティリティファーストCSS
- **OpenAI Realtime API** - 音声会話機能

## セットアップ

依存関係をインストール:

```bash
npm install
```

## 開発サーバー

開発サーバーを起動 (`http://localhost:5000`):

```bash
npm run dev
```

## 環境変数

`.env` ファイルを作成:

```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 本番ビルド

```bash
npm run build
npm run preview
```

## 機能

- ロープレ設計支援チャットAI
- OpenAI Realtime APIによる音声会話
- ビデオキャラクターシステム（5スロット）
- ファイルアップロード（PDF, Excel, CSV）
- ロープレコンテンツ生成
