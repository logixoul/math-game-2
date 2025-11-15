class Prompt {
    constructor(text, answer) {
        this.text = text;
        this.answer = answer;
    }
}

export class MultiplicationPrompt extends Prompt {
    constructor(a, b) {
        super(`${a} × ${b}`, a * b);
        this.a = a;
        this.b = b;
    }
}

export class DivisionPrompt extends Prompt {
    constructor(a, b) {
        super(`${a} : ${b}`, a / b);
        this.a = a;
        this.b = b;
    }
}

export class SubtractionPrompt extends Prompt {
    constructor(a, b) {
        super(`${a} - ${b}`, a - b);
        this.a = a;
        this.b = b;
    }
}