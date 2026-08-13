import { Outlet } from 'react-router-dom';
import { AuthHeader } from '../AuthHeader/AuthHeader';
import styles from './AuthShell.module.scss';

export function AuthShell(){return <main className={styles.page}><div className={styles.glowOne}/><div className={styles.glowTwo}/><div className={styles.grid}/><AuthHeader/><section className={styles.content}><Outlet/></section><footer className={styles.footer}>NexEdge <span>·</span> Secure workspace</footer></main>}
