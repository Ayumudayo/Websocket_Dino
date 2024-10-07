import { getGameAssets } from '../init/assets.js';

// 스테이지 지속 시간을 기반으로 총 점수를 계산하는 함수
const calculateTotalScore = (stages, gameEndTime, userItems) => {
    let totalScore = 0;

    const { stages: stageData, items: itemData } = getGameAssets();
    const stageTable = stageData.data;

    stages.forEach((stage, index) => {
        let stageEndTime;
        if (index === stages.length - 1) {
            // 마지막 스테이지의 경우 종료 시간이 게임의 종료 시간
            stageEndTime = gameEndTime;
        } else {
            // 다음 스테이지의 시작 시간을 현재 스테이지의 종료 시간으로 사용
            stageEndTime = stages[index + 1].timestamp;
        }
        let stageDuration = (stageEndTime - stage.timestamp) / 1000;

        // 현재 스테이지의 초당 점수를 가져옴
        const stageInfo = stageTable.find((s) => s.id === stage.id);
        const scorePerSecond = stageInfo ? stageInfo.scorePerSecond : 1;

        totalScore += stageDuration * scorePerSecond;
    });

    // 아이템 획득 점수 추가
    userItems.forEach((userItem) => {
        const item = itemData.data.find((item) => item.id === userItem.id);
        if (item) {
            totalScore += item.score;
        }
    });

    // 정수 점수로 변환
    totalScore = Math.round(totalScore);

    return totalScore;
};

export default calculateTotalScore;
