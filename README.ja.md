# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![Frontend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=frontend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=backend)](https://codecov.io/gh/chatman-media/timeline-studio)

[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## プロジェクト概要

Timeline Studioは、最新のWeb技術とネイティブパフォーマンスで構築されたプロフェッショナルなビデオ編集アプリケーションです。私たちの目標は、誰もがアクセスできるDaVinci Resolveレベルのエディターを作成することです。

![タイムラインインターフェース #1](/public/screen2.png)

![タイムラインインターフェース #2](/public/screen4.png)

### プロジェクトステータス（2025年6月）

**全体的な完成度：86.2%** ⬆️（OAuth統合とExport完成後に更新）
- ✅ コア編集機能完了
- ✅ GPU加速付きビデオコンパイラー
- ✅ 認識モジュール（YOLO v11）- ORT修正済み
- ✅ エフェクト、フィルター、トランジション（75-80%）
- ✅ Export - 完全なソーシャルメディア統合！（98%）🎉
- ✅ OAuth統合 - YouTube/TikTok/Vimeo/Telegramサポート
- ✅ Preview Managerによる統一プレビューシステム
- ✅ メディア永続化と一時プロジェクト
- ✅ テンプレートシステム - 設定ベース（95%完了）
- ✅ Timeline 90%完了
- ⚠️ リソースパネル開発中（85%）
- 🎯 目標MVPリリース：2025年6月末

## 主な機能

- 🎬 マルチトラックタイムラインによるプロフェッショナルなビデオ編集
- 🖥️ クロスプラットフォーム（Windows、macOS、Linux）
- 🚀 GPU加速ビデオ処理（NVENC、QuickSync、VideoToolbox）
- 🤖 AI駆動のオブジェクト/顔認識（YOLO v11 - ORT修正済み）
- 🎨 30種類以上のトランジション、視覚効果、フィルター
- 📝 12種類のスタイルとアニメーションを備えた高度な字幕システム
- 🎵 エフェクト付きマルチトラックオーディオ編集
- 📤 ソーシャルメディアOAuth統合付きMP4/MOV/WebMエクスポート
- 🔐 YouTube/TikTok/Vimeo/Telegram OAuth対応、安全なトークン保存
- 📱 最適化されたエクスポート用デバイスプリセット（iPhone、iPad、Android）
- 🧠 XState v5を使用した状態管理
- 🌐 国際化サポート（11言語）
- 💾 スマートキャッシングと統一プレビューシステム
- 🎨 Tailwind CSS v4、shadcn-uiを使用したモダンなUI
- 📚 2400以上のテスト（98.8%成功率）による完全なドキュメント

## はじめに

### 前提条件

- [Node.js](https://nodejs.org/)（v18以降）
- [Rust](https://www.rust-lang.org/tools/install)（最新の安定版）
- [bun](https://bun.sh/)（最新の安定版）
- [ffmpeg](https://ffmpeg.org/download.html)（最新の安定版）

### インストール

1. リポジトリをクローン：

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. 依存関係をインストール：

```bash
bun install
```

### 開発モードの起動

```bash
bun run tauri dev
```

### プロダクションビルド

```bash
bun run tauri build
```

## ドキュメント

### 📚 メインドキュメント

- 📚 [ドキュメント概要](docs-ru/README.md) - 完全なドキュメントマップ
- 🚀 [はじめに](docs-ru/01-getting-started/README.md) - インストールと最初のステップ
- 🏗️ [アーキテクチャガイド](docs-ru/02-architecture/README.md) - システムアーキテクチャ
- 🎯 [機能ガイド](docs-ru/03-features/README.md) - 機能概要とステータス
- 📡 [APIリファレンス](docs-ru/04-api-reference/README.md) - Tauriコマンドリファレンス
- 🧪 [開発ガイド](docs-ru/05-development/README.md) - テストと開発
- 🚀 [デプロイメントガイド](docs-ru/06-deployment/README.md) - ビルドとデプロイメント
- 📋 [ユーザーガイド](docs-ru/07-guides/README.md) - パフォーマンスとベストプラクティス
- 🛣️ [ロードマップ](docs-ru/08-roadmap/README.md) - 開発ロードマップ
- 🔐 [OAuth設定](docs-ru/09-oauth-setup/oauth-setup-guide.md) - ソーシャルメディア統合

### 📋 プロジェクトドキュメント

- **`src/features/README.md`** - 優先順位とステータスを含むすべての機能の概要
- **言語版**: 上記のセレクターから11言語で利用可能

## 開発

### 利用可能なスクリプト

- `bun run dev` - 開発モードでNext.jsを起動
- `bun run tauri dev` - 開発モードでTauriを起動
- `bun run build` - Next.jsをビルド
- `bun run tauri build` - Tauriアプリケーションをビルド

#### リンティングとフォーマット

- `bun run lint` - ESLintでJavaScript/TypeScriptコードをチェック
- `bun run lint:fix` - ESLintエラーを修正
- `bun run lint:css` - StylelintでCSSコードをチェック
- `bun run lint:css:fix` - Stylelintエラーを修正
- `bun run format:imports` - インポートをフォーマット
- `bun run lint:rust` - ClippyでRustコードをチェック
- `bun run format:rust` - rustfmtでRustコードをフォーマット
- `bun run check:all` - すべてのチェックとテストを実行
- `bun run fix:all` - すべてのリンティングエラーを修正

#### テスト

- `bun run test` - テストを実行
- `bun run test:app` - アプリケーションコンポーネントのテストのみ実行
- `bun run test:watch` - ウォッチモードでテストを実行
- `bun run test:coverage` - カバレッジレポート付きでテストを実行
- `bun run test:coverage:report` - テストカバレッジレポートを生成・送信
- `bun run test:rust` - Rustバックエンドテストを実行
- `bun run test:rust:watch` - ウォッチモードでRustテストを実行
- `bun run test:coverage:rust` - カバレッジ付きでRustテストを実行
- `bun run test:coverage:rust:report` - Rustカバレッジレポートを生成・送信
- `bun run test:ui` - UIインターフェースでテストを実行
- `bun run test:e2e` - PlaywrightでEnd-to-Endテストを実行
- `bun run test:e2e:ui` - Playwright UIでE2Eテストを実行
- `bun run test:e2e:basic` - 基本的なメディアインポートE2Eテストを実行
- `bun run test:e2e:real` - 実際のメディアファイルでE2Eテストを実行
- `bun run test:e2e:integration` - 統合E2Eテストを実行（INTEGRATION_TEST=trueが必要）
- `bun run playwright:install` - Playwrightブラウザをインストール

### テスト

プロジェクトはユニットテストにVitestを使用しています。テストは各機能の__tests__ディレクトリ内にあり、モックは__mocks__内にあります。

#### 🧪 テストカバレッジステータス:
```bash
⨯ bun run test

 Test Files  242 passed | 1 skipped (243)
      Tests  3284 passed | 60 skipped (3344)
   Start at  16:17:39
   Duration  29.44s (transform 5.03s, setup 47.28s, collect 22.85s, tests 32.74s, environment 74.05s, prepare 22.21s)

⨯ bun run test:rust
   test result: ok. 366 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 12.38s

```

```bash
# クライアントテストを実行
bun run test

# Rustテストを実行
bun run test:rust

# カバレッジレポート付きでテストを実行
bun run test:coverage

# 特定の機能のテストを実行
bun run test src/features/effects
```

## 継続的インテグレーションとデプロイメント

プロジェクトは継続的インテグレーションとデプロイメントのためにGitHub Actionsを使用するよう設定されています。ワークフロー：

### 検証とビルド

- `check-all.yml` - すべてのチェックとテストを実行
- `lint-css.yml` - CSSコードのみをチェック（CSSファイルが変更された時に実行）
- `lint-rs.yml` - Rustコードのみをチェック（Rustファイルが変更された時に実行）
- `lint-js.yml` - JavaScript/TypeScriptコードのみをチェック（JavaScript/TypeScriptファイルが変更された時に実行）

### デプロイメント

- `build.yml` - プロジェクトをビルド
- `build-release.yml` - リリース用プロジェクトをビルド
- `deploy-promo.yml` - GitHub Pagesでプロモページをビルド・公開
- `docs.yml` - GitHub PagesでAPIドキュメントを生成・公開

### リンター設定

#### Stylelint (CSS)

プロジェクトはCSSコードをチェックするためにStylelintを使用しています。設定は`.stylelintrc.json`ファイルにあります。主な機能：

- Tailwind CSS ディレクティブのサポート
- Tailwind互換性のための重複セレクターの無視
- ファイル保存時の自動エラー修正（VS Codeで）

CSSリンターを実行するには、以下のコマンドを使用してください：

```bash
bun lint:css
```

自動エラー修正の場合：

```bash
bun lint:css:fix
```

## APIドキュメント

APIドキュメントは以下で利用可能です：[https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

ローカルでドキュメントを生成するには、以下のコマンドを使用してください：

```bash
bun run docs
```

ドキュメントは`docs/`フォルダで利用可能になります。

リアルタイムドキュメント開発の場合：

```bash
bun run docs:watch
```

ドキュメントは、GitHub Actionsワークフロー`docs.yml`を使用して`main`ブランチでソースコードが変更されると自動的に更新されます。

## プロモページ

プロジェクトのプロモページは以下で利用可能です：[https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

プロモページのソースコードは`promo/`フォルダにあります。

プロモページのローカル開発には、以下のコマンドを使用してください：

```bash
cd promo
bun install
bun run dev
```

プロモページをビルドするには：

```bash
cd promo
bun run build
```

プロモページは、GitHub Actionsワークフロー`deploy-promo.yml`を使用して`main`ブランチで`promo/`フォルダ内のファイルが変更されると自動的に更新されます。

## 追加リソース

- [Tauriドキュメント](https://v2.tauri.app/start/)
- [XStateドキュメント](https://xstate.js.org/docs/)
- [Vitestドキュメント](https://vitest.dev/guide/)
- [Tailwind CSSドキュメント](https://tailwindcss.com/docs)
- [Shadcn UIドキュメント](https://ui.shadcn.com/)
- [Stylelintドキュメント](https://stylelint.io/)
- [ESLintドキュメント](https://eslint.org/docs/latest/)
- [Playwrightドキュメント](https://playwright.dev/docs/intro)
- [TypeDocドキュメント](https://typedoc.org/)
- [ffmpegドキュメント](https://ffmpeg.org/documentation.html)

## ライセンス

このプロジェクトはCommons Clause条件付きのMITライセンスの下で配布されています。

**主な条項：**

- **オープンソース**: MITライセンスの条項に従って、コードを自由に使用、変更、配布することができます。
- **商用利用制限**: Commons Clauseは、作者との別の合意なしにソフトウェアを「販売」することを禁止しています。
- **「販売」**とは、ソフトウェアの機能を使用して、第三者に有料で製品やサービスを提供することを意味します。

このライセンスは以下を許可します：

- 個人的および非商用プロジェクトでのコードの使用
- コードの学習と変更
- 同じライセンスの下での変更の配布

しかし、以下を禁止します：

- ライセンスなしでコードに基づく商用製品やサービスの作成

商用ライセンスを取得するには、作者にお問い合わせください：ak.chatman.media@gmail.com

完全なライセンステキストは[LICENSE](./LICENSE)ファイルで利用可能です

## GitHub Pages

プロジェクトはAPIドキュメントとプロモページのホスティングにGitHub Pagesを使用しています：

- **プロモページ**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **APIドキュメント**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

両方のページは、GitHub Actionsワークフローを使用して`main`ブランチで対応するファイルが変更されると自動的に更新されます。