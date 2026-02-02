import { describe, expect, it, vi } from "vitest";
import { GameSession } from "./GameSession";
import { Problem, ProblemGenerator } from "./ProblemGenerators";

type TestUI = {
    updateProgressIndicator: ReturnType<typeof vi.fn>;
    showProblem: ReturnType<typeof vi.fn>;
    updateSessionTimeIndicator: ReturnType<typeof vi.fn>;
    informUser: ReturnType<typeof vi.fn>;
    onWin: ReturnType<typeof vi.fn>;
};

class SequenceProblemGenerator extends ProblemGenerator {
    public readonly persistencyKey = "testgen";
    private index = 0;

    constructor(private readonly problems: Problem[]) {
        super();
    }

    createRandomProblem(): Problem {
        const problem = this.problems[this.index % this.problems.length];
        this.index += 1;
        return problem;
    }
}

function makeUI(): TestUI {
    return {
        updateProgressIndicator: vi.fn(),
        showProblem: vi.fn(),
        updateSessionTimeIndicator: vi.fn(),
        informUser: vi.fn(),
        onWin: vi.fn(),
    };
}

function createSession() {
    const problems = [
        new Problem("1 + 1", 2),
        new Problem("2 + 2", 4),
        new Problem("3 + 3", 6),
    ];
    const generator = new SequenceProblemGenerator(problems);
    const ui = makeUI();
    const session = new GameSession(ui, generator);
    return { session, ui, generator, problems };
}

describe("GameSession", () => {
    it("handles non-numeric answers without changing session state", () => {
        const { session, ui } = createSession();

        session.onUserAnswered("not-a-number");

        expect(ui.informUser).toHaveBeenCalledWith(
            "Това не е число!",
            "white",
            true,
        );
        expect(ui.showProblem).toHaveBeenCalledTimes(1);
        expect(session.pointsTowardWin).toBe(0);
        expect(session.problemsAttempted).toBe(0);
        expect(session.errorCount).toBe(0);
    });

    it("counts a correct answer and advances to the next problem", () => {
        const { session, ui } = createSession();

        session.onUserAnswered("2");

        expect(session.pointsTowardWin).toBe(1);
        expect(session.maxReachedPointsTowardWin).toBe(1);
        expect(session.problemsAttempted).toBe(1);
        expect(session.numCorrectAtFirstTry).toBe(1);
        expect(session.numWrongAtFirstTry).toBe(0);
        expect(ui.informUser).toHaveBeenCalledWith(
            "Точно така!",
            "#00c000",
        );
        expect(ui.updateProgressIndicator).toHaveBeenCalledTimes(2);
        expect(ui.showProblem).toHaveBeenCalledTimes(1);
        expect(session.getCurrentProblem().text).toBe("2 + 2");
    });

    it("counts an incorrect answer and keeps the same problem", () => {
        const { session, ui } = createSession();
        const currentProblem = session.getCurrentProblem();

        session.onUserAnswered("999");

        expect(session.pointsTowardWin).toBe(-1);
        expect(session.numWrongAtFirstTry).toBe(1);
        expect(session.errorCount).toBe(1);
        expect(session.problemsAttempted).toBe(0);
        expect(ui.updateProgressIndicator).toHaveBeenCalledTimes(1);
        expect(ui.updateSessionTimeIndicator).toHaveBeenCalledTimes(1);
        expect(ui.showProblem).toHaveBeenCalledTimes(1);
        expect(ui.informUser).toHaveBeenCalledWith(
            "Пробвай пак.",
            "#ff4020",
        );
        expect(currentProblem.failedAttempts).toBe(1);
    });

    it("wins when the win conditions are met", () => {
        const { session, ui } = createSession();

        vi.useFakeTimers();
        try {
            const now = new Date("2026-02-02T12:00:00Z");
            vi.setSystemTime(now);

            session.pointsTowardWin = 19;
            session.maxReachedPointsTowardWin = 19;
            session.problemsAttempted = 19;
            session.gameStartTimestamp = now.getTime() - 1000;

            session.onUserAnswered("2");

            expect(session.pointsTowardWin).toBe(20);
            expect(session.problemsAttempted).toBe(20);
            expect(ui.onWin).toHaveBeenCalledTimes(1);
            expect(ui.updateProgressIndicator).toHaveBeenCalledTimes(1);
            expect(ui.showProblem).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });

    it("reveals an answer, postpones the problem, and advances", () => {
        const { session, ui } = createSession();
        const currentProblem = session.getCurrentProblem();
        const postponeSpy = vi.spyOn(session.problemScheduler, "postponeProblem");

        session.onUserRequestedAnswerReveal();

        expect(session.pointsTowardWin).toBe(-1);
        expect(session.problemsAttempted).toBe(1);
        expect(session.errorCount).toBe(1);
        expect(ui.updateProgressIndicator).toHaveBeenCalledTimes(2);
        expect(ui.updateSessionTimeIndicator).toHaveBeenCalledTimes(1);
        expect(ui.showProblem).toHaveBeenCalledTimes(1);
        expect(ui.informUser).toHaveBeenCalledWith(
            "Отговорът е " + currentProblem.answer + "",
            "#4ac",
        );
        expect(postponeSpy).toHaveBeenCalledWith(currentProblem);
        expect(currentProblem.failedAttempts).toBe(1);
        expect(session.getCurrentProblem().text).toBe("2 + 2");
    });
});
