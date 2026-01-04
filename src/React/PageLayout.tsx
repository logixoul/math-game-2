import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import styles from "./PageLayout.module.css";

type PageLayoutProps = {
    loggedIn: boolean;
    onLogOutRequested: () => void;
};

export function PageLayout({loggedIn, onLogOutRequested} : PageLayoutProps) {
    return (
        <div className={"page"}>
            <TopBar/>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
}