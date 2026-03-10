import { useAssignments } from "@/logic/assignmentStore";
import { Link } from "react-router-dom";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
	const assignments = useAssignments();
	const createSection = (category: string, title: string) => {
		const theseAssignments = assignments.filter(
			(a) => a.data.category === category,
		);
		return (
			<section className={styles.section}>
				<h3>{title}</h3>
				<ul className={styles.gameList}>
					{theseAssignments?.map((a) => (
						<li key={a.id} className={styles.gameCard}>
							<Link to={`/assignment/${a.id}`}>
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
				<div className={styles.sectionsContainer}>
					{createSection("5кл", "Тренировка 5кл.")}
					{createSection("6кл", "Тренировка 6кл.")}
					{createSection("Домашни", "Домашни")}
				</div>
			</div>
		</div>
	);
}
