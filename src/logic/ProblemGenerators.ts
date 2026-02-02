import { BigNumber } from "bignumber.js";
import { ensureNegativeNumbersHaveParens, numberToString } from "./Formatting";
import { problemGeneratorRegistry } from "./ProblemGeneratorRegistry";
import * as util from "./util";

export type AssignmentPartSpec = {
	key: string;
	params?: Record<string, unknown>;
	probability: number;
};

export type AssignmentSpecParseResult = {
	specs: AssignmentPartSpec[];
	error?: string;
};

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

export class MultiplicationProblemGenerator extends ProblemGenerator {
	constructor(
		private range: Range,
		private expRange: Range,
	) {
		super();
	}

	createRandomProblem(): Problem {
		const expA = util.randomInt(this.expRange.min, this.expRange.max);
		const expB = util.randomInt(this.expRange.min, this.expRange.max);

		const a = util.randomInt(this.range.min, this.range.max);
		const b = util.randomInt(this.range.min, this.range.max);

		const aRaised = new BigNumber(a).shiftedBy(expA);
		const bRaised = new BigNumber(b).shiftedBy(expB);

		const aRaisedStr = numberToString(aRaised);
		const bRaisedStr = ensureNegativeNumbersHaveParens(bRaised);
		return new Problem(
			`${aRaisedStr} × ${bRaisedStr}`,
			aRaised.multipliedBy(bRaised),
		);
	}
}
problemGeneratorRegistry.register(
	MultiplicationProblemGenerator,
	"Multiplication.v1",
);

// note: the generated divisee is always larger than the generated divisor, by design
export class DivisionProblemGenerator extends ProblemGenerator {
	constructor(
		private range: Range,
		private expRange: Range,
		private ensureAtLeastOneNonInteger: boolean,
	) {
		super();
	}

	createRandomProblem(): Problem {
		let diviseeRaised: BigNumber, divisorRaised: BigNumber;
		while (true) {
			const expDivisee = util.randomInt(this.expRange.min, this.expRange.max);
			let expDivisor = util.randomInt(this.expRange.min, this.expRange.max);
			expDivisor = Math.min(expDivisee, expDivisor);

			const a = util.randomInt(this.range.min, this.range.max);
			let b: number;
			do {
				b = util.randomInt(this.range.min, this.range.max);
			} while (b === 0);
			const divisee = a * b;
			const divisor = b;

			diviseeRaised = new BigNumber(divisee).shiftedBy(expDivisee);
			divisorRaised = new BigNumber(divisor).shiftedBy(expDivisor);
			if (this.ensureAtLeastOneNonInteger) {
				if (diviseeRaised.isInteger() && divisorRaised.isInteger()) continue;
				else break;
			} else {
				break;
			}
		}
		const aFinal = diviseeRaised.dividedBy(divisorRaised);

		const diviseeRaisedStr = numberToString(diviseeRaised);
		const divisorRaisedStr = ensureNegativeNumbersHaveParens(divisorRaised);
		return new Problem(`${diviseeRaisedStr} : ${divisorRaisedStr}`, aFinal);
	}
}
problemGeneratorRegistry.register(DivisionProblemGenerator, "Division.v1");

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

type WeightedProblemGenerator = {
	problemGenerator: ProblemGenerator;
	weight: number;
};

export class WeightedAssignmentProblemGenerator extends ProblemGenerator {
	constructor(
		readonly persistencyKeyValue: string,
		private readonly weightedProblemGenerators: WeightedProblemGenerator[],
	) {
		super();
		this.persistencyKey = persistencyKeyValue;
	}

	createRandomProblem(): Problem {
		if (this.weightedProblemGenerators.length === 0) {
			throw new Error("No problem generators available for assignment");
		}
		const total = this.weightedProblemGenerators.reduce(
			(sum, entry) => sum + entry.weight,
			0,
		);
		const roll = Math.random() * Math.max(1, total);
		let running = 0;
		for (const entry of this.weightedProblemGenerators) {
			running += entry.weight;
			if (roll <= running) {
				return entry.problemGenerator.createRandomProblem();
			}
		}
		return this.weightedProblemGenerators[
			this.weightedProblemGenerators.length - 1
		].problemGenerator.createRandomProblem();
	}
}

export function parseAssignmentProblemGenerators(
	jsonText: string,
): AssignmentSpecParseResult {
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
			const probability = Number(entry?.probability ?? 1);
			const params = (entry?.params ?? {}) as Record<string, unknown>;
			return { key, probability, params } satisfies AssignmentPartSpec;
		});
		return { specs };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return { specs: [], error: message || "Invalid JSON" };
	}
}

export function createAssignmentProblemGenerator(
	assignmentId: string,
	specs: AssignmentPartSpec[],
): ProblemGenerator | null {
	const weightedProblemGenerators: WeightedProblemGenerator[] = [];
	for (const spec of specs) {
		const problemGenerator = createProblemGeneratorFromSpec(spec);
		if (!problemGenerator) {
			continue;
		}
		weightedProblemGenerators.push({
			problemGenerator,
			weight: Number.isFinite(spec.probability) ? spec.probability : 0,
		});
	}
	if (weightedProblemGenerators.length === 0) {
		return null;
	}
	return new WeightedAssignmentProblemGenerator(
		`assignment:${assignmentId}`,
		weightedProblemGenerators,
	);
}

function createProblemGeneratorFromSpec(
	spec: AssignmentPartSpec,
): ProblemGenerator | null {
	const params = spec.params ?? {};
	const readNumberParam = (key: string) => {
		const raw = params[key];
		const value = typeof raw === "number" ? raw : Number(raw);
		return Number.isFinite(value) ? value : 0;
	};
	const readBooleanParam = (key: string) => {
		const raw = params[key];
		if (typeof raw === "boolean") return raw;
		else return false;
	};
	const rangeMin = readNumberParam("rangeMin");
	const rangeMax = readNumberParam("rangeMax");
	const expRangeMin = readNumberParam("expRangeMin");
	const expRangeMax = readNumberParam("expRangeMax");
	const ensureAtLeastOneNonInteger = readBooleanParam(
		"ensureAtLeastOneNonInteger",
	);
	const range = new Range(rangeMin, rangeMax);
	const expRange = new Range(expRangeMin, expRangeMax);
	switch (spec.key) {
		case "Addition.v1":
			return new AdditionProblemGenerator(range);
		case "SubtractionFifthGrade.v1":
			return new SubtractionFifthGradeProblemGenerator(rangeMax);
		case "SubtractionSixthGrade.v1":
			return new SubtractionSixthGradeProblemGenerator(range);
		case "Multiplication.v1":
			return new MultiplicationProblemGenerator(range, expRange);
		case "Division.v1":
			return new DivisionProblemGenerator(
				range,
				expRange,
				ensureAtLeastOneNonInteger,
			);
		case "BracketExpansion.nesting0.v1":
			return new BracketExpansionNesting0ProblemGenerator();
		case "BracketExpansion.nesting1.v1":
			return new BracketExpansionNesting1ProblemGenerator();
		case "BracketExpansion.nesting2.v1":
			return new BracketExpansionNesting2ProblemGenerator();
		default:
			return null;
	}
}
