import { Prompt, GameType } from './GameTypes';

const MAX_RECENT_PROMPTS_LENGTH = 10;
const NUM_POSTPONEMENT_TURNS = 10;

class PromptPostponement {
    constructor(public readonly prompt: Prompt, public turnsRemaining: number) {
    }
}

export class PromptScheduler {
    private recentPrompts: Prompt[] = []; // queue
    private postponedPrompts: PromptPostponement[] = [];

    constructor(private readonly gameType: GameType) {
    }

    postponePrompt(promptToPostpone: Prompt): void {
        const existing = this.postponedPrompts.find(postponedPrompt => postponedPrompt.prompt.text === promptToPostpone.text);
        if (existing) {
            existing.turnsRemaining = NUM_POSTPONEMENT_TURNS;
        } else {
            this.postponedPrompts.push(new PromptPostponement(promptToPostpone, NUM_POSTPONEMENT_TURNS));
        }
    }

    rememberPrompt(prompt: Prompt) {
        this.recentPrompts.push(prompt);
        if (this.recentPrompts.length > MAX_RECENT_PROMPTS_LENGTH)
            this.recentPrompts.shift();
    }

    updateTurnsRemainingCounters() {
        for (const postponedPrompt of this.postponedPrompts) {
            postponedPrompt.turnsRemaining = Math.max(0, postponedPrompt.turnsRemaining - 1);
        }
    }

    *generatePrompts(): Generator<Prompt, void, unknown> {
        while (true) {
            // One "turn" has passed since last prompt was completed
            this.updateTurnsRemainingCounters();

            // Serve a due postponed prompt if available
            const dueIndex = this.postponedPrompts.findIndex(p => p.turnsRemaining === 0);
            if (dueIndex !== -1) {
                const [due] = this.postponedPrompts.splice(dueIndex, 1);
                this.rememberPrompt(due.prompt);
                yield due.prompt;
                continue;
            }

            // Otherwise serve a new prompt (avoid recent repeats and postponeds)
            const postponedKeys = new Set(this.postponedPrompts.map(p => p.prompt.text));
            let newPrompt: Prompt;
            do {
                newPrompt = this.gameType.createRandomPrompt();
            }
            while (this.recentPrompts.some(p => p.text === newPrompt.text) ||
                postponedKeys.has(newPrompt.text));

            this.rememberPrompt(newPrompt);
            yield newPrompt;
        }
    }
}
