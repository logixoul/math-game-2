import { useSyncExternalStore } from "react";
import * as FirebaseApp from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import * as Firestore from "firebase/firestore";
import { ResultStats } from "./ResultStats";

export type UserSummary = {
    uid: string;
    email?: string | null;
    displayName?: string | null;
};

export type AssignmentRecord = {
    id: string;
    name: string;
    dueText: string;
    isActive: boolean;
    version: number;
    gameTypesJson: string;
};

export type AssignmentAttempt = {
    id: string;
    createdAt?: Firestore.Timestamp | null;
    completionReason: "win" | "timeout";
    resultStats: ResultStats;
    assignmentId?: string | null;
    attemptType?: "assignment" | "free_practice";
};

export type UnlockStatus =
    | { status: "signed_out" }
    | { status: "locked" }
    | { status: "unlocked"; unlockedWithCode?: string }

export type FirebaseState = {
    user: FirebaseAuth.User | null;
    unlockStatus: UnlockStatus;
};

type Listener = () => void;

export class FirebaseController {
    private auth!: FirebaseAuth.Auth;
    private db!: Firestore.Firestore;
    private listeners = new Set<Listener>();

    private state: FirebaseState = {
        user: null,
        unlockStatus: { status: "signed_out" }
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
                user: user,
                unlockStatus: { status: "unlocked" }
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

    private readonly ADMIN_UID = "Cp7CZeiruTgp38UIifYZDYhuvkI3";
    isCurrentUserAdmin(): boolean {
        return this.auth.currentUser?.uid === this.ADMIN_UID;
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

    async generateUnlockCodeSingleUse(): Promise<string> {
        const user = this.auth.currentUser;
        if (!user) throw new Error("Login first");
        if (user.uid !== this.ADMIN_UID) throw new Error("Not admin");

        // Simple readable code. You can change format as you like.
        const code = crypto.randomUUID().slice(0, 8).toUpperCase(); // e.g. "A1B2C3D4"
        const codeRef = Firestore.doc(this.db, "unlockCodes", code);

        await Firestore.setDoc(codeRef, {
            usesLeft: 1,
            createdAt: Firestore.serverTimestamp(),
            createdByUid: user.uid,
            redeemedByUid: null,
            redeemedAt: null,
        });

        return code;
    }

    async redeemUnlockCode(codeRaw: string): Promise<void> {
        const user = this.auth.currentUser;
        if (!user) throw new Error("Login first");

        const code = codeRaw.trim().toUpperCase();
        if (!code) throw new Error("Empty code");

        const codeRef = Firestore.doc(this.db, "unlockCodes", code);
        const userRef = Firestore.doc(this.db, "users", user.uid);

        await Firestore.runTransaction(this.db, async (tx) => {
            const codeSnap = await tx.get(codeRef);
            if (!codeSnap.exists()) throw new Error("Invalid code");

            const data = codeSnap.data() as any;
            const usesLeft = Number(data.usesLeft ?? 0);
            if (usesLeft <= 0) throw new Error("This code has already been used.");

            // Consume the code
            tx.update(codeRef, {
                usesLeft: usesLeft - 1,
                redeemedByUid: user.uid,
                redeemedAt: Firestore.serverTimestamp(),
            });

            // Mark the user as unlocked
            tx.set(
                userRef,
                {
                    unlocked: true,
                    unlockedWithCode: code,
                    unlockedAt: Firestore.serverTimestamp(),
                },
                { merge: true }
            );
        });
    }

    async getUnlockStatus(): Promise<UnlockStatus> {
        const user = this.auth.currentUser;
        if (!user) return { status: "signed_out" };

        const userRef = Firestore.doc(this.db, "users", user.uid);
        const snap = await Firestore.getDoc(userRef);

        if (!snap.exists()) return { status: "locked" };

        const data = snap.data() as { unlocked?: boolean; unlockedWithCode?: string };
        if (data.unlocked === true) {
            return { status: "unlocked", unlockedWithCode: data.unlockedWithCode };
        }
        return { status: "locked" };
    }

    onUsersChanged(cb: (users: UserSummary[]) => void): () => void {
        const usersRef = Firestore.collection(this.db, "users");
        return Firestore.onSnapshot(usersRef, (snap) => {
            const users = snap.docs.map((doc) => {
                const data = doc.data() as any;
                return {
                    uid: doc.id,
                    email: data.email ?? null,
                    displayName: data.displayName ?? null,
                } satisfies UserSummary;
            });
            cb(users);
        });
    }

    onAssignmentsChanged(uid: string, cb: (assignments: AssignmentRecord[]) => void): () => void {
        const assignmentsRef = Firestore.collection(this.db, "users", uid, "assignments");
        return Firestore.onSnapshot(assignmentsRef, (snap) => {
            const assignments = snap.docs.map((doc) => {
                const data = doc.data() as any;
                return {
                    id: doc.id,
                    name: String(data.name ?? ""),
                    dueText: String(data.dueText ?? ""),
                    isActive: Boolean(data.isActive ?? false),
                    version: Number(data.version ?? 1),
                    gameTypesJson: String(data.gameTypesJson ?? "[]"),
                } satisfies AssignmentRecord;
            });
            cb(assignments);
        });
    }

    onUserAttemptsChanged(uid: string, cb: (attempts: AssignmentAttempt[]) => void): () => void {
        const attemptsRef = Firestore.collection(this.db, "users", uid, "attempts");
        return Firestore.onSnapshot(attemptsRef, (snap) => {
            const attempts = snap.docs.map((doc) => {
                const data = doc.data() as any;
                return {
                    id: doc.id,
                    createdAt: data.createdAt ?? null,
                    completionReason: data.completionReason ?? "win",
                    resultStats: data.resultStats as ResultStats,
                    assignmentId: data.assignmentId ?? null,
                    attemptType: data.attemptType ?? null,
                } satisfies AssignmentAttempt;
            });
            cb(attempts);
        });
    }

    onAssignmentChanged(uid: string, assignmentId: string, cb: (assignment: AssignmentRecord | null) => void): () => void {
        const assignmentRef = Firestore.doc(this.db, "users", uid, "assignments", assignmentId);
        return Firestore.onSnapshot(assignmentRef, (snap) => {
            if (!snap.exists()) {
                cb(null);
                return;
            }
            const data = snap.data() as any;
            cb({
                id: snap.id,
                name: String(data.name ?? ""),
                dueText: String(data.dueText ?? ""),
                isActive: Boolean(data.isActive ?? false),
                version: Number(data.version ?? 1),
                gameTypesJson: String(data.gameTypesJson ?? "[]"),
            });
        });
    }

    async createAssignment(uid: string, defaults?: Partial<AssignmentRecord>): Promise<string> {
        const assignmentId = crypto.randomUUID();
        const assignmentRef = Firestore.doc(this.db, "users", uid, "assignments", assignmentId);
        await Firestore.setDoc(assignmentRef, {
            name: defaults?.name ?? "New assignment",
            dueText: defaults?.dueText ?? "",
            isActive: defaults?.isActive ?? true,
            version: defaults?.version ?? 1,
            gameTypesJson: defaults?.gameTypesJson ?? "[]",
            createdAt: Firestore.serverTimestamp(),
            updatedAt: Firestore.serverTimestamp(),
        });
        return assignmentId;
    }

    async updateAssignment(uid: string, assignmentId: string, update: Partial<AssignmentRecord>): Promise<void> {
        const assignmentRef = Firestore.doc(this.db, "users", uid, "assignments", assignmentId);
        await Firestore.setDoc(
            assignmentRef,
            {
                ...update,
                updatedAt: Firestore.serverTimestamp(),
            },
            { merge: true }
        );
    }

    async deleteAssignment(uid: string, assignmentId: string): Promise<void> {
        const assignmentRef = Firestore.doc(this.db, "users", uid, "assignments", assignmentId);
        await Firestore.deleteDoc(assignmentRef);
    }

    onAssignmentAttemptsChanged(
        uid: string,
        assignmentId: string,
        cb: (attempts: AssignmentAttempt[]) => void
    ): () => void {
        const attemptsRef = Firestore.collection(this.db, "users", uid, "attempts");
        const attemptsQuery = Firestore.query(
            attemptsRef,
            Firestore.where("assignmentId", "==", assignmentId)
        );
        return Firestore.onSnapshot(attemptsQuery, (snap) => {
            const attempts = snap.docs.map((doc) => {
                const data = doc.data() as any;
                return {
                    id: doc.id,
                    createdAt: data.createdAt ?? null,
                    completionReason: data.completionReason ?? "win",
                    resultStats: data.resultStats as ResultStats,
                    assignmentId: data.assignmentId ?? null,
                    attemptType: data.attemptType ?? null,
                } satisfies AssignmentAttempt;
            });
            cb(attempts);
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

    /** Live listener (nice UX): call unsubscribe() when leaving the page */
    onUnlockStatusChanged(cb: (s: UnlockStatus) => void): () => void {
        const user = this.auth.currentUser;
        if (!user) {
            cb({ status: "signed_out" });
            return () => { };
        }

        const userRef = Firestore.doc(this.db, "users", user.uid);
        return Firestore.onSnapshot(
            userRef,
            (snap) => {
                if (!snap.exists()) {
                    cb({ status: "locked" });
                    return;
                }
                const data = snap.data() as { unlocked?: boolean; unlockedWithCode?: string };
                cb(data.unlocked === true
                    ? { status: "unlocked", unlockedWithCode: data.unlockedWithCode }
                    : { status: "locked" }
                );
            },
            (_err) => {
                // If rules block read, you’ll land here.
                cb({ status: "locked" });
            }
        );
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
