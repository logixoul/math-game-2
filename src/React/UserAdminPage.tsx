import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AssignmentRecord, firebaseController, useFirebaseSnapshot } from "../FirebaseController";
import { parseAssignmentGameTypes } from "../GameTypes";
import styles from "./UserAdminPage.module.css";
import { ErrorPage } from "./ErrorPage";

export function UserAdminPage() {
    const { uid } = useParams<{ uid: string }>();
    const snapshot = useFirebaseSnapshot();
    const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
    const isAdmin = Boolean(snapshot.user && firebaseController.isCurrentUserAdmin());

    useEffect(() => {
        if (!uid || !isAdmin) return;
        const unsubscribe = firebaseController.onAssignmentsChanged(uid, setAssignments);
        return () => unsubscribe();
    }, [uid, isAdmin]);

    if (!isAdmin) {
        return <ErrorPage />;
    }

    const handleCreate = async () => {
        if (!uid) return;
        await firebaseController.createAssignment(uid, {
            name: "New assignment",
            dueText: "",
            isActive: true,
            version: 1,
            gameTypesJson: "[]",
        });
    };

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div>
                    <Link className={styles.backLink} to="/admin">Back to users</Link>
                    <h2>User assignments</h2>
                    <div className={styles.userId}>UID: {uid}</div>
                </div>
                <button className={styles.primaryButton} onClick={handleCreate}>Create assignment</button>
            </div>

            <div className={styles.assignmentsList}>
                {assignments.map((assignment) => (
                    <AssignmentEditor
                        key={assignment.id}
                        uid={uid!}
                        assignment={assignment}
                    />
                ))}
            </div>
        </div>
    );
}

type AssignmentEditorProps = {
    uid: string;
    assignment: AssignmentRecord;
};

function AssignmentEditor({ uid, assignment }: AssignmentEditorProps) {
    const [draft, setDraft] = useState<AssignmentRecord>(assignment);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isDirty) {
            setDraft(assignment);
        }
    }, [assignment, isDirty]);

    const parseResult = useMemo(() => {
        return parseAssignmentGameTypes(draft.gameTypesJson);
    }, [draft.gameTypesJson]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await firebaseController.updateAssignment(uid, assignment.id, {
                name: draft.name,
                dueText: draft.dueText,
                isActive: draft.isActive,
                version: draft.version,
                gameTypesJson: draft.gameTypesJson,
            });
            setIsDirty(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        const ok = window.confirm(`Delete assignment "${assignment.name}"?`);
        if (!ok) return;
        await firebaseController.deleteAssignment(uid, assignment.id);
    };

    return (
        <section className={styles.assignmentCard}>
            <div className={styles.assignmentHeader}>
                <input
                    className={styles.nameInput}
                    value={draft.name}
                    onChange={(event) => {
                        setDraft({ ...draft, name: event.target.value });
                        setIsDirty(true);
                    }}
                />
                <div className={styles.assignmentActions}>
                    <Link
                        className={styles.secondaryButton}
                        to={`/admin/users/${uid}/assignments/${assignment.id}/attempts`}
                    >
                        Attempts
                    </Link>
                    <button className={styles.secondaryButton} onClick={handleSave} disabled={isSaving}>
                        Save
                    </button>
                    <button className={styles.dangerButton} onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            </div>

            <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Due date (text)</label>
                <input
                    className={styles.textInput}
                    value={draft.dueText}
                    onChange={(event) => {
                        setDraft({ ...draft, dueText: event.target.value });
                        setIsDirty(true);
                    }}
                />
            </div>

            <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Version</label>
                <input
                    className={styles.textInput}
                    type="number"
                    value={draft.version}
                    onChange={(event) => {
                        setDraft({ ...draft, version: Number(event.target.value) });
                        setIsDirty(true);
                    }}
                />
            </div>

            <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Active</label>
                <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) => {
                        setDraft({ ...draft, isActive: event.target.checked });
                        setIsDirty(true);
                    }}
                />
            </div>

            <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Game types JSON</label>
                <textarea
                    className={styles.textArea}
                    value={draft.gameTypesJson}
                    onChange={(event) => {
                        setDraft({ ...draft, gameTypesJson: event.target.value });
                        setIsDirty(true);
                    }}
                    rows={8}
                />
                {parseResult.error && (
                    <div className={styles.parseError}>{parseResult.error}</div>
                )}
            </div>
        </section>
    );
}
