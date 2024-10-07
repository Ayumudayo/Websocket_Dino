import { moveStageHandler } from './stage.handler.js';
import { gameEnd, gameStart } from './game.handler.js';
import {
    handleInvalidItemPickup,
    handleItemPickup,
    handleValidItemPickup,
} from './item.handler.js';
import { broadcastNewHighScore } from './broadcast.handler.js';

const handlerMappings = {
    2: gameStart,
    3: gameEnd,
    4: handleValidItemPickup,
    5: handleInvalidItemPickup,
    6: broadcastNewHighScore,
    11: moveStageHandler,
    21: handleItemPickup,
};

export default handlerMappings;
