# 黒電話 (Kuro-Denwa) Web Component

[![Deploy to GitHub Pages](https://github.com/tamoco-mocomoco/kuro-denwa/actions/workflows/pages.yml/badge.svg)](https://github.com/tamoco-mocomoco/kuro-denwa/actions/workflows/pages.yml)
[![Release to CDN](https://github.com/tamoco-mocomoco/kuro-denwa/actions/workflows/release.yml/badge.svg)](https://github.com/tamoco-mocomoco/kuro-denwa/actions/workflows/release.yml)

本物の黒電話のような操作感を再現したロータリーダイヤルのWeb Componentです。
モーダル表示で画面中央に表示され、`isShow`プロパティで簡単に表示/非表示を制御できます。

## インストール

### npm

```bash
npm install kuro-denwa
```

### CDN (jsDelivr)

```html
<!-- 最新版 -->
<script type="module">
  import 'https://cdn.jsdelivr.net/gh/tamoco-mocomoco/kuro-denwa@1.0.0/kuro-denwa-component.js';
</script>
```

または直接scriptタグで：

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/tamoco-mocomoco/kuro-denwa@1.0.0/kuro-denwa-component.js"></script>
```

## デモ

**🔗 [オンラインデモを見る](https://tamoco-mocomoco.github.io/kuro-denwa/)**

または、リポジトリの`index.html`をブラウザで開いてデモを確認できます。

## 使い方

### npmでインストールした場合

```javascript
// モジュールとしてインポート
import 'kuro-denwa';

// あとはHTMLで使用
// <kuro-denwa id="myDial"></kuro-denwa>
```

### CDNまたは直接読み込みの場合

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Kuro-Denwa Example</title>
</head>
<body>
    <!-- Web Componentを配置 -->
    <kuro-denwa id="myDial"></kuro-denwa>

    <!-- JavaScriptを読み込み -->
    <script src="kuro-denwa-component.js"></script>

    <script>
        const dial = document.getElementById('myDial');

        // モーダルを開く
        function openDial() {
            dial.isShow = true;
            // または dial.open();
        }

        // ボタンなどから開く
        // <button onclick="openDial()">ダイヤルを開く</button>
    </script>
</body>
</html>
```

### イベントリスナーの設定

```javascript
const dial = document.querySelector('kuro-denwa');

// 番号が入力されたとき
dial.addEventListener('number-dialed', (e) => {
    console.log('入力された番号:', e.detail.number);
    console.log('全ての番号:', e.detail.allNumbers);
});

// クリアボタンが押されたとき
dial.addEventListener('clear', () => {
    console.log('番号がクリアされました');
});

// 発信ボタンが押されたとき
dial.addEventListener('call', (e) => {
    console.log('発信:', e.detail.phoneNumber);
    // ここで実際の発信処理を実装
});
```

### API

#### メソッド

##### ダイヤル操作

- `getDialedNumbers()` - 入力された番号の配列を取得
- `clear()` - 入力された番号をクリア

```javascript
const dial = document.querySelector('kuro-denwa');

// 入力された番号を取得
const numbers = dial.getDialedNumbers(); // [1, 2, 3, ...]

// 番号をクリア
dial.clear();
```

##### モーダル制御

- `open()` - モーダルを開く
- `close()` - モーダルを閉じる
- `isShow` - モーダルの表示状態を取得/設定（プロパティ）

```javascript
const dial = document.querySelector('kuro-denwa');

// モーダルを開く
dial.open();
// または
dial.isShow = true;

// モーダルを閉じる
dial.close();
// または
dial.isShow = false;

// 現在の状態を確認
console.log(dial.isShow); // true or false
```

## イベント

| イベント名 | 説明 | イベント詳細 |
|-----------|------|------------|
| `number-dialed` | 番号が入力されたとき | `{ number: Number, allNumbers: Array }` |
| `clear` | クリアボタンが押されたとき | なし |
| `call` | 発信ボタンが押されたとき | `{ phoneNumber: String }` |
| `opened` | モーダルが開いたとき | なし |
| `closed` | モーダルが閉じたとき | なし |

## 機能

- 本物の黒電話風のデザイン
- モーダル表示（画面中央に表示）
- ロータリーダイヤル操作（ドラッグで回転）
- ドラッグ中の番号ハイライト
- 銀色のストッパー金具
- レスポンシブデザイン（PC・スマホ対応）
- タッチデバイス対応
- Shadow DOMによるカプセル化
- `isShow`プロパティまたは`open()`/`close()`メソッドで表示/非表示を制御
- オーバーレイクリック・×ボタンで閉じる

## ブラウザ対応

モダンブラウザ（Chrome, Firefox, Safari, Edge）で動作します。
Custom Elements V1とShadow DOM V1をサポートしているブラウザが必要です。

## ファイル構成

```
kuro-denwa/
├── kuro-denwa-component.js  # Web Component本体
├── package.json              # npmパッケージ設定
├── index.html                # デモページ
├── .npmignore                # npm公開時の除外設定
└── README.md                 # このファイル
```

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します！
