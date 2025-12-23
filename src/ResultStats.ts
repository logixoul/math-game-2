import { GameType } from "./GameTypes";

export class ResultStats {
    gameType: GameType;
    timeElapsedMs: number;
    percentCorrectOnFirstTry: number;

    constructor(gameType: GameType, timeElapsedMs: number, percentCorrectOnFirstTry: number) {
        this.gameType = gameType;
        this.timeElapsedMs = timeElapsedMs;
        this.percentCorrectOnFirstTry = percentCorrectOnFirstTry;
    }

    toPlainObject() {
        return {
            gameType: this.gameType.persistencyKey,
            timeElapsedMs: this.timeElapsedMs,
            percentCorrectOnFirstTry: this.percentCorrectOnFirstTry
        };
    }
}
