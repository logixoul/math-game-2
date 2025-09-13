export function randomInt(min, max) {
    var result = Math.random()*(max-min)+min;
    return Math.floor(result);
}

export function shuffleList(inputList) {
    var shuffled = [];
    const initialLength = inputList.length;
    for(var i = 0; i < initialLength; i++) {
        var sourceIndex = randomInt(0, inputList.length);
        var takenPrompt = inputList.splice(sourceIndex, 1)[0];
        shuffled.push(takenPrompt);
    }
    return shuffled;
}