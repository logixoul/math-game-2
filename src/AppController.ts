import { GameSession } from './GameSession';
import { UIController } from './non-react legacy/UI';
import { FirebaseController } from "./FirebaseController";
import * as GameTypes from './GameTypes';
import * as FirebaseAuth from "firebase/auth";

export class AppController {
    uiController: any;
    firebaseController: FirebaseController;
    user: FirebaseAuth.User | null = null; // null when not logged in
    
    constructor() {
        this.firebaseController = new FirebaseController();
        this.firebaseController.init();
        //this.uiController = new UIController(this);
    }

    static getAvailableGameTypes(): GameTypes.GameType[] {
        return [
            new GameTypes.MultiplicationGameType(new GameTypes.Range(0, 10)),
            new GameTypes.DivisionGameType(new GameTypes.Range(0, 10)),
            new GameTypes.AdditionFifthGradeGameType(100),
            new GameTypes.SubtractionFifthGradeGameType(100),
            new GameTypes.AdditionSixthGradeGameType(new GameTypes.Range(-40, 40)),
            new GameTypes.SubtractionSixthGradeGameType(new GameTypes.Range(-40, 40)),
            new GameTypes.KaloyanHomework_28_12_2025_GameType()
        ];
    }
}
