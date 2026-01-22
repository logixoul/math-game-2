import { useState, useEffect, useRef } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot } from "firebase/firestore";
import { AssignmentRecord, db } from "@/logic/FirebaseController";
import styles from "./AssignmentsAdminPage.module.css";

type AssignmentsAdminPageProps = {

};

export function AssignmentsAdminPage(props: AssignmentsAdminPageProps) {
    const [data, setData] = useState<AssignmentRecord[]>([]);

    useEffect(() => {
        const assignmentsRef = collection(db, "assignments");
        const unsubscribe = onSnapshot(assignmentsRef, (snapshot) => {
            const assignments = snapshot.docs.map((doc) => ({
                id: doc.id, ...doc.data()
            } as AssignmentRecord));
            setData(assignments);
        });
        return () => unsubscribe();
    }, []);

    const handleCreate = async () => {
        await addDoc(collection(db, "assignments"), {
            name: "", spec: "[]",
        });
    };

    const handleSave = async (formData : FormData) => {
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const spec = formData.get("spec") as string;
        const assignmentRef = doc(db, "assignments", id);
        await updateDoc(assignmentRef, {
            name: name,
            spec: spec
        });
    };

    const handleDeleteById = async (id: string) => {
        await deleteDoc(doc(db, "assignments", id));
    };

    return (
        <div>
            <h2>Assignments</h2>
            <button onClick={handleCreate}>Add</button>

            <ul>
                {data.map((assignment) =>
                    <li key={assignment.id}>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSave(new FormData(e.currentTarget));
                            }}
                            >

                            <input type="hidden" name="id" value={assignment.id} />
                            <input
                                type="text"
                                name="name"
                                defaultValue={assignment.name}
                                placeholder="Enter name"
                            />
                            <br />
                            <textarea name="spec" className={styles.textarea} rows={10} cols={50} defaultValue={ assignment.spec } />
                            <button type="submit">Save</button>
                            <button type="button" onClick={() => handleDeleteById(assignment.id)}>
                                Delete
                            </button>
                        </form>
                    </li>
                )}
            </ul>
        </div>
    );
}