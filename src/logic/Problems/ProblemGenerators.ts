import BigNumber from "bignumber.js";
import { ensureNegativeNumbersHaveParens, numberToString } from "../Formatting";
import * as util from "../util";
import { generateNumber, type NumberShape } from "./NumberShape";
import { problemGeneratorRegistry } from "./ProblemGeneratorRegistry";

export class Problem {
	failedAttempts: number;
	public readonly answer: BigNumber;

	constructor(
		public readonly text: string,
		answer: number | BigNumber,
	) {
		this.failedAttempts = 0;
		this.answer = new BigNumber(answer);
	}
}

export abstract class ProblemGenerator {
	public readonly persistencyKey!: string;

	abstract createRandomProblem(): Problem;
}

export class Range {
	// inclusive (includes both ends of the range)
	constructor(
		public min: number,
		public max: number,
	) {}
}

export class MultiplicationProblemGeneratorV2 extends ProblemGenerator {
	constructor(
		private readonly aShape: NumberShape,
		private readonly bShape: NumberShape,
	) {
		super();
	}

	createRandomProblem(): Problem {
		const a = generateNumber(this.aShape);
		const b = generateNumber(this.bShape);

		const aStr = numberToString(a);
		const bStr = ensureNegativeNumbersHaveParens(b);
		return new Problem(`${aStr} × ${bStr}`, a.multipliedBy(b));
	}
}
problemGeneratorRegistry.register(
	MultiplicationProblemGeneratorV2,
	"Multiplication.v2",
);

// note: the generated divisee is always larger than the generated divisor, by design
export class DivisionProblemGeneratorV2 extends ProblemGenerator {
	constructor(
		private readonly aShape: NumberShape,
		private readonly bShape: NumberShape,
		private readonly ensureAtLeastOneNonInteger: boolean,
	) {
		super();
	}

	createRandomProblem(): Problem {
		let divisee: BigNumber, divisor: BigNumber;
		do {
			const a = generateNumber(this.aShape);
			const b = generateNumber(this.bShape);
			divisee = a.multipliedBy(b);
			divisor = b;
		} while (!this.pairSatisfiesConstraints(divisee, divisor));

		const result = divisee.dividedBy(divisor);

		const diviseeStr = numberToString(divisee);
		const divisorStr = ensureNegativeNumbersHaveParens(divisor);
		return new Problem(`${diviseeStr} : ${divisorStr}`, result);
	}

	pairSatisfiesConstraints(divisee: BigNumber, divisor: BigNumber): boolean {
		if (divisee.isLessThan(divisor)) return false;
		if (this.ensureAtLeastOneNonInteger) {
			if (divisee.isInteger() && divisor.isInteger()) {
				return false;
			}
		}
		if (divisor.isZero()) {
			return false;
		}
		return true;
	}
}
problemGeneratorRegistry.register(DivisionProblemGeneratorV2, "Division.v2");

export class SubtractionFifthGradeProblemGenerator extends ProblemGenerator {
	constructor(private rangeMax: number) {
		super();
	}

	createRandomProblem(): Problem {
		const a = util.randomInt(0, this.rangeMax);
		const b = util.randomInt(0, a);
		return new Problem(`${a} - ${b}`, a - b);
	}
}
problemGeneratorRegistry.register(
	SubtractionFifthGradeProblemGenerator,
	"SubtractionFifthGrade.v1",
);

export class SubtractionSixthGradeProblemGenerator extends ProblemGenerator {
	constructor(private range: Range) {
		super();
	}

	createRandomProblem(): Problem {
		const a = util.randomInt(this.range.min, this.range.max);
		const b = util.randomInt(this.range.min, this.range.max);
		const aStr = numberToString(a);
		const bStr = ensureNegativeNumbersHaveParens(b);
		return new Problem(`${aStr} - ${bStr}`, a - b);
	}
}
problemGeneratorRegistry.register(
	SubtractionSixthGradeProblemGenerator,
	"SubtractionSixthGrade.v1",
);

export class AdditionProblemGenerator extends ProblemGenerator {
	createRandomProblem(): Problem {
		const a = util.randomInt(this.range.min, this.range.max);
		const b = util.randomInt(this.range.min, this.range.max);
		const aStr = numberToString(a);
		const bStr = ensureNegativeNumbersHaveParens(b);
		return new Problem(`${aStr} + ${bStr}`, a + b);
	}
	constructor(private range: Range) {
		super();
	}
}
problemGeneratorRegistry.register(AdditionProblemGenerator, "Addition.v1");

