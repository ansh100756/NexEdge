import { AlertCircle } from "lucide-react";
import styles from "./Alert.module.scss";

export function Alert({ children }) {
  return (
    <div className={styles.alert} role="alert">
      <AlertCircle size={17} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
