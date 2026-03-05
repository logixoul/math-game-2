import type { DocumentData, FirestoreDataConverter } from "firebase/firestore";
import type { NumberShape } from "./Problems/NumberShape";
import {
	AdditionProblemGenerator,
	BracketExpansionNesting0ProblemGenerator,
	BracketExpansionNesting1ProblemGenerator,
	BracketExpansionNesting2ProblemGenerator,
	DivisionProblemGeneratorV2,
	MultiplicationProblemGeneratorV2,
	type Problem,
	ProblemGenerator,
	Range,
	SubtractionFifthGradeProblemGenerator,
	SubtractionSixthGradeProblemGenerator,
} from "./Problems/ProblemGenerators";
import {
	DivisionProblemGeneratorV1,
	MultiplicationProblemGeneratorV1,
} from "./Problems/ProblemGeneratorsLegacy";

export type AssignmentPartParams = Record<string, unknown>;

export type AssignmentPartData = {
	key: string;
	probability: number;
	params: AssignmentPartParams;
};

export type AssignmentData = {
	name: string;
	spec: Array<AssignmentPartData>;
	category: string;
	index: number;
};

export type AssignmentDoc = {
	id: string;
	data: AssignmentData;
};

function ensureLatestSchema(data: DocumentData) : DocumentData {
	let spec = data.spec;

	if (typeof data.spec === "string") {
		// we have an old schema version (json-as-string)
		spec = assignmentJsonToObject(spec);
	}

	return { ...data, spec };
}

export const assignmentConverter: FirestoreDataConverter<AssignmentData> = {
	toFirestore(value: AssignmentData): DocumentData {
		return value;
	},
	fromFirestore(snap): AssignmentData {
		const data = snap.data();
		const migrated = ensureLatestSchema(data);
		return migrated as AssignmentData;
	},
};

export interface AssignmentPartDataInput {
  key: string;
  probability?: number;
  params: AssignmentPartParams;
}

export function assignmentJsonToObject(jsonText: string): AssignmentPartData[] {
	const parsed = JSON.parse(jsonText);
	if(!Array.isArray(parsed)) {
		throw new Error("Parsed JSON must be an array");
	}

	for(const [index, entry ] of parsed.entries()) {
		// for schema migration: if probability is missing, add it with default value 1
		entry.probability ??= 1;
	}
	return parsed as AssignmentPartData[];
}

export function assignmentObjectToJson(spec: AssignmentPartData[]): string {
	return JSON.stringify(spec, null, 2);
}

export function createAssignmentProblemGenerator(
	assignmentId: string,
	specs: AssignmentPartData[],
): ProblemGenerator | null {
	const weightedProblemGenerators: WeightedProblemGenerator[] = [];
	for (const spec of specs) {
		const problemGenerator = createProblemGeneratorFromSpec(spec);
		if (!problemGenerator) {
			continue;
		}
		weightedProblemGenerators.push({
			problemGenerator,
			probability: spec.probability,
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
	spec: AssignmentPartData,
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
	const readNumberShapeParam = (key: string): NumberShape => {
		const raw = params[key];
		// todo: remove casts
		if (typeof raw === "object") return raw as NumberShape;
		else return {} as NumberShape;
	};
	const rangeMin = readNumberParam("rangeMin");
	const rangeMax = readNumberParam("rangeMax");
	const expRangeMin = readNumberParam("expRangeMin");
	const expRangeMax = readNumberParam("expRangeMax");
	const aShape = readNumberShapeParam("aShape");
	const bShape = readNumberShapeParam("bShape");
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
			return new MultiplicationProblemGeneratorV1(range, expRange);
		case "Multiplication.v2":
			return new MultiplicationProblemGeneratorV2(aShape, bShape);
		case "Division.v1":
			return new DivisionProblemGeneratorV1(
				range,
				expRange,
				ensureAtLeastOneNonInteger,
			);
		case "Division.v2":
			return new DivisionProblemGeneratorV2(
				aShape,
				bShape,
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
	probability: number;
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
			(sum, entry) => sum + entry.probability,
			0,
		);
		const roll = Math.random() * total;
		let running = 0;
		for (const entry of this.weightedProblemGenerators) {
			running += entry.probability;
			if (roll <= running) {
				return entry.problemGenerator.createRandomProblem();
			}
		}
		return this.weightedProblemGenerators[
			this.weightedProblemGenerators.length - 1
		].problemGenerator.createRandomProblem();
	}
}
