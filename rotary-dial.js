// Canvas要素とコンテキストの取得
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const numberDisplay = document.getElementById('numberDisplay');
const clearBtn = document.getElementById('clearBtn');
const callBtn = document.getElementById('callBtn');

// Canvasのサイズを画面に合わせて設定
function setupCanvas() {
    const container = document.querySelector('.container');
    const containerWidth = container.clientWidth - 40; // padding分を引く
    const maxSize = Math.min(containerWidth, window.innerHeight * 0.5, 500);

    canvas.width = maxSize;
    canvas.height = maxSize;

    // 高解像度ディスプレイ対応
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = maxSize + 'px';
    canvas.style.height = maxSize + 'px';
    canvas.width = maxSize * dpr;
    canvas.height = maxSize * dpr;
    ctx.scale(dpr, dpr);
}

// ダイヤルの設定（相対的なサイズ）
let centerX, centerY, outerRadius, innerRadius, fingerHoleRadius;

function updateDimensions() {
    const size = Math.min(canvas.width, canvas.height) / (window.devicePixelRatio || 1);
    centerX = size / 2;
    centerY = size / 2;
    outerRadius = size * 0.4; // 画面の40%
    innerRadius = size * 0.19; // 画面の19%
    fingerHoleRadius = size * 0.052; // 画面の5.2%
}

// 初期設定
setupCanvas();
updateDimensions();

// ストッパーの角度（固定）- 0の右隣の位置
// 0が180度なので、その右隣は165度くらい
// 時計角度で165度 → Canvas角度で75度
const stopperAngle = (165 - 90) * Math.PI / 180; // 約75度

// 状態管理
let dialNumbers = [];
let currentRotation = 0;
let isDragging = false;
let startAngle = 0;
let draggedNumber = null;
let draggedNumberAngle = 0; // ドラッグした番号の初期角度
let maxAllowedRotation = 0; // その番号がストッパーまで回転できる最大角度
let isReturning = false;
let highlightedNumber = null; // ハイライト表示する番号

