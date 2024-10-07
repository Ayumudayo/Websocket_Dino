import Item from './Item.js';
import { sendEvent } from './Socket.js';

class ItemController {
    INTERVAL_MIN = 100;
    INTERVAL_MAX = 200;

    nextInterval = null;
    items = [];

    // 플레이어가 아이템을 획득하는 간격과
    // 스폰 간격을 모두 추적해 비정상적인 동작 방지
    lastSpawnedTimes = new Map(); // 아이템별 마지막 생성 시간을 추적
    lastCollectedTimes = new Map(); // 아이템별 마지막 수집 시간을 추적

    constructor(ctx, itemImages, scaleRatio, speed, itemData, itemUnlockTable) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.itemImages = itemImages;
        this.scaleRatio = scaleRatio;
        this.speed = speed;
        this.currentStage = 1000;
        this.itemData = itemData;
        this.itemUnlockTable = itemUnlockTable;

        this.setNextItemTime();
    }

    setNextItemTime() {
        this.nextInterval = this.getRandomNumber(this.INTERVAL_MIN, this.INTERVAL_MAX);
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    createItem() {
        const currentTime = Date.now();
        const stageItems = this.itemUnlockTable.find(
            (stage) => stage.stage_id === this.currentStage,
        )?.item_ids;

        if (stageItems) {
            // 스테이지에 맞는 아이템 필터링
            const stageUnlockedItems = this.itemImages.filter((item) =>
                stageItems.includes(item.id),
            );

            const availableItems = stageUnlockedItems.filter((item) => {
                const lastCollected = this.lastCollectedTimes.get(item.id) || 0; // 마지막 확득 시간 가져오기
                const lastSpawned = this.lastSpawnedTimes.get(item.id) || 0; // 마지막 생성 시간 가져오기
                const itemInfo = this.itemData.find((data) => data.id === item.id);

                if (!itemInfo) return false; // 아이템 정보가 없으면 제외

                const itemInterval = itemInfo.interval; // 인터벌 (밀리초)

                // 인터벌 확인: 마지막 생성 시간 이후로 인터벌이 경과했는지 확인
                return (
                    currentTime - lastSpawned >= itemInterval &&
                    currentTime - lastCollected >= itemInterval
                );
            });

            if (availableItems.length === 0) {
                // 인터벌로 인해 생성 가능한 아이템이 없음
                return;
            }

            const index = this.getRandomNumber(0, availableItems.length - 1);
            const itemInfo = availableItems[index];
            const x = this.canvas.width * 1.5;
            const y = this.getRandomNumber(10, this.canvas.height - itemInfo.height);
            const item = new Item(
                this.ctx,
                itemInfo.id,
                x,
                y,
                itemInfo.width / 1.5,
                itemInfo.height / 1.5,
                itemInfo.image,
            );
            this.items.push(item);

            // 아이템 생성 시 lastSpawnedTimes 업데이트
            this.lastSpawnedTimes.set(itemInfo.id, currentTime);
        }
    }

    update(gameSpeed, deltaTime) {
        if (this.nextInterval <= 0) {
            this.createItem();
            this.setNextItemTime();
        }

        this.nextInterval -= deltaTime;

        this.items.forEach((item) => {
            item.update(this.speed, gameSpeed, deltaTime, this.scaleRatio);
        });

        this.items = this.items.filter((item) => item.x > -item.width);
    }

    draw() {
        this.items.forEach((item) => item.draw());
    }

    collideWith(sprite) {
        const collidedItem = this.items.find((item) => item.collideWith(sprite));
        if (collidedItem) {
            const currentTime = Date.now();
            const itemId = collidedItem.id;
            const itemInfo = this.itemData.find((item) => item.id === itemId);

            if (itemInfo) {
                const lastCollected = this.lastCollectedTimes.get(itemId) || 0;
                const lastSpawned = this.lastSpawnedTimes.get(itemId) || 0;
                const itemInterval = itemInfo.interval; // 최소 인터벌 시간 (ms)

                // 아이템 생성 후 최소 인터벌 검증
                if (lastCollected !== 0) {
                    if (currentTime - lastSpawned < 0) {
                        console.warn(
                            `아이템 ${itemId}을(를) 생성 후 충분한 시간이 경과하지 않았습니다.`,
                        );
                        sendEvent(5, {
                            itemId,
                            timestamp: currentTime,
                            reason: 'Invalid item creation interval',
                        });
                        return null;
                    }

                    // 최근 획득 시간 검증
                    if (currentTime - lastCollected < itemInterval) {
                        console.warn(
                            `아이템 ${itemId}을(를) 너무 빨리 수집했습니다. 간격이 충족되지 않았습니다.`,
                        );
                        sendEvent(5, {
                            itemId,
                            timestamp: currentTime,
                            reason: 'Invalid item pickup interval',
                        });
                        return null;
                    }
                }

                // 검증 통과: 획득 처리
                this.lastCollectedTimes.set(itemId, currentTime);

                sendEvent(4, {
                    itemId,
                    timestamp: currentTime,
                    playerId: sprite.id,
                    stageId: this.currentStage,
                });

                // 아이템 제거
                this.ctx.clearRect(
                    collidedItem.x,
                    collidedItem.y,
                    collidedItem.width,
                    collidedItem.height,
                );
                this.items = this.items.filter((item) => item !== collidedItem);
                return { itemId };
            }
        }
        return null;
    }

    reset() {
        this.items = [];

        // 리셋 시 맵 초기화
        this.lastCollectedTimes.clear();
        this.lastSpawnedTimes.clear();
    }

    setCurrentStage(stageId) {
        this.currentStage = stageId;
    }
}

export default ItemController;
