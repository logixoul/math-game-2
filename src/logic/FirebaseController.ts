import { useSyncExternalStore } from "react";
import { initializeApp } from "firebase/app";
import { User, Auth, getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { Firestore as Firestore_1, getFirestore, doc, setDoc, serverTimestamp, collection, onSnapshot, addDoc } from "firebase/firestore";
import { ResultStats } from "./ResultStats";

export type AssignmentRecord = {
    id: string;
    uid: string;
    name: string;
    spec: string;
    category: string;
    index: number;
};

export type FirebaseState = {
    user: User | null;
};

type Listener = () => void;

export class FirebaseController {
    private auth!: Auth;
    private db!: Firestore_1;
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
        const app = initializeApp(FirebaseController.#firebaseConfig);
        this.auth = getAuth(app);
        this.db   = getFirestore(app);

        await setPersistence(this.auth, browserLocalPersistence);

        onAuthStateChanged(this.auth, (user) => {
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
        const provider = new GoogleAuthProvider();
        await signInWithPopup(this.auth, provider);
    }

    async loginWithEmailPassword(emailRaw: string, passwordRaw: string): Promise<void> {
        const email = emailRaw.trim();
        const password = passwordRaw.trim();
        if (!email || !password) throw new Error("Email and password required");

        await signInWithEmailAndPassword(this.auth, email, password);
    }

    async signupWithEmailPassword(emailRaw: string, passwordRaw: string): Promise<void> {
        const email = emailRaw.trim();
        const password = passwordRaw.trim();
        if (!email || !password) throw new Error("Email and password required");
        await createUserWithEmailAndPassword(this.auth, email, password);
    }

    async sendPasswordReset(emailRaw: string): Promise<void> {
        const email = emailRaw.trim();
        if (!email) throw new Error("Email required");
        await sendPasswordResetEmail(this.auth, email);
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
    }

    async onGameEnd(resultStats: ResultStats): Promise<void> {
        const user = this.auth.currentUser;
        if (!user) return alert("Login first!");

        const personalBestsRef = doc(this.db, "users", user.uid, "personalBests", "summary");

        await setDoc(personalBestsRef, {
            stats: resultStats,
            timestamp: Date.now()
        });
    }

    private async ensureUserDoc(user: User): Promise<void> {
        const userRef = doc(this.db, "users", user.uid);
        
        await setDoc(
            userRef,
            {
                uid: user.uid,
                email: user.email ?? null,
                displayName: user.displayName ?? null,
                lastLoginAt: serverTimestamp(),
            },
            { merge: true }
        );
    }

    isAdmin(): boolean {
        const user = this.auth.currentUser;
        if (!user) return false;
        return user.email === "logixoul@gmail.com";
    }

    onAssignmentChanged(assignmentId: string, cb: (assignment: AssignmentRecord | null) => void): () => void {
        const assignmentRef = doc(this.db, "assignments", assignmentId);
        return onSnapshot(assignmentRef, (snap) => {
            if (!snap.exists()) {
                cb(null);
                return;
            }
            cb({ id: snap.id, ...snap.data() } as AssignmentRecord);
        });
    }

    async recordAttempt(
        assignmentId: string | null | undefined,
        resultStats: ResultStats,
        completionReason: "win" | "timeout"
    ): Promise<void> {
        const user = this.auth.currentUser;
        if (!user) return;
        const attemptsRef = collection(this.db, "users", user.uid, "attempts");
        await addDoc(attemptsRef, {
            resultStats,
            completionReason,
            assignmentId: assignmentId ?? null,
            attemptType: assignmentId ? "assignment" : "free_practice",
            createdAt: serverTimestamp(),
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

export const db = firebaseController['db']; // TODO: better way to export Firestore instance
export const auth = firebaseController['auth']; // TODO: better way to export Auth instance