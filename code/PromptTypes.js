import * as util from './util.js';

export class Prompt {
    constructor(text, answer) {
        this.text = text;
        this.answer = answer;
        this.failedAttempts = 0;
    }
}

export class GameType {
    constructor(localizedName) {
        this.localizedName = localizedName;
    }

    generatePromptList() {
        throw new Error("generatePromptList() must be implemented in subclasses");
    }
}

export class MultiplicationGameType extends GameType {
    constructor() {
        super("Умножение");
    }

    generatePromptList() {
        let prompts = [];
        for (var a = 0; a <= 10; a++) {
            for (var b = 0; b <= 10; b++) {
                prompts.push(new Prompt(`${a} × ${b}`, a * b));
            }
        }
        prompts = util.shuffleList(prompts);
        //prompts = prompts.slice(0, 2); // for debugging
        return prompts;
    }
}

export class DivisionGameType extends GameType {
    constructor() {
        super("Деление");
    }

    generatePromptList() {
        let prompts = [];
        for (var b = 1; b <= 10; b++) {
            for (var a = 0; a <= 10; a++) {
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
    generatePromptList() {
        let prompts = [];
        for (var a = 0; a <= 100; a++) {
            for (var b = 0; b <= a; b++) {
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
    generatePromptList() {
        let prompts = [];
        for (var a = 0; a <= 100; a++) {
            for (var b = 0; b <= 100; b++) {
                prompts.push(new Prompt(`${a} + ${b}`, a + b));
            }
        }
        prompts = util.shuffleList(prompts);
        prompts = prompts.slice(0, 40); // limit to 100 questions
        return prompts;
    }
}