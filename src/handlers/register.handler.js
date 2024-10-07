import { v4 as uuidv4 } from 'uuid';
import { addUser, getUserById } from '../models/user.model.js';
import { handleConnection, handleDisconnect, handleEvent } from './helper.js';

const registerHandler = (io) => {
  io.on('connection', async (socket) => {
    // 최초 커넥션을 맺은 이후 발생하는 각종 이벤트를 처리하는 곳

    let user = {};
    if (socket.handshake.query.userId) {
      user = await getUserById(socket.userId);

      if (!user) {
        user = {};
        user.uuid = socket.handshake.query.userId;
      }
      user.socketId = socket.id;
    } else {
      user.uuid = uuidv4();
      user.socketId = socket.id;
    }
    await addUser(user); // 사용자 추가

    await handleConnection(socket, user.uuid);

    // 모든 서비스 이벤트 처리
    socket.on('event', (data) => handleEvent(io, socket, data));
    // 접속 해제시 이벤트 처리
    socket.on('disconnect', () => handleDisconnect(socket, user.uuid));
  });
};

export default registerHandler;
