export type ParsedGitHubRepository = {
  owner: string;
  repo: string;
};

export type GitHubRepositoryDetails = ParsedGitHubRepository & {
  defaultBranch: string;
  description: string | null;
  fullName: string;
  htmlUrl: string;
  language: string | null;
  ownerAvatarUrl: string;
  pushedAt: string | null;
  stars: number;
  zipUrl: string;
};

export type GitHubCommit = {
  author: string | null;
  date: string | null;
  message: string;
  sha: string;
  url: string;
};

export type GitHubBranch = {
  commitSha: string;
  name: string;
  protected: boolean;
};

export type GitHubRepositorySearchResult = Omit<GitHubRepositoryDetails, 'zipUrl'> & {
  forks: number;
  openIssues: number;
  updatedAt: string | null;
};

type GitHubRepositoryResponse = {
  default_branch?: string;
  description?: string | null;
  full_name?: string;
  html_url?: string;
  language?: string | null;
  name?: string;
  owner?: { avatar_url?: string; login?: string };
  pushed_at?: string | null;
  stargazers_count?: number;
  zipball_url?: string;
  message?: string;
  forks_count?: number;
  open_issues_count?: number;
  updated_at?: string | null;
};

type GitHubSearchResponse = {
  items?: GitHubRepositoryResponse[];
  message?: string;
};

type GitHubCommitResponse = {
  commit?: {
    author?: { date?: string; name?: string };
    message?: string;
  };
  html_url?: string;
  sha?: string;
};

type GitHubBranchResponse = {
  commit?: { sha?: string };
  name?: string;
  protected?: boolean;
};

type GitHubApiOptions = {
  signal?: AbortSignal;
  cacheDurationMs?: number;
};

const GITHUB_API_URL = 'https://api.github.com';
const SEARCH_PAGE_SIZE = 20;
const CACHE_DURATION_MS = 1000 * 60 * 15;

const cache = new Map<
  string,
  {
    expires: number;
    data: unknown;
  }
>();

function getGitHubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
  };
}

export const discoveryTopics = [
  'react native',
  'typescript tooling',
  'developer tools',
  'open source cli',
  'mobile ui',
  'offline first',
] as const;

const trendingTopics = [
  'react-native',
  'typescript',
  'developer-tools',
  'cli',
  'mobile',
  'offline-first',
] as const;

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function sanitizeSearchQuery(query: string) {
  return query.trim().replace(/[:"']/g, '').replace(/\s+/g, ' ');
}

function buildTrendingQuery(topic?: string) {
  const pushedSince = daysAgo(14);
  const createdSince = daysAgo(180);

  const qualifiers = ['stars:>50', `pushed:>${pushedSince}`, `created:>${createdSince}`];

  if (topic) {
    qualifiers.push(`topic:${topic}`);
  }

  return qualifiers.join(' ');
}

function calculateTrendingScore(repo: GitHubRepositorySearchResult) {
  const starsWeight = Math.log10(repo.stars + 1) * 25;
  const forksWeight = Math.log10(repo.forks + 1) * 15;
  const issuesPenalty = Math.min(repo.openIssues * 0.15, 15);

  const updatedAt = repo.updatedAt ? new Date(repo.updatedAt).getTime() : 0;
  const pushedAt = repo.pushedAt ? new Date(repo.pushedAt).getTime() : 0;

  const daysSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
  const daysSincePush = (Date.now() - pushedAt) / (1000 * 60 * 60 * 24);

  const freshnessWeight = Math.max(0, 35 - daysSinceUpdate);
  const activityWeight = Math.max(0, 25 - daysSincePush);

  return starsWeight + forksWeight + freshnessWeight + activityWeight - issuesPenalty;
}

async function githubFetch<T>(
  path: string,
  options: GitHubApiOptions = {}
): Promise<T> {
  const { signal, cacheDurationMs = CACHE_DURATION_MS } = options;
  const cacheKey = options.cacheDurationMs === 0 ? null : path;

  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
  }

  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: getGitHubHeaders(),
    signal,
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? `GitHub returned ${response.status}.`);
  }

  if (cacheKey) {
    cache.set(cacheKey, {
      expires: Date.now() + cacheDurationMs,
      data,
    });
  }

  return data;
}

