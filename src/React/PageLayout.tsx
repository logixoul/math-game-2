import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import styles from "./PageLayout.module.css";

export function PageLayout() {
    return (
        <div className={"page"}>
            <TopBar />
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
}