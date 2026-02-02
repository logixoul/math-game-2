import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { firebaseController, AssignmentRecord } from "@/logic/FirebaseController";
import {
	createAssignmentProblemGenerator,
	parseAssignmentProblemGenerators,
} from "@/logic/ProblemGenerators";
import { GameSessionPage } from "./GameSessionPage";
import { ErrorPage } from "./ErrorPage";

export function AssignmentSessionRoute() {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const [assignment, setAssignment] = useState<AssignmentRecord | null>(null);

    useEffect(() => {
        if (!assignmentId) return;
        const unsubscribe = firebaseController.onAssignmentChanged(
            assignmentId,
            (nextAssignment) => {
                setAssignment(nextAssignment);
            }
        );
        return () => unsubscribe();
    }, [assignmentId]);

    const parsed = useMemo(() => {
        if (!assignment) return null;
        return parseAssignmentProblemGenerators(assignment.spec);
    }, [assignment]);

    const errorMessage = useMemo(() => {
        if (!assignment || !parsed?.error) return "";
        return "Error parsing assignment spec: " + parsed.error;
    }, [assignment, parsed]);

    const problemGenerator = useMemo(() => {
        if (!assignment || !parsed || parsed.error) return null;
        return createAssignmentProblemGenerator(assignment.id, parsed.specs);
    }, [assignment, parsed]);

    if (!assignment || !problemGenerator) {
        return <ErrorPage message={errorMessage}/>;
    }

    return <GameSessionPage problemGenerator={problemGenerator} assignmentId={assignment.id} />;
}
