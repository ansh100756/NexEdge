import { LoaderCircle } from "lucide-react";
import styles from "./Button.module.scss";

export function Button({ children, loading = false, disabled = false, ...props }) {
  return (
    <button className={styles.button} disabled={loading || disabled} {...props}>
      {loading ? <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" /> : children}
    </button>
  );
}
