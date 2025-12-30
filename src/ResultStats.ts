import { GameType } from "./GameTypes";

export class ResultStats {
    constructor(
        public gameType: GameType,
        public timeElapsedMs: number,
        public percentCorrectOnFirstTry: number,
        public pointsTowardWin: number,
        public problemsAttempted : number,
        public maxReachedPointsTowardWin : number) {
    }

    toPlainObject() {
        return {
            gameType: this.gameType.persistencyKey,
            timeElapsedMs: this.timeElapsedMs,
            percentCorrectOnFirstTry: this.percentCorrectOnFirstTry,
            pointsTowardWin: this.pointsTowardWin,
            problemsAttempted: this.problemsAttempted,
            maxReachedPointsTowardWin: this.maxReachedPointsTowardWin,
        };
    }
}
