import { useEffect, useState } from "react";

import { isBackupConfigured, runBackup } from "./backup";

type SyncState = {
  syncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
};

let _state: SyncState = { syncing: false, lastSyncAt: null, lastError: null };
const _listeners = new Set<() => void>();
let _pending: ReturnType<typeof setTimeout> | null = null;

function set(patch: Partial<SyncState>) {
  _state = { ..._state, ...patch };
  _listeners.forEach((fn) => fn());
}

export function subscribe(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

export function getSyncState(): SyncState {
  return _state;
}

export function useSyncState(): SyncState {
  const [s, setS] = useState<SyncState>(() => _state);
  useEffect(() => subscribe(() => setS({ ..._state })), []);
  return s;
}

export async function triggerSync(): Promise<void> {
  if (!isBackupConfigured()) return;
  if (_state.syncing) {
    scheduleSync(3000); // current sync still running — retry after it finishes
    return;
  }

  set({ syncing: true, lastError: null });

  const result = await runBackup();

  if (result.ok) {
    set({ syncing: false, lastSyncAt: Date.now(), lastError: null });
  } else {
    set({ syncing: false, lastError: result.error ?? "Unknown error" });
  }
}

export function scheduleSync(delayMs = 0): void {
  if (_pending) clearTimeout(_pending);
  _pending = setTimeout(triggerSync, delayMs);
}
