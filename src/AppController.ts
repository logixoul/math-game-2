import { GameSession } from './GameSession';
import { UIController } from './UI';
import { FirebaseController } from "./FirebaseController";
import * as PromptTypes from './GameTypes';

export class AppController {
    uiController: UIController;
    firebaseController: FirebaseController;
    //gameSession!: GameSession;

    constructor() {
        this.firebaseController = new FirebaseController();
        this.firebaseController.init();
        this.uiController = new UIController(this);
    }

    getAvailableGameTypes(): PromptTypes.GameType[] {
        return [
            new PromptTypes.MultiplicationGameType(new PromptTypes.Range(0, 10), new PromptTypes.Range(0, 10)),
            new PromptTypes.DivisionGameType(),
            new PromptTypes.SubtractionGameType(),
            new PromptTypes.AdditionGameType(),
        ];
    }

    // todo rm
    /*get currentGameType() : PromptTypes.GameType {
        return this.gameSession.gameType;
    }*/
}
