import redisClient from '../init/redis.js';

const HIGH_SCORE_KEY = 'MY_HIGH_SCORE_KEY';

// 최고 점수 추가
// 상위 10개만 관리
// 트랜잭션으로 원자성 보장
export const addHighScore = async (uuid, score) => {
    try {
        const multi = redisClient.multi();
        multi.zadd(HIGH_SCORE_KEY, score, uuid);
        multi.zremrangebyrank(HIGH_SCORE_KEY, 0, -11);
        await multi.exec();
    } catch (error) {
        console.error('Failed to add high score', error);
    }
};

// 최고 점수 조회
export const getTopHighScore = async () => {
    const [user, score] = await redisClient.zrevrange(HIGH_SCORE_KEY, 0, 0, 'WITHSCORES'); // 상위 1개만 조회
    if (user && score) {
        return parseInt(score);
    }
    return 0; // 데이터가 없을 경우
};
