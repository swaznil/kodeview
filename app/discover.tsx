import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader, InlineError, Pill } from '@/components/app/shared';
import { OwnerAvatar } from '@/components/repository/owner-avatar';
import { useAppPalette } from '@/hooks/use-theme-preference';
import {
  discoveryTopics,
  fetchRecommendedRepositories,
  fetchTrendingRepositories,
  resolveGitHubRepository,
  searchGitHubRepositories,
  uniqueRepositories,
  type GitHubRepositorySearchResult,
} from '@/lib/github';
import { spacing } from '@/lib/palette';
import { importRepository } from '@/lib/repository-storage';

function ResultCard({
  cloning,
  onClone,
  repository,
}: {
  cloning: string | null;
  onClone: (fullName: string) => void;
  repository: GitHubRepositorySearchResult;
}) {
  const palette = useAppPalette();
  const busy = cloning === repository.fullName;

  return (
    <Pressable
      disabled={Boolean(cloning)}
      onPress={() => onClone(repository.fullName)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? palette.secondary : palette.fill,
        borderColor: palette.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        opacity: cloning && !busy ? 0.6 : 1,
        padding: 12,
      })}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        <OwnerAvatar owner={repository.owner} palette={palette} uri={repository.ownerAvatarUrl} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15, fontWeight: '800' }}>
            {repository.fullName}
          </Text>
          <Text numberOfLines={2} style={{ color: palette.muted, fontSize: 12, lineHeight: 17 }}>
            {repository.description ?? 'No description provided.'}
          </Text>
        </View>
        {busy ? (
          <ActivityIndicator color={palette.accent} />
        ) : (
          <MaterialIcons color={palette.primary} name="download" size={20} />
        )}
      </View>
      <Text style={{ color: palette.muted, fontSize: 11 }}>
        {repository.stars.toLocaleString()} stars · {repository.forks.toLocaleString()} forks
        {repository.language ? ` · ${repository.language}` : ''}
      </Text>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const palette = useAppPalette();
  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState<string>(discoveryTopics[0]);
  const [trending, setTrending] = useState<GitHubRepositorySearchResult[]>([]);
  const [recommended, setRecommended] = useState<GitHubRepositorySearchResult[]>([]);
  const [results, setResults] = useState<GitHubRepositorySearchResult[]>([]);
  const [mode, setMode] = useState<'browse' | 'search'>('browse');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBrowse = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const [nextTrending, nextRecommended] = await Promise.all([
        fetchTrendingRepositories(),
        fetchRecommendedRepositories(activeTopic),
      ]);
      setTrending(nextTrending);
      setRecommended(nextRecommended);
      setMode('browse');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load discovery feeds.');
    } finally {
      setBusy(false);
    }
  }, [activeTopic]);

  useEffect(() => {
    loadBrowse();
  }, [loadBrowse]);

  useEffect(() => {
    if (mode !== 'search') {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBusy(true);
      setError(null);

      try {
        setResults(await searchGitHubRepositories(trimmed, { sort: 'best-match' }));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'GitHub search failed.');
      } finally {
        setBusy(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [mode, query]);

  async function clone(fullName: string) {
    setCloning(fullName);
    setError(null);

    try {
      const details = await resolveGitHubRepository(fullName);
      const saved = await importRepository(details);
      router.replace({ pathname: '/repository/[id]', params: { id: saved.id } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not clone this repository.');
    } finally {
      setCloning(null);
    }
  }

  const visibleResults = useMemo(() => {
    if (mode === 'search') {
      return results;
    }

    return uniqueRepositories([...trending, ...recommended]).slice(0, 18);
  }, [mode, recommended, results, trending]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={palette.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await loadBrowse();
            setRefreshing(false);
          }}
        />
      }
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ gap: 16, minHeight: '100%', padding: 16, paddingBottom: 32 }}>
      <AppHeader
        palette={palette}
        subtitle="Search GitHub and download repositories for offline reading."
        title="Discover"
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => {
            setQuery(value);
            setMode(value.trim().length >= 2 ? 'search' : 'browse');
          }}
          onSubmitEditing={() => setMode(query.trim().length >= 2 ? 'search' : 'browse')}
          placeholder="Search repositories, topics, owners..."
          placeholderTextColor={palette.muted}
          returnKeyType="search"
          style={{
            backgroundColor: palette.fill,
            borderColor: palette.border,
            borderRadius: 8,
            borderWidth: 1,
            color: palette.text,
            flex: 1,
            fontSize: 14,
            minHeight: 44,
            paddingHorizontal: 12,
          }}
          value={query}
        />
        {busy ? <ActivityIndicator color={palette.accent} style={{ alignSelf: 'center' }} /> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {discoveryTopics.map((topic) => (
          <Pressable
            key={topic}
            onPress={() => {
              setActiveTopic(topic);
              setMode('browse');
              setQuery('');
            }}>
            <Pill palette={palette} selected={mode === 'browse' && activeTopic === topic}>
              {topic}
            </Pill>
          </Pressable>
        ))}
      </ScrollView>

      {error ? <InlineError message={error} palette={palette} /> : null}

      <View style={{ gap: 10 }}>
        <Text style={{ color: palette.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {mode === 'search' ? 'Search results' : 'Trending & recommended'}
        </Text>
        {visibleResults.length === 0 && !busy ? (
          <Text style={{ color: palette.muted, fontSize: 14, paddingVertical: spacing.lg, textAlign: 'center' }}>
            {mode === 'search' ? 'No repositories matched your search.' : 'Pull to refresh discovery feeds.'}
          </Text>
        ) : null}
        {visibleResults.map((repository) => (
          <ResultCard cloning={cloning} key={repository.fullName} onClone={clone} repository={repository} />
        ))}
      </View>
    </ScrollView>
  );
}
