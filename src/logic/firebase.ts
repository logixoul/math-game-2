import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyCehCZKaxW-_qYW5-Vvk9JHJ8nBoLSNIm0",
	authDomain: "play-stefanteaches.firebaseapp.com",
	projectId: "play-stefanteaches",
	storageBucket: "play-stefanteaches.firebasestorage.app",
	messagingSenderId: "930663810506",
	appId: "1:930663810506:web:9312fb860a3477a5acfb33",
	measurementId: "G-X632E2E31S",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

await setPersistence(auth, browserLocalPersistence);