export function parseGitHubRepository(input: string): ParsedGitHubRepository | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const shorthand = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/);

  if (shorthand) {
    return {
      owner: shorthand[1],
      repo: shorthand[2],
    };
  }

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(normalized);
    const isGitHub = url.hostname.toLowerCase() === 'github.com';
    const [owner, repoSegment] = url.pathname.split('/').filter(Boolean);

    if (!isGitHub || !owner || !repoSegment) {
      return null;
    }

    return {
      owner,
      repo: repoSegment.replace(/\.git$/i, ''),
    };
  } catch {
    return null;
  }
}

export function ownerAvatarUrl(owner: string, size = 128) {
  return `https://github.com/${encodeURIComponent(owner)}.png?size=${size}`;
}

export async function resolveGitHubRepository(
  input: string,
  options: GitHubApiOptions = {}
): Promise<GitHubRepositoryDetails> {
  const parsed = parseGitHubRepository(input);

  if (!parsed) {
    throw new Error('Enter a public GitHub repo URL or owner/repo name.');
  }

  const cacheKey = `repo:${parsed.owner}/${parsed.repo}`;
  const data = await githubFetch<GitHubRepositoryResponse>(
    `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
    { signal: options.signal, cacheDurationMs: options.cacheDurationMs ?? CACHE_DURATION_MS }
  ).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'GitHub returned an error.';
    throw new Error(message === 'Not Found' ? 'Repository not found or not public.' : message);
  });

  const owner = data.owner?.login ?? parsed.owner;
  const repo = data.name ?? parsed.repo;
  const defaultBranch = data.default_branch ?? 'main';

  if (options.cacheDurationMs !== 0) {
    cache.set(cacheKey, {
      expires: Date.now() + (options.cacheDurationMs ?? CACHE_DURATION_MS),
      data,
    });
  }

  return {
    owner,
    repo,
    defaultBranch,
    description: data.description ?? null,
    fullName: data.full_name ?? `${owner}/${repo}`,
    htmlUrl: data.html_url ?? `https://github.com/${owner}/${repo}`,
    language: data.language ?? null,
    ownerAvatarUrl: data.owner?.avatar_url ?? ownerAvatarUrl(owner),
    pushedAt: data.pushed_at ?? null,
    stars: data.stargazers_count ?? 0,
    zipUrl:
      data.zipball_url ??
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/zipball/${encodeURIComponent(defaultBranch)}`,
  };
}

function mapSearchItem(item: GitHubRepositoryResponse): GitHubRepositorySearchResult | null {
  const owner = item.owner?.login;
  const repo = item.name;

  if (!owner || !repo) {
    return null;
  }

  const defaultBranch = item.default_branch ?? 'main';

  return {
    owner,
    repo,
    defaultBranch,
    description: item.description ?? null,
    fullName: item.full_name ?? `${owner}/${repo}`,
    htmlUrl: item.html_url ?? `https://github.com/${owner}/${repo}`,
    language: item.language ?? null,
    ownerAvatarUrl: item.owner?.avatar_url ?? ownerAvatarUrl(owner),
    pushedAt: item.pushed_at ?? null,
    stars: item.stargazers_count ?? 0,
    forks: item.forks_count ?? 0,
    openIssues: item.open_issues_count ?? 0,
    updatedAt: item.updated_at ?? null,
  };
}

