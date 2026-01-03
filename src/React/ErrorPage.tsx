import { TopBar } from "./TopBar";
import styles from "./ErrorPage.module.css";

export function ErrorPage() {
    return (
        <div className={styles.page + " page"}>
            <TopBar />
            <main className={styles.content}>
                Страницата не е намерена! 😮
            </main>
        </div>);
}
