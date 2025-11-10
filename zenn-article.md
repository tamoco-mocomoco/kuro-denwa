---
title: "黒電話のWeb Componentを作ったら想像以上に実用的だった件"
emoji: "☎️"
type: "tech"
topics: ["webcomponents", "javascript", "ui", "ネタ"]
published: false
---

## はじめに

先日、電話番号の入力 UI について雑談していたときのこと。

「最近の入力フォーム、テンキーとか色々工夫されてるよね」
「そういえば昔は黒電話で番号回してたんだよな...」
「**今の若い人って黒電話使えるのかな・・・？**」

この何気ない一言でとりあえず作ってみました！

確かに、昭和生まれの私には馴染み深い黒電話のロータリーダイヤル。
でも、平成・令和生まれの人たちにとっては「見たことはあるけど使ったことない」という人も多いはず。

そこで思いついたのが、
**「Web 上で黒電話を体験できる UI を作ったら面白いんじゃない？」**

というわけで、勢いで Web Component として黒電話のロータリーダイヤルを実装してみました。

https://github.com/tamoco-mocomoco/kuro-denwa

## デモ

まずは実際に触ってみてください！

https://tamoco-mocomoco.github.io/kuro-denwa/

![黒電話デモ](スクリーンショット画像のURL)

穴に指（カーソル）を入れて、銀色のストッパーまでグイッと回す。
あの独特の感触（？）を再現するために、Canvas API でゴリゴリ描画しています。

## 技術スタック

- **Web Components** (Custom Elements V1)
- **Canvas API** (ダイヤルの描画・アニメーション)
- **Shadow DOM** (スタイルのカプセル化)
- **GitHub Actions** (CI/CD パイプライン)
- **jsDelivr CDN** (npm 不要で誰でも使える)

完全にバニラ JS。フレームワークは一切使っていません。
黒電話へのリスペクトとして、できるだけプリミティブに実装しました。

## 使い方

### npm から

```bash
npm install kuro-denwa
```

```javascript
import "kuro-denwa";
```

### CDN から（npm 不要）

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/gh/tamoco-mocomoco/kuro-denwa@latest/kuro-denwa-component.js"
></script>
```

あとは HTML に配置するだけ：

```html
<kuro-denwa id="myDial"></kuro-denwa>

<script>
  const dial = document.getElementById("myDial");

  // モーダルを開く
  dial.open();

  // 番号が入力されたときのイベント
  dial.addEventListener("number-dialed", (e) => {
    console.log("入力された番号:", e.detail.number);
  });
</script>
```

モーダルで開くので、既存のアプリケーションに簡単に組み込めます。

## 実装のこだわりポイント

### 1. 本物の黒電話の配置を再現

番号の配置は、実際の黒電話と同じように：

- **0** が一番下（180 度の位置）
- そこから反時計回りに **9, 8, 7, 6, 5, 4, 3, 2, 1**

当時の写真を見ながら、角度を計算して配置しました。

```javascript
const numbers = [0, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const clockAngle0 = 180; // 0は下
const totalAngle = (Math.PI * 7) / 6; // 210度
```

### 2. 銀色のストッパー金具

黒電話といえば、あの右側にある銀色の金具。
これがないと雰囲気が出ません。

Canvas でグラデーションを使って金属感を表現：

```javascript
const gradient = ctx.createLinearGradient(-12, 0, 12, 0);
gradient.addColorStop(0, "#4a4a4a");
gradient.addColorStop(0.5, "#e8e8e8"); // ハイライト
gradient.addColorStop(1, "#5a5a5a");
```

### 3. ドラッグ中のハイライト

どの番号を回しているか分かりやすいように、
ドラッグ中の番号を光らせています。

```javascript
if (isHighlighted) {
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#667eea";
}
```

### 4. スマホ対応

タッチイベントにも対応しているので、
スマホでもサクサク動きます。

```javascript
canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  // タッチをマウスイベントに変換
});
```

## CI/CD パイプライン

GitHub Actions で自動化しています：

1. **main ブランチへ push** → GitHub Pages に自動デプロイ
2. **vX.X.X タグを push** → GitHub リリース作成 + jsDelivr CDN 更新

```yaml
# .github/workflows/pages.yml
on:
  push:
    branches: [main]

# .github/workflows/release.yml
on:
  push:
    tags: ['v*.*.*']
```

タグを打つだけで、CDN 経由で全世界に配信されます。便利！

## 苦労したポイント

### 横スクロールバー問題

スマホで見たときに横スクロールバーが出る問題に悩まされました。

原因は `overflow-x: hidden` と `100vw` の組み合わせ。
`100vw` はスクロールバーを含めた幅なので、ずれが生じていました。

最終的には、シンプルに `max-width: 100%` だけにすることで解決。

### モーダルのサイズ調整

PC・スマホ両方で見やすいサイズにするのが大変でした。

```javascript
const isMobile = window.innerWidth <= 768;
const heightFactor = isMobile ? 0.3 : 0.48;
const maxSize = Math.min(
  containerWidth,
  window.innerHeight * heightFactor,
  isMobile ? 300 : 420
);
```

画面サイズに応じて動的に Canvas のサイズを調整しています。

## まとめ

ネタで作り始めた黒電話ですが、
Web Component にすることで誰でも気軽に使えるようになりました。

- レトロ UI のデモページに
- ノスタルジックな演出が欲しいサイトに
- 「黒電話を体験したことがない人」への教材に

ぜひ使ってみてください！

https://github.com/tamoco-mocomoco/kuro-denwa

## おまけ：今後の展望

- 音を追加（ダイヤルを回す音、戻る音）
- 呼び出し音の実装
- 受話器を上げ下げするアニメーション
- 10 円玉を入れる公衆電話バージョン（？）
