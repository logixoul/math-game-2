import {
    createAssignmentProblemGenerator,
} from "@/logic/assignments";
import { useAssignment } from "@/logic/assignmentStore";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ErrorPage } from "./ErrorPage";
import { GameSessionPage } from "./GameSessionPage";

export function AssignmentSessionRoute() {
	const { assignmentId } = useParams<{ assignmentId: string }>();
	const assignment = useAssignment(assignmentId);

	const problemGenerator = useMemo(() => {
		if (!assignment) return null;
		return createAssignmentProblemGenerator(assignment);
	}, [assignment]);

	if (!assignment) {
		return <ErrorPage message="Това домашно не е намерено!" />;
	}
	if (!problemGenerator) {
		return <ErrorPage message="Това домашно е невалидно в базата данни!" />;
	}

	return (
		<GameSessionPage
			problemGenerator={problemGenerator}
			assignmentId={assignment.id}
		/>
	);
}
