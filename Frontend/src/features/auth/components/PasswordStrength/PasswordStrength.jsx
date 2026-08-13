import styles from './PasswordStrength.module.scss';
export function PasswordStrength({score,label,percent}){if(!score)return null;return <div className={styles.wrap}><div className={styles.meta}><span>Password strength</span><strong>{label}</strong></div><div className={styles.track}><span style={{width:`${percent}%`}}/></div></div>}
