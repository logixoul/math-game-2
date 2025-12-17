import { GameSession } from './GameSession.js';
import { UIController } from './UI.js';
import { FirebaseController } from "./FirebaseController.js";
import * as PromptTypes from './PromptTypes.js';

export class AppController {
    constructor() {
        this.uiController = new UIController(this);
        this.firebaseController = new FirebaseController();
        this.firebaseController.init();

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