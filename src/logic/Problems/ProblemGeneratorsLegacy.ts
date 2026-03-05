import { BigNumber } from "bignumber.js";
import { ensureNegativeNumbersHaveParens, numberToString } from "../Formatting";
import * as util from "../util";
import { problemGeneratorRegistry } from "./ProblemGeneratorRegistry";
import { Problem, ProblemGenerator, type Range } from "./ProblemGenerators";

export class MultiplicationProblemGeneratorV1 extends ProblemGenerator {
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
	MultiplicationProblemGeneratorV1,
	"Multiplication.v1",
);

// note: the generated divisee is always larger than the generated divisor, by design
export class DivisionProblemGeneratorV1 extends ProblemGenerator {
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
problemGeneratorRegistry.register(DivisionProblemGeneratorV1, "Division.v1");
