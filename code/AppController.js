import { GameSession } from './GameSession.js';
import { UIController } from './UI.js';
import * as PromptTypes from './PromptTypes.js';

export class AppController {
    constructor() {
        this.uiController = new UIController(this);
        this.startNewGame(PromptTypes.MultiplicationGameType);
    }

    startNewGame(gameType) {
        this.gameSession = new GameSession(this, gameType);
    }
    
    getAvailableGameTypes() {
        return [
            PromptTypes.MultiplicationGameType,
            PromptTypes.DivisionGameType,
            PromptTypes.SubtractionGameType,
            PromptTypes.AdditionGameType,
        ];
    }
}