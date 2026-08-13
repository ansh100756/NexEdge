import { BarChart3 } from 'lucide-react';
import styles from './NexEdgeBrand.module.scss';

export function NexEdgeBrand() {
  return <div className={styles.brand}><span className={styles.mark}><BarChart3 size={22}/></span><span>Nex<span>Edge</span></span></div>;
}
