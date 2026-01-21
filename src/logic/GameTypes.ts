import { gameTypeRegistry } from './GameTypeRegistry';
import * as util from './util';
import { BigNumber } from 'bignumber.js'

export type AssignmentGameTypeSpec = {
    key: string;
    params?: Record<string, unknown>;
    probability: number;
};

export type AssignmentGameTypeParseResult = {
    specs: AssignmentGameTypeSpec[];
    error?: string;
};

export class Prompt {
    failedAttempts: number;

    constructor(public readonly text: string, public readonly answer: number) {
        this.failedAttempts = 0;
    }
}

function integerPowerOfTen(power: number) {
    let result = 1;
    if(power > 0) {
        for(let i = 0; i < power; i++) {
            result *= 10;
        }
    } else if(power < 0) {
        for(let i = 0; i < -power; i++) {
            result /= 10;
        }
    }
    return result;
}

export abstract class GameType {
    constructor(public readonly uiLabel: string) {
    }

    abstract createRandomPrompt() : Prompt;
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

    createRandomPrompt(): Prompt {
        const a = util.randomInt(this.range.min, this.range.max);
        const b = util.randomInt(this.range.min, this.range.max);
        const bStr = ensureNegativeNumbersHaveParens(b);
        return new Prompt(`${a} × ${bStr}`, a * b);
    }
}
gameTypeRegistry.register(MultiplicationGameType, "Multiplication.v1");

export class DivisionGameType extends GameType {
    constructor(uiLabel: string, private range : Range, private expRange : Range) {
        super(uiLabel);
    }

    createRandomPrompt(): Prompt {
        const expA = util.randomInt(this.expRange.min, this.expRange.max);
        const expB = util.randomInt(this.expRange.min, this.expRange.max);

        const a = new BigNumber(util.randomInt(this.range.min, this.range.max)).multipliedBy(integerPowerOfTen(expA));
        let b;
        do {
            b = new BigNumber(util.randomInt(this.range.min, this.range.max)).multipliedBy(integerPowerOfTen(expB));
        } while (b.isZero());
        const divisee = a.multipliedBy(b);
        const divisor = b;
        const divisorStr = ensureNegativeNumbersHaveParens(divisor);
        return new Prompt(`${divisee} : ${divisorStr}`, a);
    }
}
gameTypeRegistry.register(DivisionGameType, "Division.v1");

export class SubtractionFifthGradeGameType extends GameType {
    constructor(uiLabel: string, private rangeMax : number) {
        super(uiLabel);
    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(0, this.rangeMax);
        const b = util.randomInt(0, a);
        return new Prompt(`${a} - ${b}`, a - b);
    }
}
gameTypeRegistry.register(SubtractionFifthGradeGameType, "SubtractionFifthGrade.v1");


export class SubtractionSixthGradeGameType extends GameType {
    constructor(uiLabel: string, private range : Range) {
        super(uiLabel);

    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(this.range.min, this.range.max);
        const b = util.randomInt(this.range.min, this.range.max);
        const bStr = ensureNegativeNumbersHaveParens(b)
        return new Prompt(`${a} - ${bStr}`, a - b);
    }
}
gameTypeRegistry.register(SubtractionSixthGradeGameType, "SubtractionSixthGrade.v1");

export class AdditionFifthGradeGameType extends GameType {
    createRandomPrompt(): Prompt {
        const a = util.randomInt(0, this.rangeMax);
        const b = util.randomInt(0, this.rangeMax);
        return new Prompt(`${a} + ${b}`, a + b);
    }
    constructor(uiLabel: string, private rangeMax : number) {
        super(uiLabel);
    }
}
gameTypeRegistry.register(AdditionFifthGradeGameType, "AdditionFifthGrade.v1");

export class AdditionSixthGradeGameType extends GameType {
    createRandomPrompt(): Prompt {
        const a = util.randomInt(this.range.min, this.range.max);
        const b = util.randomInt(this.range.min, this.range.max);
        const bStr = ensureNegativeNumbersHaveParens(b);
        return new Prompt(`${a} + ${bStr}`, a + b);
    }
    constructor(uiLabel: string, private range : Range) {
        super(uiLabel);
    }
}
gameTypeRegistry.register(AdditionSixthGradeGameType, "AdditionSixthGrade.v1");

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
}
gameTypeRegistry.register(KaloyanHomework_28_12_2025_GameType, "KaloyanHomework_28_12_2025.v1");

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
}
gameTypeRegistry.register(KrisHomework_4_1_2026_GameType_1, "KrisHomework_4_1_2026-1.v1");

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
}
gameTypeRegistry.register(KrisHomework_4_1_2026_GameType_2, "KrisHomework_4_1_2026-2.v1");

export class BracketExpansion extends GameType {
    constructor(
        uiLabel: string,
        private nestingLevel: number,
        private outerRange: Range = new Range(1, 20),
        private innerRange: Range = new Range(-12, 12)
    ) {
        super(uiLabel);
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
        return new Prompt(`${expression.text}`, expression.value);
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
        super(uiLabel, 0);
    }
}
gameTypeRegistry.register(BracketExpansionNesting0GameType, "BracketExpansionNesting0.v1");

export class BracketExpansionNesting1GameType extends BracketExpansion {
    constructor(uiLabel: string) {
        super(uiLabel, 1);
    }
}
gameTypeRegistry.register(BracketExpansionNesting1GameType, "BracketExpansionNesting1.v1");

export class BracketExpansionNesting2GameType extends BracketExpansion {
    constructor(uiLabel: string) {
        super(uiLabel, 2);
    }
}
gameTypeRegistry.register(BracketExpansionNesting2GameType, "BracketExpansionNesting2.v1");

