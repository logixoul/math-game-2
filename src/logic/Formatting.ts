import { BigNumber } from "bignumber.js";

const fmt : BigNumber.Format = {
    prefix: '',
    decimalSeparator: ',',
    groupSeparator: ' ',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
    suffix: ''
}

export function numberToString(num: BigNumber | number): string {
    return new BigNumber(num).toFormat(fmt);
}

export function ensureNegativeNumbersHaveParens(n : BigNumber | number) {
    n = new BigNumber(n);
    if(n.isLessThan(0))
        return `(${numberToString(n)})`
    else
        return `${numberToString(n)}`
}

export function initGlobalFormattingSettings() {
    BigNumber.config({ FORMAT: fmt });
}