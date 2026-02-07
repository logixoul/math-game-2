import BigNumber from "bignumber.js";
import * as z from "zod";
import * as util from "../util";

export const numberShapeSchema = z.object({
	isSigned: z.boolean(),
	canBeZero: z.boolean(),
	// magnitude range
	magMin: z.number().int().nonnegative(),
	magMax: z.number().int().nonnegative(),
	// (optional) 10^n multiplier ("exponent range").
	expMin: z.number().int(),
	expMax: z.number().int(),
});

export type NumberShape = z.infer<typeof numberShapeSchema>;

export function generateNumber(shape: NumberShape): BigNumber {
	const exp = util.randomInt(shape.expMin, shape.expMax); // exponent

	let mag: number; // magnitude
	do {
		mag = util.randomInt(shape.magMin, shape.magMax);
	} while (mag === 0 && !shape.canBeZero);
	if (shape.isSigned) {
		const sign = util.randomInt(0, 1);
		if (sign === 1) mag *= -1;
	}

	const magRaised = new BigNumber(mag).shiftedBy(exp);
	return magRaised;
}
