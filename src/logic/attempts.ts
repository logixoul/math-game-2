import { db } from "@/logic/firebase";
import type { ResultStats } from "@/logic/ResultStats";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function recordAttempt(
	userUid: string,
	assignmentId: string | null | undefined,
	resultStats: ResultStats,
	completionReason: "win" | "timeout",
): Promise<void> {
	const attemptsRef = collection(db, "users", userUid, "attempts");
	await addDoc(attemptsRef, {
		resultStats,
		completionReason,
		assignmentId: assignmentId ?? null,
		attemptType: assignmentId ? "assignment" : "free_practice",
		createdAt: serverTimestamp(),
	});
}
