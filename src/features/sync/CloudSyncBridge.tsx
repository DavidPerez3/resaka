import { useEffect, useRef } from 'react';

import { useAuth } from '@/features/auth/AuthContext';
import { useOutingSession } from '@/features/outing/OutingSessionContext';
import { syncCompletedOuting } from '@/services/sync/supabaseOutingSync';

export function CloudSyncBridge() {
  const { user } = useAuth();
  const { isHydrated, lastFinishedOuting } = useOutingSession();
  const lastSyncKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isHydrated || !user || !lastFinishedOuting) return;

    const key = `${user.id}:${lastFinishedOuting.outing.id}:${lastFinishedOuting.outing.updatedAt}`;
    if (lastSyncKey.current === key) return;
    lastSyncKey.current = key;

    void syncCompletedOuting(lastFinishedOuting, user.id).catch((error) => {
      lastSyncKey.current = null;
      console.warn('RESAKA cloud sync failed', error);
    });
  }, [isHydrated, lastFinishedOuting, user]);

  return null;
}
