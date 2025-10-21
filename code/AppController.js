import { GameSession } from './GameSession.js';
import { UIController } from './UI.js';
import * as PromptTypes from './PromptTypes.js';

export class AppController {
    constructor() {
        this.uiController = new UIController(this);
        this.startNewGame(PromptTypes.MultiplicationPrompt);
    }

    startNewGame(promptType) {
        this.gameSession = new GameSession(this, promptType);
    }
}