export class MulDiv10ProblemGenerator extends ProblemGenerator {
	createRandomProblem(): Problem {
		const a = util.randomInt(this.range.min, this.range.max);
		const b = util.randomInt(this.range.min, this.range.max);
		const aStr = numberToString(a);
		const bStr = ensureNegativeNumbersHaveParens(b);
		return new Problem(`${aStr} + ${bStr}`, a + b);
	}
	constructor(private range: Range) {
		super();
	}
}
problemGeneratorRegistry.register(MulDiv10ProblemGenerator, "MulDiv10.v1");

export class BracketExpansion extends ProblemGenerator {
	constructor(
		private nestingLevel: number,
		private outerRange: Range = new Range(1, 20),
		private innerRange: Range = new Range(-12, 12),
	) {
		super();
	}

	createRandomProblem(): Problem {
		const forceNested = this.nestingLevel >= 2;
		const expression = this.buildExpression(
			this.nestingLevel,
			this.nestingLevel > 0,
			this.nestingLevel > 0,
			forceNested,
			2,
			4,
			this.outerRange,
		);
		return new Problem(`${expression.text}`, expression.value);
	}

	private buildExpression(
		maxDepth: number,
		allowParens: boolean,
		forceParen: boolean,
		forceNested: boolean,
		minTerms: number,
		maxTerms: number,
		numberRange: Range,
	): { text: string; value: number; hasParen: boolean; hasNested: boolean } {
		if (!allowParens || maxDepth <= 0) {
			return this.buildLinearExpression(minTerms, maxTerms, numberRange);
		}

		const termCount = util.randomInt(minTerms, maxTerms);
		const forcedParenIndex = forceParen ? util.randomInt(0, termCount - 1) : -1;
		const forcedNestedIndex =
			forceNested && maxDepth >= 2 ? util.randomInt(0, termCount - 1) : -1;
		const terms: {
			text: string;
			value: number;
			hasParen: boolean;
			hasNested: boolean;
		}[] = [];

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
					this.innerRange,
				);
				terms.push({
					text: `(${inner.text})`,
					value: inner.value,
					hasParen: true,
					hasNested: inner.hasParen || inner.hasNested,
				});
			} else {
				const magnitude = this.randomNonZeroInt(
					numberRange.min,
					numberRange.max,
				);
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
		numberRange: Range,
	): { text: string; value: number; hasParen: boolean; hasNested: boolean } {
		const termCount = util.randomInt(minTerms, maxTerms);
		const terms: {
			text: string;
			value: number;
			hasParen: boolean;
			hasNested: boolean;
		}[] = [];
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
		terms: {
			text: string;
			value: number;
			hasParen: boolean;
			hasNested: boolean;
		}[],
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

export class BracketExpansionNesting0ProblemGenerator extends BracketExpansion {
	constructor() {
		super(0);
	}
}
problemGeneratorRegistry.register(
	BracketExpansionNesting0ProblemGenerator,
	"BracketExpansionNesting0.v1",
);

export class BracketExpansionNesting1ProblemGenerator extends BracketExpansion {
	constructor() {
		super(1);
	}
}
problemGeneratorRegistry.register(
	BracketExpansionNesting1ProblemGenerator,
	"BracketExpansionNesting1.v1",
);

export class BracketExpansionNesting2ProblemGenerator extends BracketExpansion {
	constructor() {
		super(2);
	}
}
problemGeneratorRegistry.register(
	BracketExpansionNesting2ProblemGenerator,
	"BracketExpansionNesting2.v1",
);

export class MultiplicationTmpAlexProblemGenerator extends ProblemGenerator {
	createRandomProblem(): Problem {
		const a = util.randomInt(-20, 20);
		const b = util.randomInt(-20, 20);
		return new Problem(`${a} × ${b}`, a * b);
	}
}
problemGeneratorRegistry.register(
	MultiplicationTmpAlexProblemGenerator,
	"MultiplicationTmpAlex.v1",
);

/*export class LinearEquationProblemGenerator extends ProblemGenerator {
    constructor() {
        super();
    }

    createRandomProblem(): Problem {
        // todo: no zero
        const a = util.randomInt(-20, 20);
        const b = util.randomInt(-20, 20);
        const ordering = util.randomInt(0, 2);
        switch(ordering) {
            case 0:
                return new Problem(`${a}x`);
        }
    }
}
problemGeneratorRegistry.register(MultiplicationTmpAlexProblemGenerator, "MultiplicationTmpAlex.v1");*/
