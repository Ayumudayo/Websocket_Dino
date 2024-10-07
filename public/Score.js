import { sendEvent } from './Socket.js';

class Score {
    // 싱글톤 인스턴스
    static instance = null;

    score = 0;
    scoreIncrement = 0;
    localHighScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    globalHighScore = 0;
    currentStage = 1000; // 현재 스테이지 ID
    stageChanged = {}; // 스테이지 변경 확인용 플래그

    constructor(ctx, scaleRatio, stageTable, itemTable, itemController) {
        // 싱글톤
        if (Score.instance) {
            return Score.instance;
        }

        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.scaleRatio = scaleRatio;
        this.stageTable = stageTable;
        this.itemTable = itemTable;
        this.itemController = itemController;

        // 모든 스테이지의 stageChanged 초기화
        this.stageTable.forEach((stage) => {
            this.stageChanged[stage.id] = false;
        });

        Score.instance = this;
    }

    update(deltaTime) {
        const currentStageInfo = this.stageTable.find((stage) => stage.id === this.currentStage);
        const scorePerSecond = currentStageInfo ? currentStageInfo.scorePerSecond : 1;

        // deltaTime을 초 단위로 변환하여 점수 증가
        this.scoreIncrement += (deltaTime / 1000) * scorePerSecond;

        // 정수 부분만 점수에 반영
        const integerIncrement = Math.floor(this.scoreIncrement);
        if (integerIncrement > 0) {
            this.score += integerIncrement;
            this.scoreIncrement -= integerIncrement;
        }

        if (this.score > this.localHighScore) {
            this.localHighScore = this.score;
        }

        this.checkStageChange();
    }

    checkStageChange() {
        for (let i = 0; i < this.stageTable.length; i++) {
            const stage = this.stageTable[i];

            // 현재 점수가 스테이지 점수 이상이고, 해당 스테이지로 변경된 적이 없는 경우
            if (Math.floor(this.score) >= stage.score && !this.stageChanged[stage.id]) {
                const previousStage = this.currentStage;
                this.currentStage = stage.id;

                // 해당 스테이지로 변경됨을 표시
                this.stageChanged[stage.id] = true;

                // 서버로 이벤트 전송
                sendEvent(11, { currentStage: previousStage, targetStage: this.currentStage });

                // 아이템 컨트롤러에 현재 스테이지 설정
                if (this.itemController) {
                    this.itemController.setCurrentStage(this.currentStage);
                }

                // 스테이지 변경 후 반복문 종료
                break;
            }
        }
    }

    getItem(itemId) {
        const itemInfo = this.itemTable.find((item) => item.id === itemId);
        if (itemInfo) {
            this.score += itemInfo.score;
            sendEvent(21, { itemId, timestamp: Date.now() });
        }
    }

    reset() {
        this.score = 0;
        this.scoreIncrement = 0;
        this.currentStage = 1000; // 스테이지 초기화

        // 모든 스테이지에 대한 변경 플래그 초기화
        Object.keys(this.stageChanged).forEach((key) => {
            this.stageChanged[key] = false;
        });

        // 아이템 컨트롤러에 현재 스테이지 설정
        if (this.itemController) {
            this.itemController.setCurrentStage(this.currentStage);
        }
    }

    setLocalHighScore(score) {
        const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
        if (score > highScore) {
            localStorage.setItem(this.HIGH_SCORE_KEY, Math.floor(this.score));
        }
    }

    setGlobalHighScore(score) {
        this.globalHighScore = score;
    }

    draw() {
        const y = 20 * this.scaleRatio;

        const fontSize = 20 * this.scaleRatio;
        this.ctx.font = `${fontSize}px consolas`;
        this.ctx.fillStyle = '#525250';

        const scoreX = this.canvas.width - 75 * this.scaleRatio;
        const localHighScoreX = scoreX - 125 * this.scaleRatio;
        const globalHighScoreX = scoreX - 330 * this.scaleRatio;

        const scorePadded = Math.floor(this.score).toString().padStart(6, 0);
        const localHighScorePadded = this.localHighScore.toString().padStart(6, 0);
        const globalHighScorePadded = this.globalHighScore.toString().padStart(6, 0);

        this.ctx.fillText(scorePadded, scoreX, y);
        this.ctx.fillText(`HI ${localHighScorePadded} | `, localHighScoreX, y);
        this.ctx.fillText(`Global HI ${globalHighScorePadded} | `, globalHighScoreX, y); // 로컬과 글로벌 점수 분리

        // 스테이지 표시
        this.drawStage();
    }

    drawStage() {
        const stageY = 20 * this.scaleRatio;
        const fontSize = 25 * this.scaleRatio;
        this.ctx.font = `${fontSize}px consolas`;

        const stageText = `Stage ${this.currentStage - 999}`; // 스테이지 번호 계산
        const stageX = this.ctx.measureText(stageText).width / 2;

        this.ctx.fillText(stageText, stageX, stageY);
    }
}

export default Score;
