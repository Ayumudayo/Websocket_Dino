const userItems = {};

// 게임 시작 시 아이템 기록 초기화
export const initializeItems = (userId) => {
    userItems[userId] = [];
};

// 아이템 획득 기록
export const addItem = (userId, item) => {
    if (!userItems[userId]) {
        userItems[userId] = [];
    }
    userItems[userId].push(item);
};

// 유저의 아이템 획득 기록 조회
export const getUserItems = (userId) => {
    return userItems[userId] || [];
};
