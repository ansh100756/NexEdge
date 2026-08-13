import { LogOut, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/state/AuthContext';
import { NexEdgeBrand } from '../../../auth/components/NexEdgeBrand/NexEdgeBrand';
import styles from './Dashboard.module.scss';
export function Dashboard(){const {user}=useAuth();const nav=useNavigate();return <main className={styles.page}><header><NexEdgeBrand/><button onClick={()=>nav('/login')}> <LogOut size={16}/> Sign out</button></header><section className={styles.hero}><div className={styles.icon}><LayoutDashboard/></div><span className={styles.eyebrow}>NEXEDGE WORKSPACE</span><h1>Welcome back<span>.</span></h1><p>You are signed in{user?.email?` as ${user.email}`:''}. Your secure workspace is ready.</p><button className={styles.primary} onClick={()=>nav('/login')}>Back to sign in</button></section></main>}
