import { useSyncExternalStore } from "react";
import * as FirebaseApp from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import * as Firestore from "firebase/firestore";
import { ResultStats } from "./ResultStats";

/*type FirebaseEvents = {
  loggedIn: { user: FirebaseAuth.User };
  loggedOut: {};
  scoreChanged: { score: number; delta: number };
  levelUp: { level: number };
};*/

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
            this.state.user = user;
            this.notifyListeners();
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
        const result = await FirebaseAuth.signInWithPopup(this.auth, provider);
    }

    async logout(): Promise<void> {
        await FirebaseAuth.signOut(this.auth);
    }

    async onGameEnd(resultStats: ResultStats): Promise<void> {
        const user = this.auth.currentUser;
        if (!user) return alert("Login first!");

        const personalBestsRef = Firestore.doc(this.db, "users", user.uid, "personalBests", "summary");

        await Firestore.setDoc(personalBestsRef, {
            stats: resultStats.toPlainObject(),
            timestamp: Date.now()
        });
    }

    private readonly ADMIN_UID = "Cp7CZeiruTgp38UIifYZDYhuvkI3";

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