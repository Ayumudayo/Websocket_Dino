import { getStage, setStage } from '../models/stage.model.js';
import { getGameAssets } from '../init/assets.js';
import calculateTotalScore from '../utils/calculateTotalScore.js';
import { getUserItems } from '../models/item.model.js';

export const moveStageHandler = (userId, { currentStage, targetStage }) => {
    // 사용자의 현재 스테이지 목록을 가져옴
    const currentStages = getStage(userId);
    if (!currentStages.length) {
        return { status: 'fail', message: 'No stages found for user' };
    }

    // 배열 정렬 대신 reduce() 사용해 가장 마지막 스테이지 가져옴
    const latestStage = currentStages.reduce((prev, curr) => (prev.id > curr.id ? prev : curr));

    // payload 데이터와 비교
    if (latestStage.id !== currentStage) {
        return { status: 'fail', message: 'Current stage mismatch' };
    }

    // 게임 에셋에서 스테이지 정보를 가져옴
    const { stages } = getGameAssets();

    // 현재 스테이지 정보 조회
    const currentStageInfo = stages.data.find((stage) => stage.id === currentStage);
    if (!currentStageInfo) {
        return { status: 'fail', message: 'Current stage does not exist' };
    }

    // 목표 스테이지 정보 조회
    const nextStageInfo = stages.data.find((stage) => stage.id === targetStage);
    if (!nextStageInfo) {
        return { status: 'fail', message: 'Next stage does not exist' };
    }

    // 서버 현재 시간
    const serverTime = Date.now();

    // 총 점수 계산
    const userItems = getUserItems(userId);
    const totalScore = calculateTotalScore(currentStages, serverTime, userItems);

    // 현재 점수가 기준 점수 이상인지 확인
    if (nextStageInfo.score > totalScore) {
        return { status: 'fail', message: 'Invalid elapsed time' };
    }

    // 유저의 스테이지 정보 업데이트
    setStage(userId, targetStage, serverTime);
    return { status: 'success', handler: 11 };
};
