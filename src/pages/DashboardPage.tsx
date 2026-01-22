import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DashboardPage.module.css";
import { AssignmentRecord, db, useFirebaseSnapshot } from "@/logic/FirebaseController";
import { collection, onSnapshot } from "firebase/firestore";

export function DashboardPage() {
	const navigate = useNavigate();
	
	const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);

	useEffect(() => {
		const assignmentsRef = collection(db, "assignments");
		const unsubscribe = onSnapshot(assignmentsRef, (snapshot) => {
			const assignments = snapshot.docs.map((doc) => ({
				id: doc.id, ...doc.data()
			} as AssignmentRecord))

			setAssignments(assignments);
		});
		return () => unsubscribe();
	}, []);

	const createSection = (category: string, title: string) => {
		const theseAssignments = assignments.filter(a => a.category === category);
		return (
			<section className={styles.section}>
				<h3>{title}</h3>
				<ul className={styles.gameList}>
					{
						theseAssignments?.map(a =>
						<li key={a.id} className={styles.gameCard} onClick={() =>
								navigate(`/assignment/${a.id}`)
							}>{a.name}
						</li>
						)
					}
				</ul>
			</section>
		);
	};

	return (
		<div className={styles.dashboardContainer}>
			<h2>Привет!</h2>
			<p className={styles.subtitle}>Готов ли си?</p>
			{createSection("5кл", "Тренировка 5кл.")}
			{createSection("6кл", "Тренировка 6кл.")}
		</div>
	);
}
