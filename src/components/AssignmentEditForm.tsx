import {
	createAssignment,
	deleteAssignmentById,
	updateAssignmentById,
} from "@/logic/assignmentStore";
import { AssignmentDoc, assignmentObjectToJson } from "@/logic/assignments";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AssignmentEditForm.module.css";

type AssignmentEditFormProps = {
	assignment: AssignmentDoc;
	isCollapsedInitially: boolean;
	onCloned?: (newAssignmentId: string) => void;
};

export function AssignmentEditForm(props: AssignmentEditFormProps) {
	const { assignment, isCollapsedInitially, onCloned } = props;
	const [isCollapsed, setIsCollapsed] = useState(isCollapsedInitially);
	const specJsonFromDb = useMemo(
		() => assignmentObjectToJson(assignment.data.spec),
		[assignment.data.spec],
	);

	const formRef = useRef<HTMLFormElement | null>(null);

	useEffect(() => {
		if (!isCollapsed) {
			scrollIntoViewIfNeeded(formRef.current!);
		}
	}, [isCollapsed]);

	const scrollIntoViewIfNeeded = (target: HTMLElement) => {
		// Target is outside the viewport from the bottom
		if (target.getBoundingClientRect().bottom > window.innerHeight) {
			//  The bottom of the target will be aligned to the bottom of the visible area of the scrollable ancestor.
			target.scrollIntoView({
				block: "end",
				inline: "nearest",
				behavior: "smooth",
			});
		}

		// Target is outside the view from the top
		if (target.getBoundingClientRect().top < 0) {
			// The top of the target will be aligned to the top of the visible area of the scrollable ancestor
			target.scrollIntoView({
				block: "start",
				inline: "nearest",
				behavior: "smooth",
			});
		}
	};

	const handleSave = async (formData: FormData) => {
		setIsCollapsed(true);

		const id = formData.get("id") as string;
		const name = formData.get("name") as string;
		const category = formData.get("category") as string;
		const index = Number.parseInt(formData.get("index") as string, 10);
		const pointsRequiredToWin = Number.parseInt(
			formData.get("pointsRequiredToWin") as string,
			10,
		);
		const spec = formData.get("spec") as string;

		try {
			JSON.parse(spec);
		} catch (e) {
			alert(`Invalid JSON syntax. Error message: ${(e as Error).message}`);
			return;
		}

		await updateAssignmentById(id, {
			name: name,
			category: category,
			spec: spec,
			index: index,
			pointsRequiredToWin: pointsRequiredToWin,
		});
	};

	const handleDeleteById = async (id: string) => {
		setIsCollapsed(true);
		await deleteAssignmentById(id);
	};

	const handleClone = async (assignment: AssignmentDoc) => {
		const newAssignment = {
			name: "",
			spec: assignment.data.spec,
			category: assignment.data.category,
			index: assignment.data.index + 100,
			pointsRequiredToWin: assignment.data.pointsRequiredToWin,
		};

		await createAssignment(newAssignment);
	};

	return (
		<div className={styles.collapsedAssignment}>
			<button
				type="button"
				className={styles.expandButton}
				onClick={() => setIsCollapsed(!isCollapsed)}
			>
				{isCollapsed ? "+" : "-"}
			</button>
			{isCollapsed ? (
				<>
					{assignment.data.name}
					<span className={styles.extraData}>
						{" "}
						(Index = {assignment.data.index}; Category ={" "}
						{assignment.data.category})
					</span>
				</>
			) : (
				<form
					ref={formRef}
					onSubmit={(e) => {
						e.preventDefault();
						handleSave(new FormData(e.currentTarget));
					}}
				>
					<input type="hidden" name="id" value={assignment.id} />
					<label htmlFor="name">Name:</label>
					<input
						type="text"
						name="name"
						defaultValue={assignment.data.name}
						placeholder="Name"
					/>
					<label htmlFor="category">Category:</label>
					<input
						type="text"
						name="category"
						defaultValue={assignment.data.category}
						placeholder="Category"
					/>
					<label htmlFor="index">Index:</label>
					<input
						type="text"
						name="index"
						defaultValue={assignment.data.index}
						placeholder="Index"
					/>
					<label htmlFor="pointsRequiredToWin">Points to win:</label>
					<input
						type="text"
						name="pointsRequiredToWin"
						defaultValue={assignment.data.pointsRequiredToWin}
						placeholder="Points required to win"
					/>
					<br />
					<label htmlFor="spec">Spec (JSON):</label>
					<textarea
						name="spec"
						className={styles.textarea}
						rows={10}
						cols={50}
						defaultValue={specJsonFromDb}
					/>
					<button className={styles.formButton} type="submit">
						Save
					</button>
					<button
						className={styles.formButton}
						type="button"
						onClick={() => handleDeleteById(assignment.id)}
					>
						Delete
					</button>
				</form>
			)}
			<button
				type="button"
				className={styles.formButton}
				onClick={() => handleClone(assignment)}
			>
				Clone
			</button>
		</div>
	);
}
