# AI用語ドリル

AI導入コンサル向けの、自分用のAI用語学習Webアプリ。

## 機能
- 4択テスト：分野選択（AIツール／操作・開発／AIの基本／仕事・導入）、問題数（10・20・全問）、出題形式（説明→用語／用語→説明／ミックス）。回答後に解説と現場での例、最後に分野別正答率と「間違えた問題だけ再挑戦」。
- 単語帳：クリックで裏返し、「覚えた」をlocalStorageに保存、未習得だけに絞り込み。

## 構成・ルール
- index.html / style.css / app.js / terms.json に分ける
- フレームワークなし（素のHTML/CSS/JavaScript）
- 用語データは terms.json（category, term, english, definition, example）。AIを触り始めた初心者向けのやさしい用語で、計69語（旧データは terms_old.json）
- 説明文は専門用語をなるべく使わず、初心者にわかる言葉で書く
- スマホ対応のレスポンシブ、ダークモード対応
- 動作確認は VS Code の Live Server で行う
- 説明やコメントは日本語で
