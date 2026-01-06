import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AssignmentAttempt, firebaseController, useFirebaseSnapshot } from "../FirebaseController";
import styles from "./AssignmentAttempts.module.css";
import { ErrorPage } from "./ErrorPage";

export function AssignmentAttempts() {
    const { uid, assignmentId } = useParams<{ uid: string; assignmentId: string }>();
    const snapshot = useFirebaseSnapshot();
    const [attempts, setAttempts] = useState<AssignmentAttempt[]>([]);
    const isAdmin = Boolean(snapshot.user && firebaseController.isCurrentUserAdmin());

    useEffect(() => {
        if (!uid || !assignmentId || !isAdmin) return;
        const unsubscribe = firebaseController.onAssignmentAttemptsChanged(uid, assignmentId, setAttempts);
        return () => unsubscribe();
    }, [uid, assignmentId, isAdmin]);

    if (!isAdmin) {
        return <ErrorPage />;
    }

    const sortedAttempts = useMemo(() => {
        return [...attempts].sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
        });
    }, [attempts]);

    return (
        <div className={styles.page}>
            <Link className={styles.backLink} to={`/admin/users/${uid}`}>Back to assignments</Link>
            <h2>Assignment attempts</h2>
            <div className={styles.attemptsList}>
                {sortedAttempts.map((attempt) => {
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
                {sortedAttempts.length === 0 && (
                    <div className={styles.emptyState}>No attempts yet.</div>
                )}
            </div>
        </div>
    );
}
