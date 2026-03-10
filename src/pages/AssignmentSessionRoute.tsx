import {
	createAssignmentProblemGenerator,
	type AssignmentDoc,
} from "@/logic/assignments";
import { getAssignmentById } from "@/logic/assignmentStore";
import {
	isRouteErrorResponse,
	useLoaderData,
	useRouteError,
	type LoaderFunctionArgs,
} from "react-router-dom";
import { ErrorPage } from "./ErrorPage";
import { GameSessionPage } from "./GameSessionPage";

export async function assignmentSessionLoader({
	params,
}: LoaderFunctionArgs): Promise<AssignmentDoc> {
	const assignmentId = params.assignmentId;
	if (!assignmentId) {
		throw new Error("Липсва ID на домашното.");
	}

	const assignment = await getAssignmentById(assignmentId);
	if (!assignment) {
		throw new Error("Това домашно не е намерено!");
	}

	return assignment;
}

export function AssignmentSessionRoute() {
	const assignment = useLoaderData() as AssignmentDoc;
	const problemGenerator = createAssignmentProblemGenerator(assignment);
	if (!problemGenerator) {
		throw new Error("Това домашно е невалидно в базата данни!");
	}

	return (
		<GameSessionPage
			problemGenerator={problemGenerator}
			assignmentId={assignment.id}
		/>
	);
}

export function AssignmentSessionRouteErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		return <ErrorPage message={error.statusText || `HTTP ${error.status}`} />;
	}

	const message = error instanceof Error ? error.message : "Нещо се обърка.";
	return <ErrorPage message={message} />;
}
