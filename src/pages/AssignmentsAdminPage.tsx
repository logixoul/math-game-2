import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { AssignmentRecord, db } from "@/logic/FirebaseController";
import styles from "./AssignmentsAdminPage.module.css";

type AssignmentsAdminPageProps = {
    
};

export function AssignmentsAdminPage(props: AssignmentsAdminPageProps) {
    const [data, setData] = useState<AssignmentRecord[]>([]);
    const [name, setName] = useState("");

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        const querySnapshot = await getDocs(collection(db, "assignments"));
        setData(querySnapshot.docs.map(doc => ({
            id: doc.id, ...doc.data()
        } as AssignmentRecord)));
    };

    const handleCreate = async () => {
        await addDoc(collection(db, "assignments"), { name });
        setName("");
        fetchAssignments();
    };

    const handleSave = async (id : string) => {
        const assignmentRef = doc(db, "assignments", id);
        await updateDoc(assignmentRef, { name });
        fetchAssignments();
    };

    const handleDelete = async (id: string) => {
        await deleteDoc(doc(db, "assignments", id));
        fetchAssignments();
    };

    return (
        <div>
            <h2>Assignments</h2>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
            />
            <button onClick={handleCreate}>Add</button>

            <ul>
                {data.map((assignment) => (
                    <li key={assignment.id}>
                        <input
                            type="text"
                            value={assignment.name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name"
                        />
                        <br/>
                        <textarea className={styles.textarea} rows={10} cols={50}>
                            {assignment.spec}
                        </textarea>
                        <button onClick={() => handleSave(assignment.id)}>Save</button>
                        <button onClick={() => handleDelete(assignment.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}