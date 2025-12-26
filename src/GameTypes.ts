import * as util from './util';

export class Prompt {
    text: string;
    answer: number;
    failedAttempts: number;

    constructor(text: string, answer: number) {
        this.text = text;
        this.answer = answer;
        this.failedAttempts = 0;
    }
}

export abstract class GameType {
    localizedName: string;

    constructor(localizedName: string) {
        this.localizedName = localizedName;
    }

    abstract createNextPrompt(): Generator<Prompt, void, unknown>

    abstract postponePrompt(prompt: Prompt) : void;

    abstract get persistencyKey(): string;
}

class PromptPostponement {
    public prompt : Prompt;
    public turnsRemaining : number;
    constructor(prompt : Prompt, turnsRemaining : number) {
        this.prompt = prompt;
        this.turnsRemaining = turnsRemaining;
    }
}

const MAX_RECENT_PROMPTS_LENGTH = 10;
const NUM_POSTPONEMENT_TURNS = 10;

export class MultiplicationGameType extends GameType {
    private recentPrompts : Prompt[] = []; // queue
    private postponedPrompts : PromptPostponement[] = [];

    constructor() {
        super("Умножение");
    }

    get persistencyKey(): string {
        return "multiplication:v1";
    }

    postponePrompt(promptToPostpone: Prompt): void {
        const existing = this.postponedPrompts.find(postponedPrompt =>
            postponedPrompt.prompt.text === promptToPostpone.text);
        if (existing) {
            existing.turnsRemaining = NUM_POSTPONEMENT_TURNS;
        } else {
            this.postponedPrompts.push(new PromptPostponement(promptToPostpone, NUM_POSTPONEMENT_TURNS));
        }
    }

    rememberPrompt(prompt: Prompt) {
        this.recentPrompts.push(prompt);
        if(this.recentPrompts.length >= MAX_RECENT_PROMPTS_LENGTH)
            this.recentPrompts.shift();
    }

    *createNextPrompt(): Generator<Prompt, void, unknown> {
        while(true) {
            const a = util.randomInt(0, 10);
            const b = util.randomInt(0, 10);
            const newPrompt = new Prompt(`${a} × ${b}`, a * b);
            if(this.recentPrompts.find(p => p.text === newPrompt.text))
                continue;
            this.rememberPrompt(newPrompt);
            yield newPrompt;
            for(const postponedPrompt of this.postponedPrompts) {
                postponedPrompt.turnsRemaining = Math.max(0, postponedPrompt.turnsRemaining - 1);
            }
            if(this.postponedPrompts.length !== 0) {
                const nextPostponedPrompt = this.postponedPrompts[0];
                if(nextPostponedPrompt.turnsRemaining === 0) {
                    this.rememberPrompt(nextPostponedPrompt.prompt);

                    this.postponedPrompts.shift();
                    yield nextPostponedPrompt.prompt;
                }
            }
        }
    }
}

/*export class DivisionGameType extends GameType {
    constructor() {
        super("Деление");
    }

    get persistencyKey(): string {
        return "division:v1";
    }

    generatePromptList(): Prompt[] {
        let prompts: Prompt[] = [];
        for (let b = 1; b <= 10; b++) {
            for (let a = 0; a <= 10; a++) {
                const divisee = a * b;
                const divisor = b;
                prompts.push(new Prompt(`${divisee} : ${divisor}`, a));
            }
        }
        prompts = util.shuffleList(prompts);
        return prompts;
    }
}

export class SubtractionGameType extends GameType {
    constructor() {
        super("Изваждане (5 клас)");
    }

    get persistencyKey(): string {
        return "subtraction:v1";
    }

    generatePromptList(): Prompt[] {
        let prompts: Prompt[] = [];
        for (let a = 0; a <= 100; a++) {
            for (let b = 0; b <= a; b++) {
                prompts.push(new Prompt(`${a} - ${b}`, a - b));
            }
        }
        prompts = util.shuffleList(prompts);
        prompts = prompts.slice(0, 20); // limit to 100 questions
        return prompts;
    }
}

export class AdditionGameType extends GameType {
    constructor() {
        super("Събиране (5 клас)");
    }

    get persistencyKey(): string {
        return "addition:v1";
    }

    generatePromptList(): Prompt[] {
        let prompts: Prompt[] = [];
        for (let a = 0; a <= 100; a++) {
            for (let b = 0; b <= 100; b++) {
                prompts.push(new Prompt(`${a} + ${b}`, a + b));
            }
        }
        prompts = util.shuffleList(prompts);
        prompts = prompts.slice(0, 40); // limit to 100 questions
        return prompts;
    }
}*/

export type GameTypeCtor = new () => GameType;
