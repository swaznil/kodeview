import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SavedRepository } from '@/lib/repository-storage';

const PINNED_KEY = 'kodeview.pinned-repositories';
const SORT_KEY = 'kodeview.repository-sort';

export type RepositorySort = 'recent' | 'name-asc' | 'name-desc' | 'stars' | 'size';

export async function getPinnedRepositoryIds(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(PINNED_KEY).catch(() => null);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function setPinnedRepositoryIds(ids: string[]) {
  await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(ids)).catch(() => undefined);
}

export async function togglePinnedRepository(id: string): Promise<boolean> {
  const pinned = await getPinnedRepositoryIds();
  const next = pinned.includes(id) ? pinned.filter((item) => item !== id) : [...pinned, id];
  await setPinnedRepositoryIds(next);
  return next.includes(id);
}

export async function isRepositoryPinned(id: string) {
  const pinned = await getPinnedRepositoryIds();
  return pinned.includes(id);
}

export async function getRepositorySort(): Promise<RepositorySort> {
  const stored = await AsyncStorage.getItem(SORT_KEY).catch(() => null);
  if (
    stored === 'recent' ||
    stored === 'name-asc' ||
    stored === 'name-desc' ||
    stored === 'stars' ||
    stored === 'size'
  ) {
    return stored;
  }

  return 'recent';
}

export async function setRepositorySort(sort: RepositorySort) {
  await AsyncStorage.setItem(SORT_KEY, sort).catch(() => undefined);
}

export function filterAndSortRepositories(
  repositories: SavedRepository[],
  options: {
    pinnedIds: string[];
    query: string;
    sort: RepositorySort;
  }
): SavedRepository[] {
  const needle = options.query.trim().toLowerCase();
  const filtered = needle
    ? repositories.filter((repo) => {
        const haystack = [repo.fullName, repo.description ?? '', repo.language ?? '', repo.owner, repo.repo]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
    : repositories;

  const pinned = new Set(options.pinnedIds);
  const compare = (a: SavedRepository, b: SavedRepository) => {
    switch (options.sort) {
      case 'name-asc':
        return a.fullName.localeCompare(b.fullName);
      case 'name-desc':
        return b.fullName.localeCompare(a.fullName);
      case 'stars':
        return b.stars - a.stars || b.downloadedAt.localeCompare(a.downloadedAt);
      case 'size':
        return b.sizeBytes - a.sizeBytes || b.downloadedAt.localeCompare(a.downloadedAt);
      case 'recent':
      default:
        return b.downloadedAt.localeCompare(a.downloadedAt);
    }
  };

  const pinnedRepos = filtered.filter((repo) => pinned.has(repo.id)).sort(compare);
  const otherRepos = filtered.filter((repo) => !pinned.has(repo.id)).sort(compare);

  return [...pinnedRepos, ...otherRepos];
}
