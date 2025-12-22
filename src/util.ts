export function randomInt(min: number, max: number): number {
    const result = Math.random() * (max - min) + min;
    return Math.floor(result);
}

export function shuffleList<T>(inputList: T[]): T[] {
    const shuffled: T[] = [];
    const initialLength = inputList.length;
    for (let i = 0; i < initialLength; i++) {
        const sourceIndex = randomInt(0, inputList.length);
        const takenPrompt = inputList.splice(sourceIndex, 1)[0];
        shuffled.push(takenPrompt);
    }
    return shuffled;
}
