import { useEffect, useState } from "react";

import { BackupTarget, isBackupConfigured, runBackup } from "./backup";

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

export async function triggerSync(target: BackupTarget = "full"): Promise<void> {
  console.log("🔄 triggerSync called with target:", target);
  console.log("🔧 isBackupConfigured():", isBackupConfigured());
  
  if (!isBackupConfigured()) {
    console.log("❌ Backup not configured, exiting triggerSync");
    return;
  }
  
  if (_state.syncing) {
    console.log("⏳ Already syncing, scheduling another sync");
    scheduleSync("full", 3000);
    return;
  }

  console.log("🚀 Starting backup process...");
  set({ syncing: true, lastError: null });

  const result = await runBackup(target);
  console.log("📊 Backup result:", result);

  if (result.ok) {
    console.log("✅ Backup successful");
    set({ syncing: false, lastSyncAt: Date.now(), lastError: null });
  } else {
    console.log("❌ Backup failed:", result.error);
    set({ syncing: false, lastError: result.error ?? "Unknown error" });
  }
}

export function scheduleSync(target: BackupTarget = "full", delayMs = 0): void {
  console.log("⏰ scheduleSync called with target:", target, "delay:", delayMs + "ms");
  
  if (_pending) {
    console.log("🔄 Clearing existing sync timer");
    clearTimeout(_pending);
  }
  
  console.log("⏱️ Setting sync timer for", delayMs + "ms");
  _pending = setTimeout(() => {
    console.log("⏰ Timer fired, calling triggerSync");
    triggerSync(target);
  }, delayMs);
}
