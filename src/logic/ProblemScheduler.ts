import { Problem, ProblemGenerator } from './ProblemGenerators';

const MAX_RECENT_PROBLEMS_LENGTH = 10;
const NUM_POSTPONEMENT_TURNS = 10;

class ProblemPostponement {
    constructor(public readonly problem: Problem, public turnsRemaining: number) {
    }
}

export class ProblemScheduler {
    private recentProblems: Problem[] = []; // queue
    private postponedProblems: ProblemPostponement[] = [];

    constructor(private readonly problemGenerator: ProblemGenerator) {
    }

    postponeProblem(problemToPostpone: Problem): void {
        const existing = this.postponedProblems.find((postponedProblem) => postponedProblem.problem.text === problemToPostpone.text);
        if (existing) {
            existing.turnsRemaining = NUM_POSTPONEMENT_TURNS;
        } else {
            this.postponedProblems.push(new ProblemPostponement(problemToPostpone, NUM_POSTPONEMENT_TURNS));
        }
    }

    rememberProblem(problem: Problem) {
        this.recentProblems.push(problem);
        if (this.recentProblems.length > MAX_RECENT_PROBLEMS_LENGTH) {
            this.recentProblems.shift();
        }
    }

    updateTurnsRemainingCounters() {
        for (const postponedProblem of this.postponedProblems) {
            postponedProblem.turnsRemaining = Math.max(0, postponedProblem.turnsRemaining - 1);
        }
    }

    *generateProblems(): Generator<Problem, void, unknown> {
        while (true) {
            // One "turn" has passed since last problem was completed
            this.updateTurnsRemainingCounters();

            // Serve a due postponed problem if available
            const dueIndex = this.postponedProblems.findIndex((p) => p.turnsRemaining === 0);
            if (dueIndex !== -1) {
                const [due] = this.postponedProblems.splice(dueIndex, 1);
                this.rememberProblem(due.problem);
                yield due.problem;
                continue;
            }

            // Otherwise serve a new problem (avoid recent repeats and postponed ones)
            const postponedKeys = new Set(this.postponedProblems.map((p) => p.problem.text));
            let newProblem: Problem;
            do {
                newProblem = this.problemGenerator.createRandomProblem();
            }
            while (
                this.recentProblems.some((p) => p.text === newProblem.text) ||
                postponedKeys.has(newProblem.text)
            );

            this.rememberProblem(newProblem);
            yield newProblem;
        }
    }
}
