import { AssignmentRecord, db } from "@/logic/FirebaseController";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import styles from "./AssignmentEditForm.module.css";
import { useState } from "react";
import { set } from "bignumber.js";

type AssignmentEditFormProps = {
    assignment: AssignmentRecord;
};

export function AssignmentEditForm(props: AssignmentEditFormProps) {
    const { assignment } = props;

    const [ collapsed, setCollapsed ] = useState(true);

    const handleSave = async (formData: FormData) => {
        setCollapsed(true);

        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const category = formData.get("category") as string;
        const index = Number.parseInt(formData.get("index") as string);
        const spec = formData.get("spec") as string;
        const assignmentRef = doc(db, "assignments", id);
        await updateDoc(assignmentRef, {
            name: name,
            category: category,
            spec: spec,
            index: index,
        });
    };

    const handleDeleteById = async (id: string) => {
        setCollapsed(true);
        await deleteDoc(doc(db, "assignments", id));
    };

    return (
        <>
        <div className={styles.collapsedAssignment}>
            <span>{assignment.name}</span>
            <button onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? "+" : "-"}
            </button>
        </div>
        {!collapsed && (
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
        )}
        </>
    );
}