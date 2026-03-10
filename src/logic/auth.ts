import { auth } from "@/logic/firebase";
import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";

let currentUser: User | null = auth.currentUser;
const listeners = new Set<(user: User | null) => void>();

const authUnsubscribe = onAuthStateChanged(auth, (user) => {
	currentUser = user;
	if (user) {
		void ensureUserDoc(user);
	}
	for (const listener of listeners) {
		listener(user);
	}
});

void authUnsubscribe;

async function ensureUserDoc(user: User): Promise<void> {
	const userRef = doc(db, "users", user.uid);
	await setDoc(
		userRef,
		{
			uid: user.uid,
			email: user.email ?? null,
			displayName: user.displayName ?? null,
			lastLoginAt: serverTimestamp(),
		},
		{ merge: true },
	);
}

export function subscribeToAuthUser(
	listener: (user: User | null) => void,
): () => void {
	listeners.add(listener);
	listener(currentUser);
	return () => {
		listeners.delete(listener);
	};
}

export function useAuthUser(): User | null {
	const [user, setUser] = useState<User | null>(currentUser);
	useEffect(() => subscribeToAuthUser(setUser), []);
	return user;
}

export function isAdminUser(user: User | null): boolean {
	return user?.email === "logixoul@gmail.com";
}

export async function loginWithGoogle(): Promise<void> {
	const provider = new GoogleAuthProvider();
	await signInWithPopup(auth, provider);
}

export async function loginWithEmailPassword(
	emailRaw: string,
	passwordRaw: string,
): Promise<void> {
	const email = emailRaw.trim();
	const password = passwordRaw.trim();
	if (!email || !password) throw new Error("Email and password required");
	await signInWithEmailAndPassword(auth, email, password);
}

export async function signupWithEmailPassword(
	emailRaw: string,
	passwordRaw: string,
): Promise<void> {
	const email = emailRaw.trim();
	const password = passwordRaw.trim();
	if (!email || !password) throw new Error("Email and password required");
	await createUserWithEmailAndPassword(auth, email, password);
}

export async function sendPasswordReset(emailRaw: string): Promise<void> {
	const email = emailRaw.trim();
	if (!email) throw new Error("Email required");
	await sendPasswordResetEmail(auth, email);
}

export async function logout(): Promise<void> {
	await signOut(auth);
}
