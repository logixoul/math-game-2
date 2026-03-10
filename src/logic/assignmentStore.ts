import { type AssignmentData, type AssignmentDoc, assignmentConverter } from "@/logic/assignments";
import { db } from "@/logic/firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useAssignments(): AssignmentDoc[] {
	const [assignments, setAssignments] = useState<AssignmentDoc[]>([]);

	useEffect(() => {
		const assignmentsRef = collection(db, "assignments").withConverter(
			assignmentConverter,
		);
		const unsubscribe = onSnapshot(assignmentsRef, (snapshot) => {
			const nextAssignments = snapshot.docs
				.map((snap) => ({ id: snap.id, data: snap.data() }))
				.sort((a, b) => a.data.index - b.data.index);
			setAssignments(nextAssignments);
		});

		return () => unsubscribe();
	}, []);

	return assignments;
}

export function useAssignment(assignmentId: string | null | undefined): AssignmentDoc | null {
	const [assignment, setAssignment] = useState<AssignmentDoc | null>(null);

	useEffect(() => {
		if (!assignmentId) {
			setAssignment(null);
			return;
		}

		const assignmentRef = doc(db, "assignments", assignmentId).withConverter(
			assignmentConverter,
		);
		const unsubscribe = onSnapshot(assignmentRef, (snapshot) => {
			if (!snapshot.exists()) {
				setAssignment(null);
				return;
			}
			setAssignment({ id: snapshot.id, data: snapshot.data() });
		});

		return () => unsubscribe();
	}, [assignmentId]);

	return assignment;
}

export async function createAssignment(data: Partial<AssignmentData>): Promise<string> {
	const docRef = await addDoc(collection(db, "assignments"), {
		name: data.name ?? "",
		spec: data.spec ?? [],
		category: data.category ?? "Домашни",
		index: data.index ?? 0,
	});
	return docRef.id;
}

export async function updateAssignmentById(
	id: string,
	data: Partial<AssignmentData>,
): Promise<void> {
	const assignmentRef = doc(db, "assignments", id);
	await updateDoc(assignmentRef, data);
}

export async function deleteAssignmentById(id: string): Promise<void> {
	await deleteDoc(doc(db, "assignments", id));
}
