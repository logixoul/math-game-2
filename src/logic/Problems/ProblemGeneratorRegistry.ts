import type { ProblemGenerator } from "./ProblemGenerators";

/*type ProblemGeneratorCtor = new (
	params: AssignmentPartParams,
) => ProblemGenerator;*/
interface ProblemGeneratorCtor {
	new (...args: any[]): ProblemGenerator;
	prototype: ProblemGenerator;
}

type ProblemGeneratorPrototype = ProblemGenerator & { persistencyKey: string };

export class ProblemGeneratorRegistry {
	private _problemGeneratorMap = new Map<string, ProblemGeneratorCtor>();

	public get problemGeneratorMap(): Map<string, ProblemGeneratorCtor> {
		return this._problemGeneratorMap;
	}

	public register(
		problemGeneratorCtor: ProblemGeneratorCtor,
		persistencyKey: string,
	): void {
		this.problemGeneratorMap.set(persistencyKey, problemGeneratorCtor);
		Object.defineProperty(
			problemGeneratorCtor.prototype as ProblemGeneratorPrototype,
			"persistencyKey",
			{
				value: persistencyKey,
				writable: false,
			},
		);
	}

	public create(
		persistencyKey: string,
		params: Record<string, unknown> = {},
	): ProblemGenerator {
		const ctor = this.problemGeneratorMap.get(persistencyKey);
		if (!ctor) {
			throw new Error(
				`No problem generator registered with persistency key: ${persistencyKey}`,
			);
		}
		return new ctor(params);
	}
}

export const problemGeneratorRegistry = new ProblemGeneratorRegistry();
