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

    abstract get persistencyKey(): string;
}

export class MultiplicationGameType extends GameType {
    constructor() {
        super("Умножение");
    }

    get persistencyKey(): string {
        return "multiplication:v1";
    }

    *createNextPrompt(): Generator<Prompt, void, unknown> {
        while(true) {
            let prompts: Prompt[] = [];
            for (let a = 0; a <= 10; a++) {
                for (let b = 0; b <= 10; b++) {
                    prompts.push(new Prompt(`${a} × ${b}`, a * b));
                }
            }
            prompts = util.shuffleList(prompts);
            for (const prompt of prompts) {
                yield prompt;
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
