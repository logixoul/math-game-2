import { AssignmentEditForm } from "@/components/AssignmentEditForm";
import { type AssignmentDoc, assignmentConverter } from "@/logic/assignments";
import { db, firebaseController } from "@/logic/FirebaseController";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import styles from "./AssignmentsAdminPage.module.css";

export function AssignmentsAdminPage() {
	const [assignments, setAssignments] = useState<AssignmentDoc[]>([]);
	const bottomRef = useRef<HTMLDivElement | null>(null);
	const [latestAddedId, setLatestAddedId] = useState<string | null>(null);

	useEffect(() => {
		const assignmentsRef = collection(db, "assignments").withConverter(
			assignmentConverter,
		);
		const unsubscribe = onSnapshot(assignmentsRef, (snapshot) => {
			const assignments = snapshot.docs
				.map((doc) => ({ id: doc.id, data: doc.data() }))
				.sort((a, b) => a.data.index - b.data.index);
			setAssignments(assignments);
		});
		return () => unsubscribe();
	}, []);
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [latestAddedId]);
	const handleCreate = async () => {
		const maxIndex = assignments.reduce(
			(max, a) => Math.max(max, a.data.index),
			0,
		);
		const docRef = await addDoc(collection(db, "assignments"), {
			name: "",
			spec: "[]",
			category: "Домашни",
			index: maxIndex + 100,
		});
		setLatestAddedId(docRef.id);
	};

	if (!firebaseController.isAdmin()) {
		return <div>Тази страница е само за администратори.</div>;
	}

	return (
		<div className="scrollablePage">
			<h2>Assignments</h2>
			<button type="button" onClick={handleCreate}>
				Add
			</button>

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
			<div ref={bottomRef} />
		</div>
	);
}
