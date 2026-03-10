import { type AssignmentData, type AssignmentDoc, assignmentConverter } from "@/logic/assignments";
import { db } from "@/logic/firebase";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

export function useAssignments(): {
	assignments: AssignmentDoc[];
	isLoading: boolean;
	reload: () => Promise<void>;
} {
	const [assignments, setAssignments] = useState<AssignmentDoc[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const reload = useCallback(async () => {
		setIsLoading(true);
		const assignmentsRef = collection(db, "assignments").withConverter(
			assignmentConverter,
		);
		const snapshot = await getDocs(assignmentsRef);
		const nextAssignments = snapshot.docs
			.map((snap) => ({ id: snap.id, data: snap.data() }))
			.sort((a, b) => a.data.index - b.data.index);
		setAssignments(nextAssignments);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	return { assignments, isLoading, reload };
}

export async function getAssignmentById(id: string): Promise<AssignmentDoc | null> {
	const assignmentRef = doc(db, "assignments", id).withConverter(
		assignmentConverter,
	);
	const snapshot = await getDoc(assignmentRef);
	if (!snapshot.exists()) return null;
	return { id: snapshot.id, data: snapshot.data() };
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
