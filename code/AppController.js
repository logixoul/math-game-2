import { GameSession } from 'GameSession';
import { UIController } from 'UI';
import * as PromptTypes from 'PromptTypes';

export class AppController {
    constructor() {
        this.uiController = new UIController(this);
        this.startNewGame(PromptTypes.MultiplicationPrompt);
    }

    startNewGame(promptType) {
        this.gameSession = new GameSession(this, promptType);
    }
}