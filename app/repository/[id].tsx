import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { InlineError, Panel } from '@/components/app/shared';
import { OwnerAvatar } from '@/components/repository/owner-avatar';
import { FileTreeList, FileTreePanel } from '@/components/repository/file-tree';
import { useAppPalette, useThemePreference } from '@/hooks/use-theme-preference';
import { spacing } from '@/lib/palette';
import {
  deleteRepository,
  formatBytes,
  listSavedRepositories,
  loadRepositoryTree,
  type SavedRepository,
} from '@/lib/repository-storage';
import { collectDirectoryPaths, filterTree, findReadme } from '@/lib/tree';

export default function RepositoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appPreferences } = useThemePreference();
  const palette = useAppPalette();
  const [repository, setRepository] = useState<SavedRepository | null>(null);
  const [tree, setTree] = useState<Awaited<ReturnType<typeof loadRepositoryTree>>>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [openedReadme, setOpenedReadme] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const visibleTree = useMemo(() => filterTree(tree, query), [query, tree]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const repositories = await listSavedRepositories();
      const found = repositories.find((item) => item.id === id) ?? null;
      setRepository(found);
      setOpenedReadme(false);

      if (!found) {
        setTree([]);
        return;
      }

      const nodes = await loadRepositoryTree(found);
      setTree(nodes);
      setExpanded(new Set(collectDirectoryPaths(nodes)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open repository.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!appPreferences.autoOpenReadme || openedReadme || tree.length === 0 || !repository) {
      return;
    }

    const readme = findReadme(tree);
    if (!readme) {
      return;
    }

    setOpenedReadme(true);
    router.push({ pathname: '/reader', params: { repoId: repository.id, path: readme.path } });
  }, [appPreferences.autoOpenReadme, openedReadme, repository, tree]);

  const toggle = useCallback((path: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  async function removeRepository() {
    if (!repository) {
      return;
    }

    await deleteRepository(repository);
    router.back();
  }

  if (!repository && !loading) {
    return (
      <View style={{ backgroundColor: palette.background, flex: 1, padding: spacing.lg }}>
        <Text style={{ color: palette.muted }}>Repository not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() =>
                Alert.alert('Delete repository?', repository?.fullName, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: removeRepository },
                ])
              }
              style={{ paddingHorizontal: spacing.sm }}>
              <MaterialIcons color={palette.danger} name="delete-outline" size={22} />
            </Pressable>
          ),
          title: repository?.fullName ?? 'Repository',
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={{ gap: 12, minHeight: '100%', padding: 16, paddingBottom: 32 }}>
        {repository ? (
          <Panel palette={palette}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
              <OwnerAvatar owner={repository.owner} palette={palette} size={44} uri={repository.ownerAvatarUrl} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900' }}>{repository.fullName}</Text>
                <Text style={{ color: palette.muted, fontSize: 12 }}>
                  {formatBytes(repository.sizeBytes)} saved · {repository.fileCount.toLocaleString()} files
                </Text>
              </View>
            </View>
            {repository.description ? (
              <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>{repository.description}</Text>
            ) : null}
          </Panel>
        ) : null}

        {error ? <InlineError message={error} palette={palette} /> : null}

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          onChangeText={setQuery}
          placeholder="Filter files"
          placeholderTextColor={palette.muted}
          style={{
            backgroundColor: palette.fill,
            borderColor: palette.border,
            borderRadius: 8,
            borderWidth: 1,
            color: palette.text,
            fontSize: 14,
            minHeight: 42,
            paddingHorizontal: 12,
          }}
          value={query}
        />

        <FileTreePanel>
          {loading ? (
            <Text style={{ color: palette.muted, fontSize: 13, padding: spacing.md }}>Loading file tree…</Text>
          ) : repository ? (
            <FileTreeList
              compact={appPreferences.compactExplorer}
              expanded={expanded}
              nodes={visibleTree}
              onToggle={toggle}
              repositoryId={repository.id}
              showFileSizes={appPreferences.showFileSizes}
            />
          ) : null}
        </FileTreePanel>
      </ScrollView>
    </>
  );
}
