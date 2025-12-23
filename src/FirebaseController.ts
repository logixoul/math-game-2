import * as FirebaseApp from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import * as Firestore from "firebase/firestore";
import type { UIController } from "./UI";
import { TypedEventEmitter } from "./TypedEventEmitter";
import { ResultStats } from "./ResultStats";

type FirebaseEvents = {
  loggedIn: { user: FirebaseAuth.User };
  loggedOut: {};
  scoreChanged: { score: number; delta: number };
  levelUp: { level: number };
};

export class FirebaseController {
    private uiController?: UIController;
    private auth!: FirebaseAuth.Auth;
    private db!: Firestore.Firestore;

    #bus = new TypedEventEmitter<FirebaseEvents>();

    get bus() {
        return this.#bus;
    }

    constructor(uiController?: UIController) {
        this.uiController = uiController;
    }
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
            if (user) {
                this.#bus.emit("loggedIn", { user });
            } else {
                this.#bus.emit("loggedOut", {});
            }
        });
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

        const ref = Firestore.doc(this.db, "users", user.uid, "personalBests", "summary");

        await Firestore.setDoc(ref, {
            stats: resultStats.toPlainObject(),
            timestamp: Date.now()
        });
    }
}
