// broadcastHandlers.js
export const broadcastNewHighScore = async (userId, payload, io) => {
    const { uuid, score } = payload;

    const response = {
        status: 'success',
        handlerId: 6,
        broadcast: true,
        data: { uuid, score },
    };

    return response;
};
