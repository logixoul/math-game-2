import styles from "./ErrorPage.module.css";

type ErrorPageProps = {
    message: string;
};

export function ErrorPage({ message }: ErrorPageProps) {
    return (
        <div className={styles.page + " page"}>
            <main className={styles.content}>
                <p>Нещо се обърка! 😮</p>
                <p>Съобщение за грешка: {message}</p>
            </main>
        </div>);
}
