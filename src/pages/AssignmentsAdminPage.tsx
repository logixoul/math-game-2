import { useState, useEffect, useRef } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot } from "firebase/firestore";
import { AssignmentRecord, db } from "@/logic/FirebaseController";
import styles from "./AssignmentsAdminPage.module.css";
import { AssignmentEditForm } from "./AssignmentEditForm";

type AssignmentsAdminPageProps = {

};

export function AssignmentsAdminPage(props: AssignmentsAdminPageProps) {
    const [data, setData] = useState<AssignmentRecord[]>([]);

    useEffect(() => {
        const assignmentsRef = collection(db, "assignments");
        const unsubscribe = onSnapshot(assignmentsRef, (snapshot) => {
            let assignments = snapshot.docs.map((doc) => ({
                id: doc.id, ...doc.data()
            } as AssignmentRecord));
            assignments = assignments.sort((a, b) => a.index - b.index);
            setData(assignments);
        });
        return () => unsubscribe();
    }, []);

    const handleCreate = async () => {
        await addDoc(collection(db, "assignments"), {
            name: "", spec: "[]",
        });
    };

    return (
        <div>
            <h2>Assignments</h2>
            <button onClick={handleCreate}>Add</button>

            <ul className={styles.list}>
                {data.map((assignment) =>
                    <li key={assignment.id}>
                        <AssignmentEditForm assignment={assignment} />
                    </li>
                )}
            </ul>
        </div>
    );
}
