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

export const discoveryTopics = [
  'react native',
  'typescript tooling',
  'developer tools',
  'open source cli',
  'mobile ui',
  'offline first',
] as const;

const trendingQueries = [
  'stars:>8000 pushed:>2025-01-01',
  'topic:react-native stars:>2000',
  'topic:typescript stars:>3000',
  'topic:developer-tools stars:>1500',
];

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
    const url = new URL(trimmed);
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

export async function resolveGitHubRepository(input: string): Promise<GitHubRepositoryDetails> {
  const parsed = parseGitHubRepository(input);

  if (!parsed) {
    throw new Error('Enter a public GitHub repo URL or owner/repo name.');
  }

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    }
  );
  const data = (await response.json().catch(() => ({}))) as GitHubRepositoryResponse;

  if (!response.ok) {
    const reason =
      data.message === 'Not Found'
        ? 'Repository not found or not public.'
        : data.message ?? `GitHub returned ${response.status}.`;
    throw new Error(reason);
  }

  const owner = data.owner?.login ?? parsed.owner;
  const repo = data.name ?? parsed.repo;
  const defaultBranch = data.default_branch ?? 'main';

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

async function search(query: string, sort?: 'stars' | 'updated') {
  const params = new URLSearchParams({
    per_page: '12',
    q: query,
  });

  if (sort) {
    params.set('sort', sort);
  }

  const response = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });
  const data = (await response.json().catch(() => ({}))) as GitHubSearchResponse;

  if (!response.ok) {
    throw new Error(data.message ?? `GitHub search returned ${response.status}.`);
  }

  return (data.items ?? []).map(mapSearchItem).filter((item): item is GitHubRepositorySearchResult => Boolean(item));
}

export async function searchGitHubRepositories(
  query: string,
  options: { sort?: 'stars' | 'updated' | 'best-match' } = {}
): Promise<GitHubRepositorySearchResult[]> {
  const normalized = query.trim();

  if (normalized.length < 2) {
    return [];
  }

  return search(normalized, options.sort === 'best-match' ? undefined : options.sort);
}

export async function fetchTrendingRepositories(): Promise<GitHubRepositorySearchResult[]> {
  const query = trendingQueries[Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % trendingQueries.length];
  return search(query, 'stars');
}

export async function fetchRecommendedRepositories(topic: string): Promise<GitHubRepositorySearchResult[]> {
  const normalized = topic.trim() || discoveryTopics[0];
  return search(`${normalized} stars:>500`, 'stars');
}

export function ownerAvatarUrl(owner: string, size = 128) {
  return `https://github.com/${encodeURIComponent(owner)}.png?size=${size}`;
}

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

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  const data = (await response.json().catch(() => ({}))) as T & { message?: string };

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? `GitHub returned ${response.status}.`);
  }

  return data;
}

export async function fetchRepositoryCommits(
  owner: string,
  repo: string,
  branch?: string
): Promise<GitHubCommit[]> {
  const params = new URLSearchParams({ per_page: '40' });
  if (branch) {
    params.set('sha', branch);
  }

  const data = await githubFetch<GitHubCommitResponse[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${params.toString()}`
  );

  return data
    .map((item) => ({
      sha: item.sha?.slice(0, 7) ?? 'unknown',
      message: (item.commit?.message ?? 'No message').split('\n')[0],
      author: item.commit?.author?.name ?? null,
      date: item.commit?.author?.date ?? null,
      url: item.html_url ?? '',
    }))
    .filter((item) => item.sha !== 'unknown');
}

export async function fetchRepositoryBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
  const data = await githubFetch<GitHubBranchResponse[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`
  );

  return data
    .map((item) => ({
      name: item.name ?? 'unknown',
      commitSha: item.commit?.sha?.slice(0, 7) ?? 'unknown',
      protected: Boolean(item.protected),
    }))
    .filter((item) => item.name !== 'unknown')
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);

export function isImageExtension(extension: string | null) {
  return extension !== null && imageExtensions.has(extension.toLowerCase());
}

export function uniqueRepositories(items: GitHubRepositorySearchResult[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.fullName)) {
      return false;
    }

    seen.add(item.fullName);
    return true;
  });
}