function ensureNegativeNumbersHaveParens(n : BigNumber | number) {
    n = new BigNumber(n);
    if(n.isLessThan(0))
        return `(${n})`
    else
        return `${n}`
}

export class MultiplicationTmpAlexGameType extends GameType{
    constructor(uiLabel: string) {
        super(uiLabel);
    }

    createRandomPrompt(): Prompt {
        const a = util.randomInt(-20, 20);
        const b = util.randomInt(-20, 20);
        return new Prompt(`${a} × ${b}`, a * b);
    }
}
gameTypeRegistry.register(MultiplicationTmpAlexGameType, "MultiplicationTmpAlex.v1");

type WeightedGameType = {
    gameType: GameType;
    weight: number;
};

export class WeightedAssignmentGameType extends GameType {
    constructor(
        uiLabel: string,
        private readonly persistencyKeyValue: string,
        private readonly weightedGameTypes: WeightedGameType[]
    ) {
        super(uiLabel);
    }

    createRandomPrompt(): Prompt {
        if (this.weightedGameTypes.length === 0) {
            throw new Error("No game types available for assignment");
        }
        const total = this.weightedGameTypes.reduce((sum, entry) => sum + entry.weight, 0);
        const roll = Math.random() * Math.max(1, total);
        let running = 0;
        for (const entry of this.weightedGameTypes) {
            running += entry.weight;
            if (roll <= running) {
                return entry.gameType.createRandomPrompt();
            }
        }
        return this.weightedGameTypes[this.weightedGameTypes.length - 1].gameType.createRandomPrompt();
    }
}

export function parseAssignmentGameTypes(jsonText: string): AssignmentGameTypeParseResult {
    if (!jsonText.trim()) {
        return { specs: [], error: "Empty JSON" };
    }
    try {
        const parsed = JSON.parse(jsonText);
        if (!Array.isArray(parsed)) {
            return { specs: [], error: "JSON must be an array" };
        }
        const specs = parsed.map((entry) => {
            const key = String(entry?.key ?? "");
            const probability = Number(entry?.probability ?? 0);
            const params = (entry?.params ?? {}) as Record<string, unknown>;
            return { key, probability, params } satisfies AssignmentGameTypeSpec;
        });
        return { specs };
    } catch (error: any) {
        return { specs: [], error: error?.message ?? "Invalid JSON" };
    }
}

export function createAssignmentGameType(
    assignmentId: string,
    uiLabel: string,
    specs: AssignmentGameTypeSpec[]
): GameType | null {
    const weightedGameTypes: WeightedGameType[] = [];
    for (const spec of specs) {
        const gameType = createGameTypeFromSpec(spec);
        if (!gameType) {
            continue;
        }
        weightedGameTypes.push({
            gameType,
            weight: Number.isFinite(spec.probability) ? spec.probability : 0,
        });
    }
    if (weightedGameTypes.length === 0) {
        return null;
    }
    return new WeightedAssignmentGameType(
        uiLabel,
        `assignment:${assignmentId}`,
        weightedGameTypes
    );
}

function createGameTypeFromSpec(spec: AssignmentGameTypeSpec): GameType | null {
    const params = spec.params ?? {};
    const rangeMin = Number((params as any).rangeMin ?? 0);
    const rangeMax = Number((params as any).rangeMax ?? 0);
    const expRangeMin = Number((params as any).expRangeMin ?? 0);
    const expRangeMax = Number((params as any).expRangeMax ?? 0);
    const range = new Range(rangeMin, rangeMax);
    const expRange = new Range(expRangeMin, expRangeMax);
    switch (spec.key) {
        case "AdditionFifthGrade.v1":
            return new AdditionFifthGradeGameType("", rangeMax);
        case "AdditionSixthGrade.v1":
            return new AdditionSixthGradeGameType("", range);
        case "SubtractionFifthGrade.v1":
            return new SubtractionFifthGradeGameType("", rangeMax);
        case "SubtractionSixthGrade.v1":
            return new SubtractionSixthGradeGameType("", range);
        case "Multiplication.v1":
            return new MultiplicationGameType("", range);
        case "Division.v1":
            return new DivisionGameType("", range, expRange);
        case "BracketExpansion.nesting0.v1":
            return new BracketExpansionNesting0GameType("");
        case "BracketExpansion.nesting1.v1":
            return new BracketExpansionNesting1GameType("");
        case "BracketExpansion.nesting2.v1":
            return new BracketExpansionNesting2GameType("");
        default:
            return null;
    }
}

export type GameTypeList = {
    fifthGrade : GameType[]
    sixthGrade : GameType[]
    homework : GameType[]
}

export function getAvailableGameTypes(): GameTypeList {
    return {
        fifthGrade: [
            new AdditionFifthGradeGameType("Събиране 5кл", 100),
            new SubtractionFifthGradeGameType("Изваждане 5кл", 100),
            new MultiplicationGameType("Умножение 5кл", new Range(0, 10)),
            new DivisionGameType("Деление 5кл", new Range(0, 10), new Range(0, 0)),
        ],
        sixthGrade: [
            new AdditionSixthGradeGameType("Събиране 6кл", new Range(-40, 40)),
            new SubtractionSixthGradeGameType("Изваждане 6кл", new Range(-40, 40)),
            new MultiplicationGameType("Умножение 6кл", new Range(-10, 10)),
            new BracketExpansionNesting0GameType("-1 + 2 - 3 + 90"),
            new BracketExpansionNesting1GameType("Разкриване на скоби"),
            new BracketExpansionNesting2GameType("Разкриване на скоби (вложени)"),
            new KrisHomework_4_1_2026_GameType_1("Крис 1"),
            new KrisHomework_4_1_2026_GameType_2("Крис 2"),
            new KaloyanHomework_28_12_2025_GameType("Калоян 1")
        ],
        homework: []
    };
}

