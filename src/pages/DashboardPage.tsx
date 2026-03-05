import { AssignmentDoc, assignmentConverter } from "@/logic/assignments";
import { auth, db, firebaseController } from "@/logic/FirebaseController";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
	const navigate = useNavigate();

	const [assignments, setAssignments] = useState<AssignmentDoc[]>([]);
	const [isAdmin, setIsAdmin] = useState(false);

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
		const unsubscribe = auth.onAuthStateChanged((user) => {
			setIsAdmin(firebaseController.isAdmin());
		});
		return () => unsubscribe();
	}, []);

	const createSection = (category: string, title: string) => {
		const theseAssignments = assignments.filter(
			(a) => a.data.category === category,
		);
		return (
			<section className={styles.section}>
				<h3>{title}</h3>
				<ul className={styles.gameList}>
					{theseAssignments?.map((a) => (
						<li key={a.id}>
							<Link to={`/assignment/${a.id}`} className={styles.gameCard}>
								{a.data.name}
							</Link>
						</li>
					))}
				</ul>
			</section>
		);
	};

	return (
		<div className="scrollablePage">
			<div className={styles.dashboardContainer}>
				<h2>Привет!</h2>
				<p className={styles.subtitle}>Готов ли си?</p>
				{isAdmin && (
					<button type="button" onClick={() => navigate("/admin/assignments/")}>
						Edit assignments (admin)
					</button>
				)}
				<div className={styles.sectionsContainer}>
					{createSection("5кл", "Тренировка 5кл.")}
					{createSection("6кл", "Тренировка 6кл.")}
					{createSection("Домашни", "Домашни")}
				</div>
			</div>
		</div>
	);
}
