import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { firebaseController, UserSummary, useFirebaseSnapshot } from "../FirebaseController";
import styles from "./AdminDashboardPage.module.css";
import { ErrorPage } from "./ErrorPage";

export function AdminDashboardPage() {
    const snapshot = useFirebaseSnapshot();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserSummary[]>([]);
    const isAdmin = Boolean(snapshot.user && firebaseController.isCurrentUserAdmin());

    useEffect(() => {
        if (!isAdmin) return;
        const unsubscribe = firebaseController.onUsersChanged((nextUsers) => {
            setUsers(nextUsers);
        });
        return () => unsubscribe();
    }, [isAdmin]);

    if (!isAdmin) {
        return <ErrorPage />;
    }

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            const aLabel = (a.displayName || a.email || a.uid).toLowerCase();
            const bLabel = (b.displayName || b.email || b.uid).toLowerCase();
            return aLabel.localeCompare(bLabel);
        });
    }, [users]);

    return (
        <div className={styles.page}>
            <h2>Admin dashboard</h2>
            <section className={styles.section}>
                <h3>Users</h3>
                <ul className={styles.userList}>
                    {sortedUsers.map((user) => {
                        const label = user.displayName || user.email || user.uid;
                        return (
                            <li
                                key={user.uid}
                                className={styles.userItem}
                                onClick={() => navigate(`/admin/users/${user.uid}`)}
                            >
                                <div className={styles.userLabel}>{label}</div>
                                <div className={styles.userMeta}>{user.email ?? ""}</div>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}
