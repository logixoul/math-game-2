import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AssignmentAttempt, AssignmentRecord, firebaseController, useFirebaseSnapshot } from "../FirebaseController";
import { getAvailableGameTypes } from "../GameTypes";
import styles from "./UserAttempts.module.css";
import { ErrorPage } from "./ErrorPage";

type AttemptGroup = {
    key: string;
    label: string;
    attempts: AssignmentAttempt[];
};

export function UserAttempts() {
    const { uid } = useParams<{ uid: string }>();
    const snapshot = useFirebaseSnapshot();
    const [attempts, setAttempts] = useState<AssignmentAttempt[]>([]);
    const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
    const isAdmin = Boolean(snapshot.user && firebaseController.isCurrentUserAdmin());

    useEffect(() => {
        if (!uid || !isAdmin) return;
        const unsubscribeAttempts = firebaseController.onUserAttemptsChanged(uid, setAttempts);
        const unsubscribeAssignments = firebaseController.onAssignmentsChanged(uid, setAssignments);
        return () => {
            unsubscribeAttempts();
            unsubscribeAssignments();
        };
    }, [uid, isAdmin]);

    if (!isAdmin) {
        return <ErrorPage />;
    }

    const gameTypeByKey = useMemo(() => {
        const gameTypes = getAvailableGameTypes();
        return new Map(
            Object.values(gameTypes).flat().map((type) => [type.persistencyKey, type])
        );
    }, []);

    const assignmentById = useMemo(() => {
        return new Map(assignments.map((assignment) => [assignment.id, assignment]));
    }, [assignments]);

    const sortedAttempts = useMemo(() => {
        return [...attempts].sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
        });
    }, [attempts]);

    const groupedAttempts = useMemo(() => {
        const groups = new Map<string, AttemptGroup>();
        for (const attempt of sortedAttempts) {
            const assignmentId = attempt.assignmentId ?? null;
            let groupKey: string;
            let groupLabel: string;
            if (assignmentId) {
                const assignment = assignmentById.get(assignmentId);
                const name = assignment?.name ?? "Assignment (deleted)";
                const dueText = assignment?.dueText?.trim() ?? "";
                groupKey = `assignment:${assignmentId}`;
                groupLabel = dueText ? `${name} - ${dueText}` : name;
            } else {
                const gameType = gameTypeByKey.get(attempt.resultStats.gameTypeKey);
                groupKey = `game:${attempt.resultStats.gameTypeKey}`;
                groupLabel = gameType?.uiLabel ?? attempt.resultStats.gameTypeKey;
            }
            const existing = groups.get(groupKey);
            if (existing) {
                existing.attempts.push(attempt);
            } else {
                groups.set(groupKey, { key: groupKey, label: groupLabel, attempts: [attempt] });
            }
        }
        return Array.from(groups.values());
    }, [assignmentById, gameTypeByKey, sortedAttempts]);

    return (
        <div className={styles.page}>
            <Link className={styles.backLink} to={`/admin/users/${uid}`}>Back to user</Link>
            <h2>User attempts</h2>
            <div className={styles.attemptsList}>
                {groupedAttempts.map((group) => (
                    <section key={group.key} className={styles.attemptGroup}>
                        <h3 className={styles.groupHeader}>{group.label}</h3>
                        {group.attempts.map((attempt) => {
                            const timestamp = attempt.createdAt?.toDate?.();
                            const formatted = timestamp ? timestamp.toLocaleString() : "(unknown time)";
                            const stats = attempt.resultStats;
                            return (
                                <div key={attempt.id} className={styles.attemptCard}>
                                    <div className={styles.attemptHeader}>{formatted}</div>
                                    <div className={styles.attemptDetail}>Reason: {attempt.completionReason}</div>
                                    <div className={styles.attemptDetail}>Time: {Math.round(stats.timeElapsedMs / 1000)}s</div>
                                    <div className={styles.attemptDetail}>Accuracy: {stats.percentCorrectOnFirstTry}%</div>
                                    <div className={styles.attemptDetail}>Points: {stats.pointsTowardWin}</div>
                                    <div className={styles.attemptDetail}>Problems: {stats.problemsAttempted}</div>
                                    <div className={styles.attemptDetail}>Max points: {stats.maxReachedPointsTowardWin}</div>
                                </div>
                            );
                        })}
                    </section>
                ))}
                {groupedAttempts.length === 0 && (
                    <div className={styles.emptyState}>No attempts yet.</div>
                )}
            </div>
        </div>
    );
}
