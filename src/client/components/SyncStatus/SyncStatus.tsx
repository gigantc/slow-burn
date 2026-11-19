import { clockTime } from '@/lib/format';
import { useSyncStatus } from '@/lib/storeHooks';
import styles from './SyncStatus.module.scss';

/** `quiet` shows nothing unless the user is offline or has unsynced changes. */
const SyncStatus = ({ quiet = false }: { quiet?: boolean }) => {
  const { pending, online, syncing, lastSynced } = useSyncStatus();

  if (quiet && online && pending === 0) return null;

  let text = lastSynced ? 'Synced' : 'Not synced yet';
  if (pending > 0) text = syncing ? `Syncing ${pending}...` : `${pending} unsynced`;
  if (!online) text = pending > 0 ? `Offline · ${pending} unsynced` : 'Offline';

  const state = !online ? 'offline' : pending > 0 ? 'pending' : lastSynced ? 'synced' : 'idle';

  return (
    <p
      className={styles.status}
      role="status"
      data-state={state}
      title={lastSynced ? `Last synced ${clockTime(lastSynced)}` : undefined}
    >
      {text}
    </p>
  );
};

export default SyncStatus;
