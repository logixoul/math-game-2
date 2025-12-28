import { GameSession } from './GameSession';
import { UIController } from './UI';
import { FirebaseController } from "./FirebaseController";
import * as PromptTypes from './GameTypes';

export class AppController {
    uiController: UIController;
    firebaseController: FirebaseController;
    gameSession!: GameSession;

    constructor() {
        this.firebaseController = new FirebaseController();
        this.firebaseController.init();
        this.uiController = new UIController(this);

        this.startNewGame(new PromptTypes.MultiplicationGameType());
    }

    startNewGame(gameType: PromptTypes.GameType): void {
        this.gameSession = new GameSession(this, gameType);
    }
    
    getAvailableGameTypes(): PromptTypes.GameTypeCtor[] {
        return [
            PromptTypes.MultiplicationGameType,
            PromptTypes.DivisionGameType,
            PromptTypes.SubtractionGameType,
            PromptTypes.AdditionGameType,
        ];
    }

    get currentGameType() : PromptTypes.GameType {
        return this.gameSession.gameType;
    }
}
