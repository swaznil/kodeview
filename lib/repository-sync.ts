import AsyncStorage from '@react-native-async-storage/async-storage';

import { resolveGitHubRepository } from '@/lib/github';
import {
  importRepository,
  listSavedRepositories,
  type ImportProgress,
  type SavedRepository,
} from '@/lib/repository-storage';

const LAST_AUTO_SYNC_KEY = 'kodeview.last-auto-sync';
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const AUTO_SYNC_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export async function syncRepository(
  repository: SavedRepository,
  onProgress?: (progress: ImportProgress) => void
): Promise<SavedRepository> {
  const details = await resolveGitHubRepository(repository.fullName);
  return importRepository(details, onProgress);
}

function isStale(repository: SavedRepository) {
  return Date.now() - new Date(repository.downloadedAt).getTime() > STALE_AFTER_MS;
}

export async function syncStaleRepositories(options?: {
  force?: boolean;
  onRepositoryProgress?: (fullName: string, progress: ImportProgress) => void;
}): Promise<{ skipped: number; synced: number }> {
  const repositories = await listSavedRepositories();
  const stale = repositories.filter(isStale);

  if (stale.length === 0) {
    return { skipped: repositories.length, synced: 0 };
  }

  if (!options?.force) {
    const lastRun = await AsyncStorage.getItem(LAST_AUTO_SYNC_KEY);
    if (lastRun && Date.now() - Number(lastRun) < AUTO_SYNC_COOLDOWN_MS) {
      return { skipped: repositories.length, synced: 0 };
    }
  }

  let synced = 0;

  for (const repository of stale) {
    await syncRepository(repository, (progress) => options?.onRepositoryProgress?.(repository.fullName, progress));
    synced += 1;
  }

  await AsyncStorage.setItem(LAST_AUTO_SYNC_KEY, String(Date.now())).catch(() => undefined);

  return { skipped: repositories.length - synced, synced };
}

export async function runAutoSyncIfEnabled(enabled: boolean) {
  if (!enabled) {
    return;
  }

  await syncStaleRepositories().catch(() => undefined);
}
