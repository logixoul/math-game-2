import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { firebaseController, useFirebaseSnapshot, AssignmentRecord } from "../FirebaseController";
import { createAssignmentGameType, parseAssignmentGameTypes } from "../GameTypes";
import { GameSessionPage } from "./GameSessionPage";
import { ErrorPage } from "./ErrorPage";

export function AssignmentSessionRoute() {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const snapshot = useFirebaseSnapshot();
    const [assignment, setAssignment] = useState<AssignmentRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!snapshot.user || !assignmentId) {
            setAssignment(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const unsubscribe = firebaseController.onAssignmentChanged(
            snapshot.user.uid,
            assignmentId,
            (nextAssignment) => {
                setAssignment(nextAssignment);
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, [assignmentId, snapshot.user]);

    const gameType = useMemo(() => {
        if (!assignment) return null;
        const parsed = parseAssignmentGameTypes(assignment.gameTypesJson);
        if (parsed.error) return null;
        return createAssignmentGameType(assignment.id, assignment.name, parsed.specs);
    }, [assignment]);

    if (!snapshot.user) {
        return <ErrorPage />;
    }

    if (isLoading) {
        return <div>Loading assignment...</div>;
    }

    if (!assignment || !gameType) {
        return <ErrorPage />;
    }

    return <GameSessionPage gameType={gameType} assignmentId={assignment.id} />;
}
