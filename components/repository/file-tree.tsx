import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { FlatList, Pressable, Text, View, type ListRenderItem } from 'react-native';

import { useAppPalette } from '@/hooks/use-theme-preference';
import { isImageExtension } from '@/lib/github';
import { formatBytes } from '@/lib/repository-storage';
import { radius, spacing } from '@/lib/palette';
import { flattenVisibleTree, type VisibleTreeRow } from '@/lib/tree';

const TreeRow = memo(function TreeRow({
  compact,
  depth,
  isOpen,
  node,
  onToggle,
  repositoryId,
  showFileSizes,
}: {
  compact: boolean;
  depth: number;
  isOpen: boolean;
  node: VisibleTreeRow['node'];
  onToggle: (path: string) => void;
  repositoryId: string;
  showFileSizes: boolean;
}) {
  const palette = useAppPalette();
  const directory = node.type === 'directory';
  const open = directory && isOpen;

  return (
    <Pressable
      onPress={() =>
        directory
          ? onToggle(node.path)
          : router.push({ pathname: '/reader', params: { repoId: repositoryId, path: node.path } })
      }
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? palette.secondary : 'transparent',
        borderRadius: 6,
        flexDirection: 'row',
        gap: spacing.sm,
        minHeight: compact ? 32 : 34,
        paddingLeft: 8 + depth * 14,
        paddingRight: 8,
      })}>
      <MaterialIcons
        color={directory ? palette.accent : palette.muted}
        name={
          directory ? (open ? 'folder-open' : 'folder') : isImageExtension(node.extension) ? 'image' : 'description'
        }
        size={18}
      />
      <Text numberOfLines={1} style={{ color: palette.text, flex: 1, fontFamily: 'monospace', fontSize: compact ? 12 : 13 }}>
        {node.name}
      </Text>
      {!directory && showFileSizes ? (
        <Text style={{ color: palette.muted, fontSize: 11, fontVariant: ['tabular-nums'] }}>{formatBytes(node.size)}</Text>
      ) : null}
      {directory ? (
        <MaterialIcons color={palette.muted} name={open ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} size={18} />
      ) : null}
    </Pressable>
  );
});

export const FileTreeList = memo(function FileTreeList({
  compact,
  expanded,
  nodes,
  onToggle,
  repositoryId,
  showFileSizes,
}: {
  compact: boolean;
  expanded: Set<string>;
  nodes: VisibleTreeRow['node'][];
  onToggle: (path: string) => void;
  repositoryId: string;
  showFileSizes: boolean;
}) {
  const palette = useAppPalette();
  const rows = useMemo(() => flattenVisibleTree(nodes, expanded), [expanded, nodes]);

  const renderItem: ListRenderItem<VisibleTreeRow> = useCallback(
    ({ item }) => (
      <TreeRow
        compact={compact}
        depth={item.depth}
        isOpen={expanded.has(item.node.path)}
        node={item.node}
        onToggle={onToggle}
        repositoryId={repositoryId}
        showFileSizes={showFileSizes}
      />
    ),
    [compact, expanded, onToggle, repositoryId, showFileSizes]
  );

  if (rows.length === 0) {
    return (
      <Text style={{ color: palette.muted, fontSize: 13, paddingVertical: spacing.md }}>No matching files.</Text>
    );
  }

  return (
    <FlatList
      data={rows}
      initialNumToRender={28}
      keyExtractor={(item) => item.key}
      maxToRenderPerBatch={24}
      nestedScrollEnabled
      removeClippedSubviews
      renderItem={renderItem}
      scrollEnabled={false}
      windowSize={8}
    />
  );
});

export function FileTreePanel({
  children,
}: {
  children: ReactNode;
}) {
  const palette = useAppPalette();

  return (
    <View
      style={{
        backgroundColor: palette.fill,
        borderColor: palette.border,
        borderRadius: radius.sm,
        borderWidth: 1,
        gap: 2,
        padding: spacing.sm,
      }}>
      {children}
    </View>
  );
}
