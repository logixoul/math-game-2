import { GameSession } from './GameSession';
import { UIController } from './UI';
import { FirebaseController } from "./FirebaseController";
import * as PromptTypes from './GameTypes';
import type { GameTypeCtor } from './GameTypes';

export class AppController {
    uiController: UIController;
    firebaseController: FirebaseController;
    gameSession!: GameSession;

    constructor() {
        this.firebaseController = new FirebaseController();
        this.firebaseController.init();
        this.uiController = new UIController(this);

        this.startNewGame(PromptTypes.MultiplicationGameType);
    }

    startNewGame(gameType: GameTypeCtor): void {
        this.gameSession = new GameSession(this, gameType);
    }
    
    getAvailableGameTypes(): GameTypeCtor[] {
        return [
            PromptTypes.MultiplicationGameType,
            /*PromptTypes.DivisionGameType,
            PromptTypes.SubtractionGameType,
            PromptTypes.AdditionGameType,*/
        ];
    }
}
