import { useId } from "react";
import styles from "./Input.module.scss";

export function Input({ label, error, id, icon, endAdornment, required = true, ...props }) {
  const generatedId = useId();
  const inputId = id || props.name || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
      <div className={`${styles.control} ${error ? styles.invalid : ""}`}>
        {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={icon ? styles.withIcon : ""}
          {...props}
        />
        {endAdornment && <span className={styles.end}>{endAdornment}</span>}
      </div>
      {error && <p id={errorId} className={styles.error}>{error}</p>}
    </div>
  );
}
