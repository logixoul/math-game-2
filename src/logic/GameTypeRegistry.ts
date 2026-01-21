import * as GameTypes from "./GameTypes";
import { GameType } from "./GameTypes";

interface GameTypeCtor {
    new(...args: any[]): GameType;
}

export class GameTypeRegistry {
    private _gameTypeMap = new Map<string, GameTypeCtor>();

    public get gameTypeMap(): Map<string, GameTypeCtor> {
        return this._gameTypeMap;
    }

    public register(gameTypeCtor: GameTypeCtor, persistencyKey: string): void {
        this.gameTypeMap.set(persistencyKey, gameTypeCtor);
    }

    public create(persistencyKey: string, uiLabel: string, params: Record<string, unknown> = {}): GameType | null {
        const ctor = this.gameTypeMap.get(persistencyKey);
        if (!ctor) {
            return null;
        }
        return new ctor(uiLabel, params);
    }
}

export const gameTypeRegistry = new GameTypeRegistry();
