import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { InlineError, Pill } from '@/components/app/shared';
import { useAppPalette } from '@/hooks/use-theme-preference';
import { fetchRepositoryBranches, type GitHubBranch } from '@/lib/github';
import { spacing } from '@/lib/palette';
import { listSavedRepositories, type SavedRepository } from '@/lib/repository-storage';

export default function BranchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const palette = useAppPalette();
  const [repository, setRepository] = useState<SavedRepository | null>(null);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setBusy(true);
      setError(null);

      try {
        const found = (await listSavedRepositories()).find((item) => item.id === id) ?? null;
        if (!found) {
          throw new Error('Repository not found.');
        }

        if (!active) {
          return;
        }

        setRepository(found);
        setBranches(await fetchRepositoryBranches(found.owner, found.repo));
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'Could not load branches.');
        }
      } finally {
        if (active) {
          setBusy(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <View style={{ backgroundColor: palette.background, flex: 1 }}>
      <Stack.Screen options={{ title: repository ? `Branches · ${repository.repo}` : 'Branches' }} />
      {busy ? (
        <ActivityIndicator color={palette.accent} style={{ marginTop: 32 }} />
      ) : error ? (
        <View style={{ padding: spacing.lg }}>
          <InlineError message={error} palette={palette} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ gap: 10, padding: 16, paddingBottom: 32 }}
          data={branches}
          initialNumToRender={20}
          keyExtractor={(item) => item.name}
          maxToRenderPerBatch={24}
          removeClippedSubviews
          renderItem={({ item }) => {
            const current = item.name === repository?.defaultBranch;

            return (
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: palette.fill,
                  borderColor: current ? palette.accent : palette.border,
                  borderRadius: 8,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: 10,
                  padding: 12,
                }}>
                <MaterialIcons color={current ? palette.accent : palette.muted} name="call-split" size={20} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: palette.text, fontSize: 15, fontWeight: '800' }}>{item.name}</Text>
                  <Text style={{ color: palette.muted, fontFamily: 'monospace', fontSize: 12 }}>{item.commitSha}</Text>
                </View>
                {current ? <Pill palette={palette} selected>default</Pill> : null}
                {item.protected ? <Pill palette={palette}>protected</Pill> : null}
              </View>
            );
          }}
          windowSize={10}
        />
      )}
    </View>
  );
}