// 0-9の番号配置
// 下（180度）から左に向かって 0,9,8,7,6,5,4,3,2,1
// 1が30度の位置
const numbers = [0, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const numberPositions = [];

// 各番号の位置を計算
function initNumberPositions() {
    // 時計角度をCanvas角度に変換：時計角度 - 90度
    // 時計の0度（上）= Canvasの-90度
    // 時計の30度（1の位置）= Canvasの-60度
    // 時計の180度（下、0の位置）= Canvasの90度

    const clockAngle0 = 180; // 時計角度：0の位置（下）

    // Canvas角度に変換
    const canvasAngle0 = (clockAngle0 - 90) * Math.PI / 180; // 90度

    // 90度から反時計回りに300度（-60度）まで = 210度分
    const totalAngle = Math.PI * 7 / 6; // 210度
    const angleStep = totalAngle / (numbers.length - 1);

    for (let i = 0; i < numbers.length; i++) {
        // 90度から反時計回りに進む（角度を増やす）
        const angle = canvasAngle0 + angleStep * i;
        // 穴を中央寄りに配置
        const holeRadius = (outerRadius + innerRadius) / 2 - 5;

        numberPositions.push({
            number: numbers[i],
            angle: angle,
            holeX: centerX + Math.cos(angle) * holeRadius,
            holeY: centerY + Math.sin(angle) * holeRadius,
            // 番号を穴の位置に重ねる
            textX: centerX + Math.cos(angle) * holeRadius,
            textY: centerY + Math.sin(angle) * holeRadius
        });
    }
}

// ダイヤルの描画
function drawDial() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotation);
    ctx.translate(-centerX, -centerY);

    // 外側の円（黒いプレート）
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 内側の円（中心部）- クリーム色/ベージュ
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);

    // グラデーションで立体感を出す
    const centerGradient = ctx.createRadialGradient(
        centerX - 20, centerY - 20, 10,
        centerX, centerY, innerRadius
    );
    centerGradient.addColorStop(0, '#f5f5dc');
    centerGradient.addColorStop(0.6, '#e8e8c8');
    centerGradient.addColorStop(1, '#d0d0b0');

    ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 各番号の穴と番号を描画
    numberPositions.forEach((pos) => {
        const isHighlighted = highlightedNumber === pos.number;

        // 指穴
        ctx.beginPath();
        ctx.arc(pos.holeX, pos.holeY, fingerHoleRadius, 0, Math.PI * 2);

        // ハイライト時は明るい色
        if (isHighlighted) {
            ctx.fillStyle = '#2a2a2a';

            // 光るエフェクト
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#667eea';
        } else {
            ctx.fillStyle = '#0a0a0a';
        }

        ctx.fill();
        ctx.shadowBlur = 0; // シャドウをリセット

        ctx.strokeStyle = isHighlighted ? '#667eea' : '#666';
        ctx.lineWidth = isHighlighted ? 3 : 2;
        ctx.stroke();

        // 穴の内側のハイライト
        if (!isHighlighted) {
            ctx.beginPath();
            ctx.arc(pos.holeX - 5, pos.holeY - 5, fingerHoleRadius / 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
        } else {
            // ハイライト時はより明るく
            ctx.beginPath();
            ctx.arc(pos.holeX - 5, pos.holeY - 5, fingerHoleRadius / 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
            ctx.fill();
        }

        // 番号テキスト（穴の上に重ねて表示）
        const fontSize = isHighlighted ? 36 : 32;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 番号の位置を少し下にずらす
        const textYOffset = 3;
        const adjustedTextY = pos.textY + textYOffset;

        // テキストの影（見やすくするため）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.strokeText(pos.number, pos.textX, adjustedTextY);

        // テキスト本体
        if (isHighlighted) {
            // ハイライト時は光らせる
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#667eea';
            ctx.fillStyle = '#fff';
        } else {
            ctx.fillStyle = '#fff';
        }
        ctx.fillText(pos.number, pos.textX, adjustedTextY);
        ctx.shadowBlur = 0; // シャドウをリセット
    });

    // ストッパー（固定位置）- 銀色の金具
    ctx.restore();

    // ストッパーを外側に配置
    const stopperBaseX = centerX + Math.cos(stopperAngle) * (outerRadius + 30);
    const stopperBaseY = centerY + Math.sin(stopperAngle) * (outerRadius + 30);

    // ストッパーの長さ = 外側の基点から中央の白い円まで
    const stopperLength = (outerRadius + 30) - innerRadius; // 中央の円まで届く

    // 金具の台座（長方形）- 番号の穴まで伸ばす
    ctx.save();
    ctx.translate(stopperBaseX, stopperBaseY);
    ctx.rotate(stopperAngle + Math.PI / 2);

    // 台座の影（0から内側に向かって描画）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-14, 2, 28, stopperLength);

    // 台座本体（グラデーション）
    const baseGradient = ctx.createLinearGradient(-12, 0, 12, 0);
    baseGradient.addColorStop(0, '#4a4a4a');
    baseGradient.addColorStop(0.4, '#c0c0c0');
    baseGradient.addColorStop(0.5, '#e8e8e8');
    baseGradient.addColorStop(0.6, '#c0c0c0');
    baseGradient.addColorStop(1, '#5a5a5a');

    ctx.fillStyle = baseGradient;
    ctx.fillRect(-12, 0, 24, stopperLength);

    // 台座の縁
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(-12, 0, 24, stopperLength);

    // ハイライト（左側）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-11, 1, 4, stopperLength - 2);

    // 影（右側）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(7, 1, 4, stopperLength - 2);

    // ストッパーピン（突起部分）
    const pinGradient = ctx.createRadialGradient(-2, -2, 2, 0, 0, 10);
    pinGradient.addColorStop(0, '#ffffff');
    pinGradient.addColorStop(0.3, '#d0d0d0');
    pinGradient.addColorStop(0.7, '#a0a0a0');
    pinGradient.addColorStop(1, '#707070');

    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = pinGradient;
    ctx.fill();
    ctx.strokeStyle = '#505050';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ピンのハイライト
    ctx.beginPath();
    ctx.arc(-3, -3, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();

    ctx.restore();
}

// マウス位置から角度を計算
function getAngleFromMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return Math.atan2(y - centerY, x - centerX);
}

// マウス位置が指穴の範囲内かチェック
function getNumberAtPosition(x, y) {
    for (let pos of numberPositions) {
        const rotatedX = centerX + (pos.holeX - centerX) * Math.cos(currentRotation) -
                         (pos.holeY - centerY) * Math.sin(currentRotation);
        const rotatedY = centerY + (pos.holeX - centerX) * Math.sin(currentRotation) +
                         (pos.holeY - centerY) * Math.cos(currentRotation);

        const distance = Math.sqrt(Math.pow(x - rotatedX, 2) + Math.pow(y - rotatedY, 2));

        if (distance <= fingerHoleRadius) {
            return pos; // 番号だけでなく位置情報全体を返す
        }
    }
    return null;
}

// マウスダウンイベント
canvas.addEventListener('mousedown', (e) => {
    if (isReturning) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const numberPos = getNumberAtPosition(x, y);

    if (numberPos !== null) {
        isDragging = true;
        draggedNumber = numberPos.number;
        draggedNumberAngle = numberPos.angle;
        startAngle = getAngleFromMouse(e);
        canvas.style.cursor = 'grabbing';

        // ハイライト表示を開始
        highlightedNumber = numberPos.number;
        drawDial();

        // この番号がストッパーの右隣まで回転できる最大角度を計算
        // ストッパーの少し手前（右側）で止まるように調整
        const stopBeforeAngle = Math.PI / 12; // 15度手前で止める
        let targetRotation = (stopperAngle - stopBeforeAngle) - draggedNumberAngle;

        // 角度を正規化（0〜2πの範囲に）
        while (targetRotation < 0) targetRotation += Math.PI * 2;
        while (targetRotation > Math.PI * 2) targetRotation -= Math.PI * 2;

        maxAllowedRotation = targetRotation;
    }
});

// マウス移動イベント
canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) {
        // カーソルスタイルの更新
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const numberPos = getNumberAtPosition(x, y);
        canvas.style.cursor = numberPos !== null ? 'grab' : 'pointer';
        return;
    }

    const currentAngle = getAngleFromMouse(e);
    let deltaAngle = currentAngle - startAngle;

    // 時計回りのみ許可
    if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
    if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;

    // 時計回り方向のみ回転を許可
    if (deltaAngle > 0) {
        const newRotation = currentRotation + deltaAngle;

        // 選択した番号がストッパー位置を超えないように制限
        if (newRotation <= maxAllowedRotation) {
            currentRotation = newRotation;
            startAngle = currentAngle;
            drawDial();
        } else {
            // ストッパー位置でピタッと止める
            currentRotation = maxAllowedRotation;
            drawDial();
        }
    }
});

