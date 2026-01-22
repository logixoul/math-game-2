import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { firebaseController, AssignmentRecord } from "@/logic/FirebaseController";
import { createAssignmentGameType, parseAssignmentGameTypes } from "@/logic/GameTypes";
import { GameSessionPage } from "./GameSessionPage";
import { ErrorPage } from "./ErrorPage";

export function AssignmentSessionRoute() {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const [assignment, setAssignment] = useState<AssignmentRecord | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!assignmentId) {
            setAssignment(null);
            return;
        }
        const unsubscribe = firebaseController.onAssignmentChanged(
            assignmentId,
            (nextAssignment) => {
                setAssignment(nextAssignment);
            }
        );
        return () => unsubscribe();
    }, [assignmentId]);

    const gameType = useMemo(() => {
        if (!assignment) return null;
        const parsed = parseAssignmentGameTypes(assignment.spec);
        if (parsed.error) {
            setErrorMessage("Error parsing assignment spec: " + parsed.error);
            return null;
        }
        return createAssignmentGameType(assignment.id, assignment.name, parsed.specs);
    }, [assignment]);

    if (!assignment || !gameType) {
        return <ErrorPage message={errorMessage}/>;
    }

    return <GameSessionPage gameType={gameType} assignmentId={assignment.id} />;
}
