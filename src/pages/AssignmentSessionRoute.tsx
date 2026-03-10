import {
	type AssignmentDoc,
	assignmentConverter,
	createAssignmentProblemGenerator,
} from "@/logic/assignments";
import { db } from "@/logic/FirebaseController";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorPage } from "./ErrorPage";
import { GameSessionPage } from "./GameSessionPage";

export function AssignmentSessionRoute() {
	const { assignmentId } = useParams<{ assignmentId: string }>();
	const [assignment, setAssignment] = useState<AssignmentDoc | null>(null);

	useEffect(() => {
		if (!assignmentId) return;

		const assignmentRef = doc(db, "assignments", assignmentId).withConverter(
			assignmentConverter,
		);
		const unsubscribe = onSnapshot(assignmentRef, (snap) => {
			if (!snap.exists()) {
				setAssignment(null);
				return;
			}
			setAssignment({ id: snap.id, data: snap.data() } as AssignmentDoc);
		});

		return () => unsubscribe();
	}, [assignmentId]);

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
