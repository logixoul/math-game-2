import * as util from './util';

export class Prompt {
    failedAttempts: number;

    constructor(public readonly text: string, public readonly answer: number, public readonly id : string) {
        this.failedAttempts = 0;
    }
}

const MAX_RECENT_PROMPTS_LENGTH = 10;
const NUM_POSTPONEMENT_TURNS = 10;

class PromptPostponement {
    constructor(public readonly prompt : Prompt, public turnsRemaining : number) {
    }
}

export class PromptScheduler {
    private recentPrompts : Prompt[] = []; // queue
    private postponedPrompts : PromptPostponement[] = [];

    constructor(private readonly gameType : GameType) {
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
    constructor(public readonly localizedName: string) {
    }

    abstract createRandomPrompt() : Prompt;

    abstract get persistencyKey(): string;
}

export class Range { // inclusive (includes both ends of the range)
    constructor(public min: number, public max: number) {
    }
}

//function maybeAddSignAndOrParens

export class MultiplicationGameType extends GameType {
    constructor(private range : Range) {
        super("Умножение");
    }

    get persistencyKey(): string {
        return "multiplication.v1";
    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(this.range.min, this.range.max);
        const b = util.randomInt(this.range.min, this.range.max);
        const bStr = ensureNegativeNumbersHaveParens(b);
        return new Prompt(`${a} × ${bStr}`, a * b, `${this.persistencyKey}:${a}:${b}`);
    }
}

export class DivisionGameType extends GameType {
    constructor(private range : Range) {
        super("Деление");
    }

    get persistencyKey(): string {
        return "division.v1";
    }

    createRandomPrompt(): Prompt {
        let a : number;
        let b : number
        do {
            a = util.randomInt(this.range.min, this.range.max);
            b = util.randomInt(this.range.min, this.range.max);
        } while (b === 0);
        const divisee = a * b;
        const divisor = b;
        const divisorStr = ensureNegativeNumbersHaveParens(divisor);
        return new Prompt(`${divisee} : ${divisorStr}`, a, `${this.persistencyKey}:${divisee}:${divisor}`);
    }
}

export class SubtractionFifthGradeGameType extends GameType {
    constructor(private rangeMax : number) {
        super("Изваждане (5 клас)");
    }

    get persistencyKey(): string {
        return "subtractionFifthGrade.v1";
    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(0, this.rangeMax);
        const b = util.randomInt(0, a);
        return new Prompt(`${a} - ${b}`, a - b,  `${this.persistencyKey}:${a}:${b}`);
    }
}

export class SubtractionSixthGradeGameType extends GameType {
    constructor(private range : Range) {
        super("Изваждане (6 клас)");
    }

    get persistencyKey(): string {
        return "subtractionSixthGrade.v1";
    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(this.range.min, this.range.max);
        const b = util.randomInt(this.range.min, this.range.max);
        const bStr = ensureNegativeNumbersHaveParens(b)
        return new Prompt(`${a} - ${bStr}`, a - b,  `${this.persistencyKey}:${a}:${b}`);
    }
}

export class AdditionFifthGradeGameType extends GameType {
    createRandomPrompt(): Prompt {
        const a = util.randomInt(0, this.rangeMax);
        const b = util.randomInt(0, this.rangeMax);
        return new Prompt(`${a} + ${b}`, a + b, `${this.persistencyKey}:${a}:${b}`);
    }
    constructor(private rangeMax : number) {
        super("Събиране (5 клас)");
    }

    get persistencyKey(): string {
        return "additionFifthGrade.v1";
    }
}

export class AdditionSixthGradeGameType extends GameType {
    createRandomPrompt(): Prompt {
        const a = util.randomInt(this.range.min, this.range.max);
        const b = util.randomInt(this.range.min, this.range.max);
        const bStr = ensureNegativeNumbersHaveParens(b);
        return new Prompt(`${a} + ${bStr}`, a + b, `${this.persistencyKey}:${a}:${b}`);
    }
    constructor(private range : Range) {
        super("Събиране (6 клас)");
    }

    get persistencyKey(): string {
        return "additionSixthGrade.v1";
    }
}

export class KaloyanHomework_28_12_2025_GameType extends GameType {
    readonly mul = new MultiplicationGameType(new Range(-12, 12))
    readonly div = new DivisionGameType(new Range(-10, 10))
    readonly add = new AdditionSixthGradeGameType(new Range(-40, 40));
    readonly sub = new SubtractionSixthGradeGameType(new Range(-40, 40));

    createRandomPrompt(): Prompt {
        const randomIndex : number = util.randomInt(0, 3);
        return [this.mul,this.div,this.add,this.sub][randomIndex].createRandomPrompt();
    }
    constructor() {
        super("KaloyanHomework_28_12_2025");
    }

    get persistencyKey(): string {
        return "KaloyanHomework_28_12_2025_GameType.v1";
    }
}

function ensureNegativeNumbersHaveParens(n : number) {
    if(n < 0)
        return `(${n})`
    else
        return `${n}`
}

export type GameTypeCtor = new () => GameType;
