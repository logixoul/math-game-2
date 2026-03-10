import { AssignmentEditForm } from "@/components/AssignmentEditForm";
import { createAssignment, useAssignments } from "@/logic/assignmentStore";
import { isAdminUser, useAuthUser } from "@/logic/auth";
import { useEffect, useRef, useState } from "react";
import styles from "./AssignmentsAdminPage.module.css";

export function AssignmentsAdminPage() {
	const user = useAuthUser();
	const { assignments, isLoading, reload } = useAssignments();
	const bottomRef = useRef<HTMLDivElement | null>(null);
	const [latestAddedId, setLatestAddedId] = useState<string | null>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [latestAddedId]);
	const handleCreate = async () => {
		const maxIndex = assignments.reduce(
			(max, a) => Math.max(max, a.data.index),
			0,
		);
		const newAssignmentId = await createAssignment({
			name: "",
			spec: [],
			category: "Домашни",
			index: maxIndex + 100,
		});
		await reload();
		setLatestAddedId(newAssignmentId);
	};

	if (!isAdminUser(user)) {
		return <div>Тази страница е само за администратори.</div>;
	}

	return (
		<div className="scrollablePage">
			<h2>Assignments</h2>
			<button type="button" onClick={handleCreate} disabled={isLoading}>
				Add
			</button>

			{isLoading ? (
				<div>Зареждане...</div>
			) : (
				<ul className={styles.list}>
					{assignments.map((assignment) => (
						<li key={assignment.id}>
							<AssignmentEditForm
								assignment={assignment}
								isCollapsedInitially={latestAddedId !== assignment.id}
							/>
						</li>
					))}
				</ul>
			)}
			<div ref={bottomRef} />
		</div>
	);
}
