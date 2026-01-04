import { Outlet } from "react-router-dom";
import { firebaseController, useFirebaseSnapshot } from "../FirebaseController";

export function AuthWall() {
    const snapshot = useFirebaseSnapshot();

    if (snapshot.user || true) {
        return <Outlet />;
    }

    return (
        <>
            Please log in!
            <button onClick={() => firebaseController.login()}>Login</button>
        </>
    );
}
