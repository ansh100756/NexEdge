import styles from "./FullPageLoader.module.scss";

export function FullPageLoader() {
  return (
    <main className={styles.page} aria-label="Loading">
      <div className={styles.spinner} />
    </main>
  );
}
