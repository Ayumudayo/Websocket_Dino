import express from 'express';
import { createServer } from 'http';
import initSocket from './init/socket.js';
import { loadGameAssets } from './init/assets.js';
import redisClient from './init/redis.js';

const app = express();
const server = createServer(app);

const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
initSocket(server);

app.get('/', (req, res) => {
    res.send('Hello World !');
});

server.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    try {
        const assets = await loadGameAssets();
        console.log('Assets loaded successfully');

        // Redis 클라이언트 상태 확인
        if (redisClient.status !== 'ready' && redisClient.status !== 'connecting') {
            await redisClient.connect();
            console.log('Redis connected');
        } else {
            console.log('Redis is already connected or connecting');
        }
    } catch (error) {
        console.error('Failed to initialize', error);
    }
});
