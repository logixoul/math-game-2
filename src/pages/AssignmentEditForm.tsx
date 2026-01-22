import { AssignmentRecord, db } from "@/logic/FirebaseController";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import styles from "./AssignmentsAdminPage.module.css";

type AssignmentEditFormProps = {
    assignment: AssignmentRecord;
};

export function AssignmentEditForm(props: AssignmentEditFormProps) {
    const { assignment } = props;

    const handleSave = async (formData: FormData) => {
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const category = formData.get("category") as string;
        const index = formData.get("index") as string;
        const spec = formData.get("spec") as string;
        const assignmentRef = doc(db, "assignments", id);
        await updateDoc(assignmentRef, {
            name: name,
            category: category,
            spec: spec,
            index: Number(index),
        });
    };

    const handleDeleteById = async (id: string) => {
        await deleteDoc(doc(db, "assignments", id));
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSave(new FormData(e.currentTarget));
            }}
        >

            <input type="hidden" name="id" value={assignment.id} />
            <label htmlFor="name">Name:</label>
            <input type="text" name="name" defaultValue={assignment.name} placeholder="Name" />
            <label htmlFor="category">Category:</label>
            <input type="text" name="category" defaultValue={assignment.category} placeholder="Category" />
            <label htmlFor="index">Index:</label>
            <input type="text" name="index" defaultValue={assignment.index} placeholder="Index" />
            <br />
            <label htmlFor="spec">Spec (JSON):</label>
            <textarea name="spec" className={styles.textarea} rows={10} cols={50} defaultValue={assignment.spec} />
            <button type="submit">Save</button>
            <button type="button" onClick={() => handleDeleteById(assignment.id)}>
                Delete
            </button>
        </form>
    );
}