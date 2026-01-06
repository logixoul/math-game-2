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
    constructor(public readonly uiLabel: string) {
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
    constructor(uiLabel: string, private range : Range) {
        super(uiLabel);
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
    constructor(uiLabel: string, private range : Range) {
        super(uiLabel);
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
    constructor(uiLabel: string, private rangeMax : number) {
        super(uiLabel);
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
    constructor(uiLabel: string, private range : Range) {
        super(uiLabel);
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
    constructor(uiLabel: string, private rangeMax : number) {
        super(uiLabel);
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
    constructor(uiLabel: string, private range : Range) {
        super(uiLabel);
    }

    get persistencyKey(): string {
        return "additionSixthGrade.v1";
    }
}

export class KaloyanHomework_28_12_2025_GameType extends GameType {
    readonly mul = new MultiplicationGameType("", new Range(-10, 10));
    readonly div = new DivisionGameType("", new Range(-10, 10));
    readonly add = new AdditionSixthGradeGameType("", new Range(-40, 40));
    readonly sub = new SubtractionSixthGradeGameType("", new Range(-40, 40));

    createRandomPrompt(): Prompt {
        const randomIndex : number = util.randomInt(0, 3);
        return [this.mul,this.div,this.add,this.sub][randomIndex].createRandomPrompt();
    }
    constructor(uiLabel: string) {
        super(uiLabel);
    }

    get persistencyKey(): string {
        return "KaloyanHomework_28_12_2025_GameType.v1";
    }
}

export class KrisHomework_4_1_2026_GameType_1 extends GameType {
    readonly add = new AdditionSixthGradeGameType("", new Range(-40, 40));
    readonly sub = new SubtractionSixthGradeGameType("", new Range(-40, 40));

    createRandomPrompt(): Prompt {
        const randomIndex : number = util.randomInt(0, 1);
        return [this.add,this.sub][randomIndex].createRandomPrompt();
    }
    constructor(uiLabel: string) {
        super(uiLabel);
    }

    get persistencyKey(): string {
        return "kris1";
    }
}

export class KrisHomework_4_1_2026_GameType_2 extends GameType {
    readonly mul = new MultiplicationGameType("", new Range(0, 10));
    readonly div = new DivisionGameType("", new Range(0, 10));

    createRandomPrompt(): Prompt {
        const randomIndex : number = util.randomInt(0, 1);
        return [this.mul,this.div][randomIndex].createRandomPrompt();
    }
    constructor(uiLabel: string) {
        super(uiLabel);
    }

    get persistencyKey(): string {
        return "kris2";
    }
}

export class BracketExpansion extends GameType {
    constructor(
        uiLabel: string,
        private nestingLevel: number,
        private persistencyKeyValue: string,
        private outerRange: Range = new Range(1, 20),
        private innerRange: Range = new Range(-12, 12)
    ) {
        super(uiLabel);
    }

    get persistencyKey(): string {
        return this.persistencyKeyValue;
    }

    createRandomPrompt(): Prompt {
        const forceNested = this.nestingLevel >= 2;
        const expression = this.buildExpression(
            this.nestingLevel,
            this.nestingLevel > 0,
            this.nestingLevel > 0,
            forceNested,
            2,
            4,
            this.outerRange
        );
        return new Prompt(`${expression.text}`, expression.value, `${this.persistencyKey}:${expression.text}`);
    }

    private buildExpression(
        maxDepth: number,
        allowParens: boolean,
        forceParen: boolean,
        forceNested: boolean,
        minTerms: number,
        maxTerms: number,
        numberRange: Range
    ): { text: string; value: number; hasParen: boolean; hasNested: boolean } {
        if (!allowParens || maxDepth <= 0) {
            return this.buildLinearExpression(minTerms, maxTerms, numberRange);
        }

        const termCount = util.randomInt(minTerms, maxTerms);
        const forcedParenIndex = forceParen ? util.randomInt(0, termCount - 1) : -1;
        const forcedNestedIndex =
            forceNested && maxDepth >= 2 ? util.randomInt(0, termCount - 1) : -1;
        const terms: { text: string; value: number; hasParen: boolean; hasNested: boolean }[] = [];

        for (let i = 0; i < termCount; i++) {
            const mustParen = i === forcedParenIndex || i === forcedNestedIndex;
            const shouldParen = mustParen || util.randomInt(0, 1) === 1;
            if (shouldParen && maxDepth > 0) {
                const inner = this.buildExpression(
                    maxDepth - 1,
                    maxDepth - 1 > 0,
                    i === forcedNestedIndex,
                    false,
                    1,
                    3,
                    this.innerRange
                );
                terms.push({
                    text: `(${inner.text})`,
                    value: inner.value,
                    hasParen: true,
                    hasNested: inner.hasParen || inner.hasNested,
                });
            } else {
                const magnitude = this.randomNonZeroInt(numberRange.min, numberRange.max);
                terms.push({
                    text: `${Math.abs(magnitude)}`,
                    value: Math.abs(magnitude),
                    hasParen: false,
                    hasNested: false,
                });
            }
        }

        return this.combineTerms(terms);
    }

    private buildLinearExpression(
        minTerms: number,
        maxTerms: number,
        numberRange: Range
    ): { text: string; value: number; hasParen: boolean; hasNested: boolean } {
        const termCount = util.randomInt(minTerms, maxTerms);
        const terms: { text: string; value: number; hasParen: boolean; hasNested: boolean }[] = [];
        for (let i = 0; i < termCount; i++) {
            const magnitude = this.randomNonZeroInt(numberRange.min, numberRange.max);
            terms.push({
                text: `${Math.abs(magnitude)}`,
                value: Math.abs(magnitude),
                hasParen: false,
                hasNested: false,
            });
        }
        return this.combineTerms(terms);
    }

    private combineTerms(
        terms: { text: string; value: number; hasParen: boolean; hasNested: boolean }[]
    ): { text: string; value: number; hasParen: boolean; hasNested: boolean } {
        let total = 0;
        let expression = "";
        let hasParen = false;
        let hasNested = false;

        for (let i = 0; i < terms.length; i++) {
            const sign = util.randomInt(0, 1) === 1 ? 1 : -1;
            const term = terms[i];
            total += sign * term.value;
            hasParen = hasParen || term.hasParen;
            hasNested = hasNested || term.hasNested;

            if (i === 0) {
                expression += sign === -1 ? `-${term.text}` : term.text;
            } else {
                const op = sign === 1 ? "+" : "-";
                expression += ` ${op} ${term.text}`;
            }
        }

        return { text: expression, value: total, hasParen, hasNested };
    }

    private randomNonZeroInt(min: number, max: number): number {
        let value: number;
        do {
            value = util.randomInt(min, max);
        } while (value === 0);
        return value;
    }
}

export class BracketExpansionNesting0GameType extends BracketExpansion {
    constructor(uiLabel: string) {
        super(uiLabel, 0, "bracketExpansion.nesting0.v1");
    }
}

export class BracketExpansionNesting1GameType extends BracketExpansion {
    constructor(uiLabel: string) {
        super(uiLabel, 1, "bracketExpansion.nesting1.v1");
    }
}

export class BracketExpansionNesting2GameType extends BracketExpansion {
    constructor(uiLabel: string) {
        super(uiLabel, 2, "bracketExpansion.nesting2.v1");
    }
}

function ensureNegativeNumbersHaveParens(n : number) {
    if(n < 0)
        return `(${n})`
    else
        return `${n}`
}

//export type GameTypeCtor = new () => GameType;

export class MultiplicationGameTypeTmpAlex extends GameType{
    constructor(uiLabel: string) {
        super(uiLabel);
    }

    get persistencyKey(): string {
        return "multiplicationTmpAlex.v1";
    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(-20, 20);
        const b = util.randomInt(-20, 20);
        return new Prompt(`${a} × ${b}`, a * b, `${this.persistencyKey}:${a}:${b}`);
    }
}

export type GameTypeList = {
    fifthGrade : GameType[]
    sixthGrade : GameType[]
}

export function getAvailableGameTypes(): GameTypeList {
    return {
        fifthGrade: [
            new AdditionFifthGradeGameType("Събиране 5кл", 100),
            new SubtractionFifthGradeGameType("Изваждане 5кл", 100),
            new MultiplicationGameType("Умножение 5кл", new Range(0, 10)),
            new DivisionGameType("Деление 5кл", new Range(0, 10)),
            new KaloyanHomework_28_12_2025_GameType("Калоян старо домашно")
        ],
        sixthGrade: [
            new AdditionSixthGradeGameType("Събиране 6кл", new Range(-40, 40)),
            new SubtractionSixthGradeGameType("Изваждане 6кл", new Range(-40, 40)),
            new MultiplicationGameType("Умножение 6кл", new Range(-10, 10)),
            new BracketExpansionNesting0GameType("-1 + 2 - 3 + 90"),
            new BracketExpansionNesting1GameType("Разкриване на скоби"),
            new BracketExpansionNesting2GameType("Разкриване на скоби (вложени)"),
            new KrisHomework_4_1_2026_GameType_1("Крис домашно (събиране и изваждане)"),
            new KrisHomework_4_1_2026_GameType_2("Крис домашно (умножение и деление)"),
            new MultiplicationGameTypeTmpAlex("Алекс 06.01.2026")
        ]
    };
}
