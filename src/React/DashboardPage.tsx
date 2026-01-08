import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "./TopBar";
import styles from "./DashboardPage.module.css";
import * as GameTypes from "../GameTypes";
import { AssignmentRecord, firebaseController, useFirebaseSnapshot } from "../FirebaseController";

export function DashboardPage() {
	const navigate = useNavigate();
	const gameTypes = useMemo(() => GameTypes.getAvailableGameTypes(), []);
	const firebaseState = useFirebaseSnapshot();
	const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
	const formatDate = (value?: Date | null) => {
		if (!value) return "unknown date";
		return value.toLocaleDateString("bg-BG");
	};

	useEffect(() => {
		if (!firebaseState.user) {
			setAssignments([]);
			return;
		}
		const unsubscribe = firebaseController.onAssignmentsChanged(firebaseState.user.uid, setAssignments);
		return () => unsubscribe();
	}, [firebaseState.user]);

	const createSection = (title:string, gameTypesSingleCategory : GameTypes.GameType[]) =>
		<section className={styles.section}>
			<h3>{title}</h3>
			<ul className={styles.gameList}>
				{gameTypesSingleCategory.map((gameType) => (
					<li key={gameType.persistencyKey} className={styles.gameCard} onClick={() =>
								navigate(`/game/${encodeURIComponent(gameType.persistencyKey)}`)
							}>{gameType.uiLabel}
					</li>
				))}
			</ul>
		</section>
	;

	return (
		<div className={styles.dashboardContainer}>
			<h2>Привет!</h2>
			<p className={styles.subtitle}>Готов ли си?</p>
			<section className={styles.section}>
				<h3>За домашно за теб</h3>
				<ul className={styles.gameList}>
					{assignments.filter((assignment) => assignment.isActive).map((assignment) => (
						<li
							key={assignment.id}
							className={styles.gameCard}
							onClick={() => navigate("/assignment/" + assignment.id)}
						>
							<div>
								<b>{assignment.name.trim() ? assignment.name : "<без име>"}</b><br></br> (от {formatDate(assignment.createdAt?.toDate?.())})
							</div>
							{assignment.dueText && <div className={styles.assignmentDue}>{assignment.dueText}</div>}
						</li>
					))}
					{assignments.filter((assignment) => assignment.isActive).length === 0 && (
						<li className={styles.gameCard}>No active assignments.</li>
					)}
				</ul>
			</section>
			{createSection("Тренировка 5кл.", gameTypes.fifthGrade)}
			{createSection("Тренировка 6кл.", gameTypes.sixthGrade)}
		</div>
	);
}
