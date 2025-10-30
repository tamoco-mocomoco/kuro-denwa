# 黒電話ロータリーダイヤル Web Component

本物の黒電話のような操作感を再現したロータリーダイヤルのWeb Componentです。

## デモ

`demo.html`をブラウザで開いてデモを確認できます。

## 使い方

### 基本的な使用方法

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rotary Dial Example</title>
</head>
<body>
    <!-- Web Componentを配置 -->
    <rotary-dial></rotary-dial>

    <!-- JavaScriptを読み込み -->
    <script src="rotary-dial-component.js"></script>
</body>
</html>
```

### イベントリスナーの設定

```javascript
const dial = document.querySelector('rotary-dial');

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

- `getDialedNumbers()` - 入力された番号の配列を取得
- `clear()` - 入力された番号をクリア

```javascript
const dial = document.querySelector('rotary-dial');

// 入力された番号を取得
const numbers = dial.getDialedNumbers(); // [1, 2, 3, ...]

// 番号をクリア
dial.clear();
```

## イベント

| イベント名 | 説明 | イベント詳細 |
|-----------|------|------------|
| `number-dialed` | 番号が入力されたとき | `{ number: Number, allNumbers: Array }` |
| `clear` | クリアボタンが押されたとき | なし |
| `call` | 発信ボタンが押されたとき | `{ phoneNumber: String }` |

## 機能

- 本物の黒電話風のデザイン
- ロータリーダイヤル操作（ドラッグで回転）
- ドラッグ中の番号ハイライト
- 銀色のストッパー金具
- レスポンシブデザイン（PC・スマホ対応）
- タッチデバイス対応
- Shadow DOMによるカプセル化

## ブラウザ対応

モダンブラウザ（Chrome, Firefox, Safari, Edge）で動作します。
Custom Elements V1とShadow DOM V1をサポートしているブラウザが必要です。

## ファイル構成

```
kuro-denwa/
├── rotary-dial-component.js  # Web Component本体
├── demo.html                  # デモページ
├── index.html                 # オリジナル版
├── rotary-dial.js            # オリジナル版JavaScript
└── README.md                  # このファイル
```

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します！
