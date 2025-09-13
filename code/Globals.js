import { UI } from 'UI';

export class Globals {
    constructor() {
        this.currentPromptIndex=null;
        this.numCorrectAtFirstTry = 0;
        this.ui = new UI();
    }
}

export const globals = new Globals();