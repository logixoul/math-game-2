import { GameSession } from './GameSession';
import { UIController } from './UI';
import { FirebaseController } from "./FirebaseController";
import * as PromptTypes from './PromptTypes';
import type { GameTypeCtor } from './PromptTypes';

export class AppController {
    uiController: UIController;
    firebaseController: FirebaseController;
    gameSession!: GameSession;

    constructor() {
        this.uiController = new UIController(this);
        this.firebaseController = new FirebaseController();
        this.firebaseController.init();

        this.startNewGame(PromptTypes.MultiplicationGameType);
    }

    startNewGame(gameType: GameTypeCtor): void {
        this.gameSession = new GameSession(this, gameType);
    }
    
    getAvailableGameTypes(): GameTypeCtor[] {
        return [
            PromptTypes.MultiplicationGameType,
            PromptTypes.DivisionGameType,
            PromptTypes.SubtractionGameType,
            PromptTypes.AdditionGameType,
        ];
    }
}
