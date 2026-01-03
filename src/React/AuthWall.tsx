import { Outlet } from "react-router-dom";
import { useEffect, useState, useSyncExternalStore } from "react";
import { firebaseController, useFirebaseSnapshot } from "../FirebaseController";

export function AuthWall() {
    const snapshot = useFirebaseSnapshot();

    if (snapshot.user) {
        return <Outlet />;
    }

    return (
        <>
            Please log in!
            <button onClick={() => firebaseController.login()}>Login</button>
        </>
    );
}
