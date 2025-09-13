//import { UIController } from './UI';

export class Globals {
    constructor() {
        this.currentPromptIndex=null;
        this.numCorrectAtFirstTry = 0;
    }
}

export const globals = new Globals();