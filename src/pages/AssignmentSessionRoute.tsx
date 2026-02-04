import {
	AssignmentRecord,
	createAssignmentProblemGenerator,
	parseAssignmentProblemGenerators,
} from "@/logic/assignments";
import { db } from "@/logic/FirebaseController";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorPage } from "./ErrorPage";
import { GameSessionPage } from "./GameSessionPage";

export function AssignmentSessionRoute() {
	const { assignmentId } = useParams<{ assignmentId: string }>();
	const [assignment, setAssignment] = useState<AssignmentRecord | null>(null);

	useEffect(() => {
		if (!assignmentId) return;

		const assignmentRef = doc(db, "assignments", assignmentId);
		const unsubscribe = onSnapshot(assignmentRef, (snap) => {
			if (!snap.exists()) {
				setAssignment(null);
				return;
			}
			setAssignment({ id: snap.id, ...snap.data() } as AssignmentRecord);
		});

		return () => unsubscribe();
	}, [assignmentId]);

	const parsed = useMemo(() => {
		if (!assignment) return null;
		return parseAssignmentProblemGenerators(assignment.spec);
	}, [assignment]);

	const errorMessage = useMemo(() => {
		if (!assignment || !parsed?.error) return "";
		return `Error parsing assignment spec: ${parsed.error}`;
	}, [assignment, parsed]);

	const problemGenerator = useMemo(() => {
		if (!assignment || !parsed || parsed.error) return null;
		return createAssignmentProblemGenerator(assignment.id, parsed.specs);
	}, [assignment, parsed]);

	if (!assignment || !problemGenerator) {
		return <ErrorPage message={errorMessage} />;
	}

	return (
		<GameSessionPage
			problemGenerator={problemGenerator}
			assignmentId={assignment.id}
		/>
	);
}