function uniqueRepositories(items: GitHubRepositorySearchResult[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.fullName.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function search(
  query: string,
  sort?: 'stars' | 'updated',
  options: GitHubApiOptions = {}
) {
  const normalized = sanitizeSearchQuery(query);

  const params = new URLSearchParams({
    per_page: String(SEARCH_PAGE_SIZE),
    q: normalized,
  });

  if (sort) {
    params.set('sort', sort);
  }

  const cacheKey = `search:${normalized}:${sort ?? 'default'}`;
  const cacheDurationMs = options.cacheDurationMs ?? 1000 * 60 * 5;

  if (cacheDurationMs !== 0) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data as GitHubRepositorySearchResult[];
    }
  }

  const data = await githubFetch<GitHubSearchResponse>(
    `/search/repositories?${params.toString()}`,
    {
      signal: options.signal,
      cacheDurationMs,
    }
  );

  const results = uniqueRepositories(
    (data.items ?? [])
      .map(mapSearchItem)
      .filter((item): item is GitHubRepositorySearchResult => Boolean(item))
  );

  if (cacheDurationMs !== 0) {
    cache.set(cacheKey, {
      expires: Date.now() + cacheDurationMs,
      data: results,
    });
  }

  return results;
}

export async function searchGitHubRepositories(
  query: string,
  options: { sort?: 'stars' | 'updated' | 'best-match'; signal?: AbortSignal } = {}
): Promise<GitHubRepositorySearchResult[]> {
  const normalized = sanitizeSearchQuery(query);

  if (normalized.length < 2) {
    return [];
  }

  return search(normalized, options.sort === 'best-match' ? undefined : options.sort, {
    signal: options.signal,
  });
}

export async function fetchTrendingRepositories(
  signal?: AbortSignal
): Promise<GitHubRepositorySearchResult[]> {
  const topic =
    trendingTopics[Math.floor(Date.now() / (1000 * 60 * 60 * 3)) % trendingTopics.length];

  const repositories = await search(buildTrendingQuery(topic), 'updated', { signal });

  return repositories
    .filter((repo) => {
      if (repo.stars < 50) {
        return false;
      }

      if (!repo.pushedAt) {
        return false;
      }

      const pushedAt = new Date(repo.pushedAt).getTime();
      const daysSincePush = (Date.now() - pushedAt) / (1000 * 60 * 60 * 24);

      return daysSincePush <= 30;
    })
    .sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a));
}

export async function fetchRecommendedRepositories(
  topic: string,
  signal?: AbortSignal
): Promise<GitHubRepositorySearchResult[]> {
  const normalized = sanitizeSearchQuery(topic) || discoveryTopics[0];
  const repositories = await search(`${normalized} stars:>100`, 'stars', { signal });

  return repositories.sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a));
}

export async function fetchRepositoryCommits(
  owner: string,
  repo: string,
  branch?: string,
  signal?: AbortSignal
): Promise<GitHubCommit[]> {
  const params = new URLSearchParams({ per_page: '40' });

  if (branch) {
    params.set('sha', branch);
  }

  const data = await githubFetch<GitHubCommitResponse[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${params.toString()}`,
    { signal }
  );

  return data
    .map((item) => ({
      sha: item.sha?.slice(0, 7) ?? 'unknown',
      message: (item.commit?.message ?? 'No message').split('\n')[0].trim(),
      author: item.commit?.author?.name ?? null,
      date: item.commit?.author?.date ?? null,
      url: item.html_url ?? '',
    }))
    .filter((item) => item.sha !== 'unknown');
}

export async function fetchRepositoryBranches(
  owner: string,
  repo: string,
  signal?: AbortSignal
): Promise<GitHubBranch[]> {
  const data = await githubFetch<GitHubBranch[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`,
    { signal }
  );

  return data
    .map((item) => ({
      name: item.name ?? 'unknown',
      commitSha: item.commitSha?.slice(0, 7) ?? 'unknown',
      protected: Boolean(item.protected),
    }))
    .filter((item) => item.name !== 'unknown')
    .sort((a, b) => {
      const priority = (branch: GitHubBranch) => {
        if (branch.name === 'main') return 0;
        if (branch.name === 'master') return 1;
        if (branch.protected) return 2;
        return 3;
      };

      const diff = priority(a) - priority(b);
      if (diff !== 0) return diff;

      return a.name.localeCompare(b.name);
    });
}

export const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);

export function isImageExtension(extension: string | null) {
  return extension !== null && imageExtensions.has(extension.toLowerCase());
}