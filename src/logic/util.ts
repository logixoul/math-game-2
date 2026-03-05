export function randomInt(min: number, max: number): number {
    const result = Math.random() * (max - min + 1) + min;
    return Math.floor(result);
}

export function shuffleList<T>(inputList: T[]): T[] {
    const shuffled: T[] = [];
    const initialLength = inputList.length;
    for (let i = 0; i < initialLength; i++) {
        const sourceIndex = randomInt(0, inputList.length-1);
        const takenPrompt = inputList.splice(sourceIndex, 1)[0];
        shuffled.push(takenPrompt);
    }
    return shuffled;
}

export function isMobileDevice(): boolean {
    return window.matchMedia("(pointer: coarse), (hover: none), (any-pointer: coarse)").matches;
}

export function ensureTextContainsSign(n: number): string {
    return (n >= 0 ? "+" : "") + n.toString();
}
