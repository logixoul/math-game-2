import { AssignmentRecord, db } from "@/logic/FirebaseController";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import styles from "./AssignmentEditForm.module.css";
import { useEffect, useRef, useState } from "react";
import { set } from "bignumber.js";

type AssignmentEditFormProps = {
    assignment: AssignmentRecord;
    isCollapsedInitially: boolean;
    onCloned?: (newAssignmentId: string) => void;
};

export function AssignmentEditForm(props: AssignmentEditFormProps) {
    const { assignment, isCollapsedInitially, onCloned } = props;
    const [ isCollapsed, setIsCollapsed ] = useState(isCollapsedInitially);

    const formRef = useRef<HTMLFormElement | null>(null);
    
    useEffect(() => {
        if(!isCollapsed) {
            scrollIntoViewIfNeeded(formRef.current!);
        }
    }, [isCollapsed]);

    const scrollIntoViewIfNeeded = (target : HTMLElement) => {
        // Target is outside the viewport from the bottom
        if (target.getBoundingClientRect().bottom > window.innerHeight) {
            //  The bottom of the target will be aligned to the bottom of the visible area of the scrollable ancestor.
            target.scrollIntoView({ block: "end", inline: "nearest", behavior: "smooth" });
        }

        // Target is outside the view from the top
        if (target.getBoundingClientRect().top < 0) {
            // The top of the target will be aligned to the top of the visible area of the scrollable ancestor
            target.scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });
        }
    };

    const handleSave = async (formData: FormData) => {
        setIsCollapsed(true);

        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const category = formData.get("category") as string;
        const index = Number.parseInt(formData.get("index") as string);
        const spec = formData.get("spec") as string;
        const assignmentRef = doc(db, "assignments", id);

        try {
            JSON.parse(spec);
        } catch (e) {
            alert("Invalid JSON syntax. Error message: " + (e as Error).message);
            return;
        }

        await updateDoc(assignmentRef, {
            name: name,
            category: category,
            spec: spec,
            index: index,
        });
    };

    const handleDeleteById = async (id: string) => {
        setIsCollapsed(true);
        await deleteDoc(doc(db, "assignments", id));
    };

    const handleClone = async (assignment: AssignmentRecord) => {
        const newAssignment = {
            name: "",
            spec: assignment.spec,
            category: assignment.category,
            index: assignment.index + 100,
        };

        await addDoc(collection(db, "assignments"), newAssignment);
    };

    return (
        <div className={styles.collapsedAssignment}>
            <button className={styles.expandButton} onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? "+" : "-"}
            </button>
            {isCollapsed?(
                <>
                    {assignment.name} 
                    <span className={styles.extraData}> (Index = {assignment.index}; Category = {assignment.category})</span>
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
                    <input type="text" name="name" defaultValue={assignment.name} placeholder="Name" />
                    <label htmlFor="category">Category:</label>
                    <input type="text" name="category" defaultValue={assignment.category} placeholder="Category" />
                    <label htmlFor="index">Index:</label>
                    <input type="text" name="index" defaultValue={assignment.index} placeholder="Index" />
                    <br />
                    <label htmlFor="spec">Spec (JSON):</label>
                    <textarea name="spec" className={styles.textarea} rows={10} cols={50} defaultValue={assignment.spec} />
                    <button className={styles.formButton} type="submit">Save</button>
                    <button className={styles.formButton} type="button" onClick={() => handleDeleteById(assignment.id)}>
                        Delete
                    </button>
                </form>
            )}
            <button className={styles.formButton} onClick={() => handleClone(assignment)}>
                Clone
            </button>
        </div>
    );
}