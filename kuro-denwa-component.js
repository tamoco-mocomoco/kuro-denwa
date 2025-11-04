class KuroDenwa extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // 状態管理
        this.dialNumbers = [];
        this.currentRotation = 0;
        this.isDragging = false;
        this.startAngle = 0;
        this.draggedNumber = null;
        this.draggedNumberAngle = 0;
        this.maxAllowedRotation = 0;
        this.isReturning = false;
        this.highlightedNumber = null;
        this.numberPositions = [];

        // モーダル状態
        this.isModal = false;

        // ダイヤル設定
        this.centerX = 0;
        this.centerY = 0;
        this.outerRadius = 0;
        this.innerRadius = 0;
        this.fingerHoleRadius = 0;
        this.stopperAngle = (165 - 90) * Math.PI / 180;

        this.render();
    }

    static get observedAttributes() {
        return ['modal', 'open'];
    }

    attributeChangedCallback(name, _oldValue, newValue) {
        if (name === 'modal') {
            this.isModal = newValue !== null;
        } else if (name === 'open') {
            this.updateOpenState();
        }
    }

    connectedCallback() {
        // 常にモーダルモードとして動作
        this.isModal = true;
        this.setAttribute('modal', '');

        this.attachEventListeners();

        // 初期状態では非表示
        if (!this.hasAttribute('open')) {
            // 何もしない（非表示のまま）
        } else {
            // openが指定されている場合は初期化
            this.setupCanvas();
            this.updateDimensions();
            this.initNumberPositions();
            this.drawDial();
        }
    }

    render() {
        const template = `
            <style>
                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                    display: none;
                }

                :host(.open) {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(5px);
                    z-index: 1;
                    animation: fadeIn 0.3s ease-out;
                }

                .close-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    font-size: 32px;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.3s;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    font-weight: normal;
                }

                .close-button:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }

                .container {
                    background: #2a2a2a;
                    padding: 20px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    z-index: 2;
                    max-width: 600px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideIn 0.4s ease-out;
                }

                :host(.open) .container.loading {
                    opacity: 0;
                }

                .title {
                    text-align: center;
                    color: #fff;
                    margin-bottom: 20px;
                    font-size: 28px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }

                .display {
                    background: #1a1a1a;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    text-align: center;
                    border: 3px solid #444;
                    width: 100%;
                }

                .number-display {
                    font-size: 32px;
                    font-family: 'Courier New', monospace;
                    color: #00ff00;
                    min-height: 40px;
                    letter-spacing: 8px;
                    text-shadow: 0 0 10px #00ff00;
                }

                canvas {
                    display: block;
                    background: #1a1a1a;
                    border-radius: 50%;
                    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5);
                    cursor: pointer;
                    max-width: 100%;
                    height: auto;
                }

                .buttons {
                    margin-top: 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    width: 100%;
                }

                button {
                    padding: 12px 24px;
                    font-size: 16px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    background: #667eea;
                    color: white;
                    transition: all 0.3s;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                }

                button:hover {
                    background: #764ba2;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.4);
                }

                button:active {
                    transform: translateY(0);
                }

                .info {
                    text-align: center;
                    color: #ccc;
                    margin-top: 15px;
                    font-size: 14px;
                }

                @media (max-width: 768px) {
                    .container {
                        padding: 15px;
                    }

                    .title {
                        font-size: 22px;
                    }

                    .display {
                        padding: 15px;
                        margin-bottom: 20px;
                    }

                    .number-display {
                        font-size: 24px;
                        letter-spacing: 6px;
                    }

                    button {
                        padding: 10px 20px;
                        font-size: 14px;
                    }

                    .info {
                        font-size: 12px;
                    }
                }
            </style>

            <div class="modal-overlay" id="modalOverlay"></div>
            <div class="container">
                <button class="close-button" id="closeBtn">×</button>
                <div class="title">🖤 黒電話ダイヤル 🖤</div>
                <div class="display">
                    <div class="number-display" id="numberDisplay">-</div>
                </div>
                <canvas id="canvas"></canvas>
                <div class="buttons">
                    <button id="clearBtn">クリア</button>
                    <button id="callBtn">発信</button>
                </div>
                <div class="info">
                    穴に指を入れてストッパーまで回してください
                </div>
            </div>
        `;

        this.shadowRoot.innerHTML = template;
        this.canvas = this.shadowRoot.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.numberDisplay = this.shadowRoot.getElementById('numberDisplay');
        this.clearBtn = this.shadowRoot.getElementById('clearBtn');
        this.callBtn = this.shadowRoot.getElementById('callBtn');
        this.closeBtn = this.shadowRoot.getElementById('closeBtn');
        this.modalOverlay = this.shadowRoot.getElementById('modalOverlay');
        this.container = this.shadowRoot.querySelector('.container');
    }

    setupCanvas() {
        const container = this.shadowRoot.querySelector('.container');
        const containerWidth = container.clientWidth - 40;
        const maxSize = Math.min(containerWidth, window.innerHeight * 0.5, 500);

        this.canvas.width = maxSize;
        this.canvas.height = maxSize;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.style.width = maxSize + 'px';
        this.canvas.style.height = maxSize + 'px';
        this.canvas.width = maxSize * dpr;
        this.canvas.height = maxSize * dpr;
        this.ctx.scale(dpr, dpr);
    }

    updateDimensions() {
        const size = Math.min(this.canvas.width, this.canvas.height) / (window.devicePixelRatio || 1);
        this.centerX = size / 2;
        this.centerY = size / 2;
        this.outerRadius = size * 0.4;
        this.innerRadius = size * 0.19;
        this.fingerHoleRadius = size * 0.052;
    }

    initNumberPositions() {
        this.numberPositions = [];
        const numbers = [0, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        const clockAngle0 = 180;
        const canvasAngle0 = (clockAngle0 - 90) * Math.PI / 180;
        const totalAngle = Math.PI * 7 / 6;
        const angleStep = totalAngle / (numbers.length - 1);

        for (let i = 0; i < numbers.length; i++) {
            const angle = canvasAngle0 + angleStep * i;
            const holeRadius = (this.outerRadius + this.innerRadius) / 2 - 5;

            this.numberPositions.push({
                number: numbers[i],
                angle: angle,
                holeX: this.centerX + Math.cos(angle) * holeRadius,
                holeY: this.centerY + Math.sin(angle) * holeRadius,
                textX: this.centerX + Math.cos(angle) * holeRadius,
                textY: this.centerY + Math.sin(angle) * holeRadius
            });
        }
    }

    drawDial() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.currentRotation);
        this.ctx.translate(-this.centerX, -this.centerY);

        // 外側の円
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 内側の円
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, 0, Math.PI * 2);
        const centerGradient = this.ctx.createRadialGradient(
            this.centerX - 20, this.centerY - 20, 10,
            this.centerX, this.centerY, this.innerRadius
        );
        centerGradient.addColorStop(0, '#f5f5dc');
        centerGradient.addColorStop(0.6, '#e8e8c8');
        centerGradient.addColorStop(1, '#d0d0b0');
        this.ctx.fillStyle = centerGradient;
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 番号の穴と番号
        this.numberPositions.forEach((pos) => {
            const isHighlighted = this.highlightedNumber === pos.number;

            this.ctx.beginPath();
            this.ctx.arc(pos.holeX, pos.holeY, this.fingerHoleRadius, 0, Math.PI * 2);

            if (isHighlighted) {
                this.ctx.fillStyle = '#2a2a2a';
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = '#667eea';
            } else {
                this.ctx.fillStyle = '#0a0a0a';
            }

            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = isHighlighted ? '#667eea' : '#666';
            this.ctx.lineWidth = isHighlighted ? 3 : 2;
            this.ctx.stroke();

            if (!isHighlighted) {
                this.ctx.beginPath();
                this.ctx.arc(pos.holeX - 5, pos.holeY - 5, this.fingerHoleRadius / 3, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fill();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(pos.holeX - 5, pos.holeY - 5, this.fingerHoleRadius / 2, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
                this.ctx.fill();
            }

            const fontSize = isHighlighted ? 36 : 32;
            this.ctx.font = `bold ${fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            const textYOffset = 3;
            const adjustedTextY = pos.textY + textYOffset;

            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 5;
            this.ctx.strokeText(pos.number, pos.textX, adjustedTextY);

            if (isHighlighted) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#667eea';
                this.ctx.fillStyle = '#fff';
            } else {
                this.ctx.fillStyle = '#fff';
            }
            this.ctx.fillText(pos.number, pos.textX, adjustedTextY);
            this.ctx.shadowBlur = 0;
        });

        this.ctx.restore();

        // ストッパー
        const stopperBaseX = this.centerX + Math.cos(this.stopperAngle) * (this.outerRadius + 30);
        const stopperBaseY = this.centerY + Math.sin(this.stopperAngle) * (this.outerRadius + 30);
        const stopperLength = (this.outerRadius + 30) - this.innerRadius;

        this.ctx.save();
        this.ctx.translate(stopperBaseX, stopperBaseY);
        this.ctx.rotate(this.stopperAngle + Math.PI / 2);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(-14, 2, 28, stopperLength);

        const baseGradient = this.ctx.createLinearGradient(-12, 0, 12, 0);
        baseGradient.addColorStop(0, '#4a4a4a');
        baseGradient.addColorStop(0.4, '#c0c0c0');
        baseGradient.addColorStop(0.5, '#e8e8e8');
        baseGradient.addColorStop(0.6, '#c0c0c0');
        baseGradient.addColorStop(1, '#5a5a5a');

        this.ctx.fillStyle = baseGradient;
        this.ctx.fillRect(-12, 0, 24, stopperLength);
        this.ctx.strokeStyle = '#3a3a3a';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-12, 0, 24, stopperLength);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(-11, 1, 4, stopperLength - 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(7, 1, 4, stopperLength - 2);

        const pinGradient = this.ctx.createRadialGradient(-2, -2, 2, 0, 0, 10);
        pinGradient.addColorStop(0, '#ffffff');
        pinGradient.addColorStop(0.3, '#d0d0d0');
        pinGradient.addColorStop(0.7, '#a0a0a0');
        pinGradient.addColorStop(1, '#707070');

        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = pinGradient;
        this.ctx.fill();
        this.ctx.strokeStyle = '#505050';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(-3, -3, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fill();

        this.ctx.restore();
    }

    getAngleFromMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return Math.atan2(y - this.centerY, x - this.centerX);
    }

    getNumberAtPosition(x, y) {
        for (let pos of this.numberPositions) {
            const rotatedX = this.centerX + (pos.holeX - this.centerX) * Math.cos(this.currentRotation) -
                             (pos.holeY - this.centerY) * Math.sin(this.currentRotation);
            const rotatedY = this.centerY + (pos.holeX - this.centerX) * Math.sin(this.currentRotation) +
                             (pos.holeY - this.centerY) * Math.cos(this.currentRotation);

            const distance = Math.sqrt(Math.pow(x - rotatedX, 2) + Math.pow(y - rotatedY, 2));

            if (distance <= this.fingerHoleRadius) {
                return pos;
            }
        }
        return null;
    }

    attachEventListeners() {
        // マウスダウン
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isReturning) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const numberPos = this.getNumberAtPosition(x, y);

            if (numberPos !== null) {
                this.isDragging = true;
                this.draggedNumber = numberPos.number;
                this.draggedNumberAngle = numberPos.angle;
                this.startAngle = this.getAngleFromMouse(e);
                this.canvas.style.cursor = 'grabbing';

                this.highlightedNumber = numberPos.number;
                this.drawDial();

                const stopBeforeAngle = Math.PI / 12;
                let targetRotation = (this.stopperAngle - stopBeforeAngle) - this.draggedNumberAngle;

                while (targetRotation < 0) targetRotation += Math.PI * 2;
                while (targetRotation > Math.PI * 2) targetRotation -= Math.PI * 2;

                this.maxAllowedRotation = targetRotation;
            }
        });

        // マウス移動
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const numberPos = this.getNumberAtPosition(x, y);
                this.canvas.style.cursor = numberPos !== null ? 'grab' : 'pointer';
                return;
            }

            const currentAngle = this.getAngleFromMouse(e);
            let deltaAngle = currentAngle - this.startAngle;

            if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
            if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;

            if (deltaAngle > 0) {
                const newRotation = this.currentRotation + deltaAngle;

                if (newRotation <= this.maxAllowedRotation) {
                    this.currentRotation = newRotation;
                    this.startAngle = currentAngle;
                    this.drawDial();
                } else {
                    this.currentRotation = this.maxAllowedRotation;
                    this.drawDial();
                }
            }
        });

        // マウスアップ
        this.canvas.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'pointer';
                this.highlightedNumber = null;

                const rotationThreshold = this.maxAllowedRotation * 0.8;
                if (this.currentRotation >= rotationThreshold && this.draggedNumber !== null) {
                    this.dialNumbers.push(this.draggedNumber);
                    this.updateDisplay();

                    // カスタムイベントを発火
                    this.dispatchEvent(new CustomEvent('number-dialed', {
                        detail: { number: this.draggedNumber, allNumbers: [...this.dialNumbers] }
                    }));
                }

                this.returnDial();
            }
        });

        // マウスが外に出た時
        this.canvas.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'pointer';
                this.highlightedNumber = null;
                this.returnDial();
            }
        });

        // タッチイベント
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });

        // ボタンイベント
        this.clearBtn.addEventListener('click', () => {
            this.dialNumbers = [];
            this.updateDisplay();
            this.dispatchEvent(new CustomEvent('clear'));
        });

        this.callBtn.addEventListener('click', () => {
            if (this.dialNumbers.length > 0) {
                const phoneNumber = this.dialNumbers.join('');
                this.dispatchEvent(new CustomEvent('call', {
                    detail: { phoneNumber }
                }));
            }
        });

        // モーダルのクローズボタン
        this.closeBtn.addEventListener('click', () => {
            this.close();
        });

        // オーバーレイクリックでモーダルを閉じる
        this.modalOverlay.addEventListener('click', () => {
            this.close();
        });

        // リサイズ対応
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.updateDimensions();
            this.numberPositions = [];
            this.initNumberPositions();
            this.drawDial();
        });
    }

    returnDial() {
        if (this.currentRotation === 0) return;

        this.isReturning = true;
        const returnSpeed = 0.15;

        const animate = () => {
            this.currentRotation -= returnSpeed;

            if (this.currentRotation <= 0) {
                this.currentRotation = 0;
                this.isReturning = false;
                this.highlightedNumber = null;
                this.drawDial();
                return;
            }

            this.drawDial();
            requestAnimationFrame(animate);
        };

        animate();
    }

    updateDisplay() {
        if (this.dialNumbers.length === 0) {
            this.numberDisplay.textContent = '-';
        } else {
            this.numberDisplay.textContent = this.dialNumbers.join('');
        }
    }

    updateOpenState() {
        const isOpen = this.hasAttribute('open');
        if (isOpen) {
            this.classList.add('open');

            // ローディング状態を表示
            if (this.container) {
                this.container.classList.add('loading');
            }

            // モーダルを開くときにCanvasを初期化
            setTimeout(() => {
                this.setupCanvas();
                this.updateDimensions();
                if (this.numberPositions.length === 0) {
                    this.initNumberPositions();
                }
                this.drawDial();

                // ローディング状態を解除（スムーズに表示）
                setTimeout(() => {
                    if (this.container) {
                        this.container.classList.remove('loading');
                    }
                }, 50);
            }, 150); // フェードイン中に初期化

            this.dispatchEvent(new CustomEvent('opened'));
        } else {
            this.classList.remove('open');
            this.dispatchEvent(new CustomEvent('closed'));
        }
    }

    // 公開API - モーダル制御
    get isShow() {
        return this.hasAttribute('open');
    }

    set isShow(value) {
        if (value) {
            this.setAttribute('open', '');
        } else {
            this.removeAttribute('open');
        }
    }

    open() {
        this.isShow = true;
    }

    close() {
        this.isShow = false;
    }

    // 公開API - ダイヤル操作
    getDialedNumbers() {
        return [...this.dialNumbers];
    }

    clear() {
        this.dialNumbers = [];
        this.updateDisplay();
    }
}

// カスタム要素として登録
customElements.define('kuro-denwa', KuroDenwa);
