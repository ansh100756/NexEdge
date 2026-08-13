import { Link } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, MailWarning } from 'lucide-react';
import { useEmailVerification } from '../../hooks/useEmailVerification';
import styles from './VerifyEmail.module.scss';
export function VerifyEmail(){const {status,message}=useEmailVerification();const icon=status==='success'?<CheckCircle2/>:status==='loading'?<LoaderCircle className={styles.spin}/>:<MailWarning/>;return <section className={styles.card}><div className={styles.icon}>{icon}</div><div className={styles.kicker}>EMAIL VERIFICATION</div><h1>{status==='success'?'Email verified':'Email verification'}</h1><p>{message||'We are checking your verification link. Please wait a moment.'}</p>{status!=='loading'&&<Link className={styles.link} to="/login">Continue to sign in</Link>}</section>}
