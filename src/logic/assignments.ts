import {
	AdditionProblemGenerator,
	BracketExpansionNesting0ProblemGenerator,
	BracketExpansionNesting1ProblemGenerator,
	BracketExpansionNesting2ProblemGenerator,
	DivisionProblemGenerator,
	MultiplicationProblemGenerator,
	type Problem,
	ProblemGenerator,
	Range,
	SubtractionFifthGradeProblemGenerator,
	SubtractionSixthGradeProblemGenerator,
} from "./Problems/ProblemGenerators";

export type AssignmentRecord = {
	id: string;
	uid: string;
	name: string;
	spec: string;
	category: string;
	index: number;
};

export type AssignmentPartSpec = {
	key: string;
	params?: Record<string, unknown>;
	probability: number;
};

export type AssignmentSpecParseResult = {
	specs: AssignmentPartSpec[];
	error?: string;
};

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

export type WeightedProblemGenerator = {
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
		const roll = Math.random() * total;
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
