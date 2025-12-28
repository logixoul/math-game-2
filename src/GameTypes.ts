import * as util from './util';

export class Prompt {
    readonly text: string;
    readonly answer: number;
    failedAttempts: number;
    readonly id: string;

    constructor(text: string, answer: number, id : string) {
        this.text = text;
        this.answer = answer;
        this.id = id;
        this.failedAttempts = 0;
    }
}

const MAX_RECENT_PROMPTS_LENGTH = 10;
const NUM_POSTPONEMENT_TURNS = 10;

class PromptPostponement {
    public readonly prompt : Prompt;
    public turnsRemaining : number;
    constructor(prompt : Prompt, turnsRemaining : number) {
        this.prompt = prompt;
        this.turnsRemaining = turnsRemaining;
    }
}

export class PromptScheduler {
    private readonly gameType : GameType;
    private recentPrompts : Prompt[] = []; // queue
    private postponedPrompts : PromptPostponement[] = [];

    constructor(gameType : GameType) {
        this.gameType = gameType;
    }

    postponePrompt(promptToPostpone: Prompt): void {
        const existing = this.postponedPrompts.find(postponedPrompt =>
            postponedPrompt.prompt.id === promptToPostpone.id);
        if (existing) {
            existing.turnsRemaining = NUM_POSTPONEMENT_TURNS;
        } else {
            this.postponedPrompts.push(new PromptPostponement(promptToPostpone, NUM_POSTPONEMENT_TURNS));
        }
    }

    rememberPrompt(prompt: Prompt) {
        this.recentPrompts.push(prompt);
        if(this.recentPrompts.length > MAX_RECENT_PROMPTS_LENGTH)
            this.recentPrompts.shift();
    }

    updateTurnsRemainingCounters() {
        for(const postponedPrompt of this.postponedPrompts) {
            postponedPrompt.turnsRemaining = Math.max(0, postponedPrompt.turnsRemaining - 1);
        }
    }

    *generatePrompts(): Generator<Prompt, void, unknown> {
        while (true) {
            // One "turn" has passed since last prompt was completed
            this.updateTurnsRemainingCounters();

            // Serve a due postponed prompt if available
            const dueIndex = this.postponedPrompts.findIndex(p => p.turnsRemaining === 0);
            if (dueIndex !== -1) {
                const [due] = this.postponedPrompts.splice(dueIndex, 1);
                this.rememberPrompt(due.prompt);
                yield due.prompt;
                continue;
            }

            // Otherwise serve a new prompt (avoid recent repeats and postponeds)
            const postponedKeys = new Set(this.postponedPrompts.map(p => p.prompt.id));
            let newPrompt: Prompt;
            do {
                newPrompt = this.gameType.createRandomPrompt();
            } while (
                this.recentPrompts.some(p => p.id === newPrompt.id) ||
                postponedKeys.has(newPrompt.id));

            this.rememberPrompt(newPrompt);
            yield newPrompt;
        }
    }
}

export abstract class GameType {
    readonly localizedName: string;

    constructor(localizedName: string) {
        this.localizedName = localizedName;
    }

    abstract createRandomPrompt() : Prompt;

    abstract get persistencyKey(): string;
}

export class MultiplicationGameType extends GameType {
    constructor() {
        super("Умножение");
    }

    get persistencyKey(): string {
        return "multiplication:v1";
    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(0, 10);
        const b = util.randomInt(0, 10);
        return new Prompt(`${a} × ${b}`, a * b, `${this.persistencyKey}:${a}:${b}`);
    }
}

export class DivisionGameType extends GameType {
    constructor() {
        super("Деление");
    }

    get persistencyKey(): string {
        return "division:v1";
    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(0, 10);
        const b = util.randomInt(1, 10);
        const divisee = a * b;
        const divisor = b;
        return new Prompt(`${divisee} : ${divisor}`, a, `${this.persistencyKey}:${divisee}:${divisor}`);
    }
}

export class SubtractionGameType extends GameType {
    constructor() {
        super("Изваждане (5 клас)");
    }

    get persistencyKey(): string {
        return "subtraction:v1";
    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(0, 100);
        const b = util.randomInt(0, a);
        return new Prompt(`${a} - ${b}`, a - b,  `${this.persistencyKey}:${a}-${b}`);
    }
}

export class AdditionGameType extends GameType {
    createRandomPrompt(): Prompt {
        const a = util.randomInt(0, 100);
        const b = util.randomInt(0, 100);
        return new Prompt(`${a} + ${b}`, a + b, `${this.persistencyKey}:${a}+${b}`);
    }
    constructor() {
        super("Събиране (5 клас)");
    }

    get persistencyKey(): string {
        return "addition:v1";
    }
}

export type GameTypeCtor = new () => GameType;
