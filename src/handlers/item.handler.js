// src/handlers/item.handler.js
import redisClient from '../init/redis.js';
import { addItem } from '../models/item.model.js';
import { getStage } from '../models/stage.model.js';
import { getGameAssets } from '../init/assets.js';
import itemData from '../../public/assets/item.json' assert { type: 'json' };
const ITEM_CONFIG = itemData.data;

// 핸들러 21: 아이템 획득 요청 처리
export const handleItemPickup = async (userId, payload, io) => {
    const { itemId } = payload;

    // 아이템 정보 조회
    const item = ITEM_CONFIG.find((item) => item.id === itemId);
    if (!item) {
        return { status: 'fail', handler: 5, message: '유효하지 않은 아이템 ID입니다.' };
    }

    // 유저의 현재 스테이지 정보 조회
    const currentStages = getStage(userId);
    if (!currentStages.length) {
        return { status: 'fail', handler: 5, message: '유저의 스테이지 정보가 없습니다.' };
    }
    const currentStage = currentStages[currentStages.length - 1].id;

    // 현재 스테이지에서 나올 수 있는 아이템인지 검증
    const gameAssets = getGameAssets();
    const stageUnlock = gameAssets.itemUnlocks.data.find(
        (stage) => stage.stage_id === currentStage,
    );
    if (!stageUnlock || !stageUnlock.item_ids.includes(itemId)) {
        return {
            status: 'fail',
            handler: 5,
            message: '현재 스테이지에서 이 아이템을 획득할 수 없습니다.',
        };
    }

    // Redis 키 설정
    const redisKey = `user:${userId}:item:${itemId}`;
    const currentTime = Date.now();

    try {
        // Redis에서 마지막 획득 시간 조회
        const lastCollected = await redisClient.get(redisKey);
        const intervalInMs = item.interval;

        if (lastCollected) {
            const elapsedTime = currentTime - parseInt(lastCollected, 10);
            if (elapsedTime < intervalInMs) {
                const remainingTime = Math.ceil((intervalInMs - elapsedTime) / 1000);
                return {
                    status: 'fail',
                    handler: 5,
                    message: `이 아이템을 다시 획득하려면 ${remainingTime}ms가 남았습니다.`,
                };
            }
        }

        // 간격이 충족되었거나 첫 획득인 경우
        await redisClient.set(redisKey, currentTime.toString());

        // 아이템 기록 추가
        addItem(userId, { id: itemId, timestamp: currentTime });

        return { status: 'success', handler: 4, message: '아이템을 성공적으로 획득했습니다.' };
    } catch (error) {
        console.error('Redis error:', error);
        return { status: 'fail', handler: 5, message: '내부 서버 오류입니다.' };
    }
};

// 서버에서 유효성을 확인하기 위함
// 핸들러 4: 유효한 아이템 획득 처리
export const handleValidItemPickup = async (userId, payload, io) => {
    const { itemId } = payload;
    console.info(`유저 ${userId}가 아이템을 획득했습니다. : 아이템 ID ${itemId}`);
    return { status: 'success', handler: 4, message: '아이템 획득이 유효하게 처리되었습니다.' };
};

// 핸들러 5: 유효하지 않은 아이템 획득 시도 처리
export const handleInvalidItemPickup = async (userId, payload, io) => {
    const { itemId, reason } = payload;

    console.warn(
        `유저 ${userId}가 유효하지 않은 아이템 획득을 시도했습니다: 아이템 ID ${itemId}, 이유: ${reason}`,
    );

    return {
        status: 'fail',
        handler: 5,
        message: '유효하지 않은 아이템 획득 시도가 감지되었습니다.',
    };
};
