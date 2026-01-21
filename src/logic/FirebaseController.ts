import { useSyncExternalStore } from "react";
import * as FirebaseApp from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import * as Firestore from "firebase/firestore";
import { ResultStats } from "./ResultStats";

export type AssignmentRecord = {
    id: string;
    uid: string;
    name: string;
    gameTypesJson: string;
};

export type FirebaseState = {
    user: FirebaseAuth.User | null;
};

type Listener = () => void;

export class FirebaseController {
    private auth!: FirebaseAuth.Auth;
    private db!: Firestore.Firestore;
    private listeners = new Set<Listener>();

    private state: FirebaseState = {
        user: null
    };

    static #firebaseConfig = {
        apiKey: "AIzaSyCehCZKaxW-_qYW5-Vvk9JHJ8nBoLSNIm0",
        authDomain: "play-stefanteaches.firebaseapp.com",
        projectId: "play-stefanteaches",
        storageBucket: "play-stefanteaches.firebasestorage.app",
        messagingSenderId: "930663810506",
        appId: "1:930663810506:web:9312fb860a3477a5acfb33",
        measurementId: "G-X632E2E31S"
    };
    async init(): Promise<void> {
        const app = FirebaseApp.initializeApp(FirebaseController.#firebaseConfig);
        this.auth = FirebaseAuth.getAuth(app);
        this.db   = Firestore.getFirestore(app);

        await FirebaseAuth.setPersistence(this.auth, FirebaseAuth.browserLocalPersistence);

        FirebaseAuth.onAuthStateChanged(this.auth, (user) => {
            this.state = {
                user: user
            };
            this.notifyListeners();
            if (user) {
                this.ensureUserDoc(user).catch(() => { });
            }
        });
    }

    getSnapshot(): FirebaseState { // for react
        return this.state;
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }

    async login(): Promise<void> {
        const provider = new FirebaseAuth.GoogleAuthProvider();
        await FirebaseAuth.signInWithPopup(this.auth, provider);
    }

    async loginWithEmailPassword(emailRaw: string, passwordRaw: string): Promise<void> {
        const email = emailRaw.trim();
        const password = passwordRaw.trim();
        if (!email || !password) throw new Error("Email and password required");

        await FirebaseAuth.signInWithEmailAndPassword(this.auth, email, password);
    }

    async signupWithEmailPassword(emailRaw: string, passwordRaw: string): Promise<void> {
        const email = emailRaw.trim();
        const password = passwordRaw.trim();
        if (!email || !password) throw new Error("Email and password required");
        await FirebaseAuth.createUserWithEmailAndPassword(this.auth, email, password);
    }

    async sendPasswordReset(emailRaw: string): Promise<void> {
        const email = emailRaw.trim();
        if (!email) throw new Error("Email required");
        await FirebaseAuth.sendPasswordResetEmail(this.auth, email);
    }

    async logout(): Promise<void> {
        await FirebaseAuth.signOut(this.auth);
    }

    async onGameEnd(resultStats: ResultStats): Promise<void> {
        const user = this.auth.currentUser;
        if (!user) return alert("Login first!");

        const personalBestsRef = Firestore.doc(this.db, "users", user.uid, "personalBests", "summary");

        await Firestore.setDoc(personalBestsRef, {
            stats: resultStats,
            timestamp: Date.now()
        });
    }

    private async ensureUserDoc(user: FirebaseAuth.User): Promise<void> {
        const userRef = Firestore.doc(this.db, "users", user.uid);
        await Firestore.setDoc(
            userRef,
            {
                uid: user.uid,
                email: user.email ?? null,
                displayName: user.displayName ?? null,
                lastLoginAt: Firestore.serverTimestamp(),
            },
            { merge: true }
        );
    }


    onAssignmentsChanged(cb: (assignments: AssignmentRecord[]) => void): () => void {
        const assignmentsRef = Firestore.collection(this.db, "assignments");
        return Firestore.onSnapshot(assignmentsRef, (snap) => {
            const assignments = snap.docs.map((doc) => {
                const data = doc.data() as any;
                return {
                    id: doc.id,
                    uid: String(data.uid ?? ""),
                    name: String(data.name ?? ""),
                    gameTypesJson: String(data.gameTypesJson ?? "[]"),
                } satisfies AssignmentRecord;
            });
            cb(assignments);
        });
    }

    onAssignmentChanged(assignmentId: string, cb: (assignment: AssignmentRecord | null) => void): () => void {
        const assignmentRef = Firestore.doc(this.db, "assignments", assignmentId);
        return Firestore.onSnapshot(assignmentRef, (snap) => {
            if (!snap.exists()) {
                cb(null);
                return;
            }
            const data = snap.data() as any;
            cb({
                id: snap.id,
                uid: String(data.uid ?? ""),
                name: String(data.name ?? ""),
                gameTypesJson: String(data.gameTypesJson ?? "[]"),
            });
        });
    }

    async recordAttempt(
        assignmentId: string | null | undefined,
        resultStats: ResultStats,
        completionReason: "win" | "timeout"
    ): Promise<void> {
        const user = this.auth.currentUser;
        if (!user) return;
        const attemptsRef = Firestore.collection(this.db, "users", user.uid, "attempts");
        await Firestore.addDoc(attemptsRef, {
            resultStats,
            completionReason,
            assignmentId: assignmentId ?? null,
            attemptType: assignmentId ? "assignment" : "free_practice",
            createdAt: Firestore.serverTimestamp(),
        });
    }

}

export const firebaseController = new FirebaseController();
await firebaseController.init();

export function useFirebaseSnapshot() {
    return useSyncExternalStore(
        firebaseController.subscribe.bind(firebaseController),
        firebaseController.getSnapshot.bind(firebaseController),
        firebaseController.getSnapshot.bind(firebaseController)
    );
}