// マウスアップイベント
canvas.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'pointer';

        // ハイライト表示を解除
        highlightedNumber = null;

        // ストッパー位置の80%以上まで回転していたら番号を登録
        const rotationThreshold = maxAllowedRotation * 0.8;
        if (currentRotation >= rotationThreshold && draggedNumber !== null) {
            dialNumbers.push(draggedNumber);
            updateDisplay();
        }

        // ダイヤルを元の位置に戻す
        returnDial();
    }
});

// マウスが外に出た時
canvas.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'pointer';

        // ハイライト表示を解除
        highlightedNumber = null;

        returnDial();
    }
});

// ダイヤルを元の位置に戻すアニメーション
function returnDial() {
    if (currentRotation === 0) return;

    isReturning = true;
    const returnSpeed = 0.15;

    function animate() {
        currentRotation -= returnSpeed;

        if (currentRotation <= 0) {
            currentRotation = 0;
            isReturning = false;
            highlightedNumber = null; // ハイライトを解除
            drawDial();
            return;
        }

        drawDial();
        requestAnimationFrame(animate);
    }

    animate();
}

// ディスプレイを更新
function updateDisplay() {
    if (dialNumbers.length === 0) {
        numberDisplay.textContent = '-';
    } else {
        numberDisplay.textContent = dialNumbers.join('');
    }
}

// クリアボタン
clearBtn.addEventListener('click', () => {
    dialNumbers = [];
    updateDisplay();
});

// 発信ボタン
callBtn.addEventListener('click', () => {
    if (dialNumbers.length > 0) {
        const phoneNumber = dialNumbers.join('');
        alert(`発信: ${phoneNumber}`);
    } else {
        alert('番号を入力してください');
    }
});

// タッチイベント対応
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});

// 初期化
initNumberPositions();
drawDial();

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    setupCanvas();
    updateDimensions();
    numberPositions.length = 0; // リセット
    initNumberPositions();
    drawDial();
});

// 画面の向き変更対応
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        setupCanvas();
        updateDimensions();
        numberPositions.length = 0;
        initNumberPositions();
        drawDial();
    }, 100);
});
