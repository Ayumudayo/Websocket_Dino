import { CLIENT_VERSION } from './Constants.js';
import Score from './Score.js';

let userId = '';
let scoreInstance = null;

const socket = io.connect('http://localhost:3000', {
    query: {
        clientVersion: CLIENT_VERSION,
        userId,
    },
});

socket.on('broadcast', (data) => {
    console.log(data);
});

socket.on('response', (data) => {
    console.log(data);
});

socket.on('newHighScore', (data) => {
    console.log(`highScore: ${data.uuid}, score: ${data.score}`);
    if (scoreInstance && data.score) {
        scoreInstance.setGlobalHighScore(data.score);
    }
});

socket.on('connection', (data) => {
    console.log('connection: ', data);
    userId = data.uuid;
    if (scoreInstance && data.highScore) {
        scoreInstance.setGlobalHighScore(data.highScore);
    }
});

const sendEvent = (handlerId, payload) => {
    socket.emit('event', {
        userId,
        clientVersion: CLIENT_VERSION,
        handlerId,
        payload,
    });
};

const setScoreInstance = () => {
    scoreInstance = new Score();
};

export { sendEvent, setScoreInstance };
