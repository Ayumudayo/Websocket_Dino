import { getUsers, removeUser } from '../models/user.model.js';
import { CLIENT_VERSION } from '../constants.js';
import handlerMappings from './handlerMapping.js';
import { createStage } from '../models/stage.model.js';
import { getTopHighScore } from '../models/score.model.js';

export const handleConnection = async (socket, uuid) => {
    console.log(`New user connected: ${uuid} with socket ID ${socket.id}`);

    // 스테이지배열 생성
    createStage(uuid);

    // 하이 스코어 가져오기
    const highScore = await getTopHighScore();

    socket.emit('connection', { uuid: uuid, highScore: highScore ? highScore : 0 });
};

export const handleDisconnect = async (socket, uuid) => {
    await removeUser(uuid); // 사용자 삭제
    console.log(`User disconnected: ${uuid}`);
};

export const handleEvent = async (io, socket, data) => {
    if (!CLIENT_VERSION.includes(data.clientVersion)) {
        console.log(`Client version mismatch: ${data.clientVersion}`);
        socket.emit('response', { status: 'fail', message: 'Client version mismatch' });
        return;
    }

    const handler = handlerMappings[data.handlerId];
    if (!handler) {
        console.log(`Handler not found: ${data.handlerId}`);
        socket.emit('response', { status: 'fail', message: 'Handler not found' });
        return;
    }

    const response = await handler(data.userId, data.payload, io);
    if (response.broadcast) {
        switch (response.handlerId) {
            case 6:
                io.emit('newHighScore', response.data);
                return;
        }
    }

    socket.emit('response', response);
};
