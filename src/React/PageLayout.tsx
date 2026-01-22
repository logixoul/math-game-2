import { Outlet } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import styles from "./PageLayout.module.css";

type PageLayoutProps = {
};

export function PageLayout({} : PageLayoutProps) {
    return (
        <div className={"page"}>
            <TopBar/>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
}