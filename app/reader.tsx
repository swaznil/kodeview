import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ImageViewer } from '@/components/reader/image-viewer';
import { ReaderBody } from '@/components/reader/markdown-view';
import { InlineError } from '@/components/app/shared';
import { isImageExtension } from '@/lib/github';
import { isMarkdownExtension } from '@/lib/markdown';
import { useAppPalette, useThemePreference } from '@/hooks/use-theme-preference';
import { spacing } from '@/lib/palette';
import { findRepositoryNode, listSavedRepositories, readRepositoryFile, type RepositoryTreeNode } from '@/lib/repository-storage';

function Tool({
  active,
  icon,
  label,
  onPress,
}: {
  active?: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const palette = useAppPalette();

  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: active ? palette.accent : pressed ? palette.secondary : palette.fill,
        borderColor: active ? palette.accent : palette.border,
        borderRadius: 8,
        borderWidth: 1,
        height: 36,
        justifyContent: 'center',
        width: 36,
      })}>
      <MaterialIcons color={active ? '#ffffff' : palette.text} name={icon} size={18} />
    </Pressable>
  );
}

export default function ReaderScreen() {
  const { path, repoId } = useLocalSearchParams<{ path: string; repoId: string }>();
  const { appPreferences } = useThemePreference();
  const palette = useAppPalette();
  const [node, setNode] = useState<RepositoryTreeNode | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(appPreferences.markdownPreviewDefault);
  const [showLines, setShowLines] = useState(appPreferences.showLineNumbers);
  const [wrap, setWrap] = useState(appPreferences.wrapCodeByDefault);
  const [fontSize, setFontSize] = useState(appPreferences.defaultCodeFontSize);

  const markdown = useMemo(() => isMarkdownExtension(node?.extension ?? null), [node?.extension]);
  const image = useMemo(() => isImageExtension(node?.extension ?? null), [node?.extension]);

  useEffect(() => {
    let active = true;

    listSavedRepositories()
      .then(async (repositories) => {
        const repository = repositories.find((item) => item.id === repoId);
        if (!repository || !path) {
          throw new Error('File not found.');
        }

        const found = await findRepositoryNode(repository, path);
        if (!found) {
          throw new Error('File not found.');
        }

        if (!active) {
          return;
        }

        setNode(found);
        setPreview(appPreferences.markdownPreviewDefault);
        setShowLines(appPreferences.showLineNumbers);
        setFontSize(appPreferences.defaultCodeFontSize);
        setWrap(appPreferences.wrapCodeByDefault || isMarkdownExtension(found.extension));
        if (!isImageExtension(found.extension)) {
          setContent(await readRepositoryFile(found));
        } else {
          setContent('');
        }
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'Could not open file.');
        }
      });

    return () => {
      active = false;
    };
  }, [
    appPreferences.defaultCodeFontSize,
    appPreferences.markdownPreviewDefault,
    appPreferences.showLineNumbers,
    appPreferences.wrapCodeByDefault,
    path,
    repoId,
  ]);

  useEffect(() => {
    if (!markdown) {
      setWrap(appPreferences.wrapCodeByDefault);
    }
  }, [appPreferences.wrapCodeByDefault, markdown]);

  return (
    <View style={{ backgroundColor: palette.background, flex: 1 }}>
      <Stack.Screen options={{ title: node?.name ?? 'Reader' }} />
      <View
        style={{
          borderBottomColor: palette.border,
          borderBottomWidth: 1,
          gap: spacing.sm,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        <Text numberOfLines={1} style={{ color: palette.muted, fontFamily: 'monospace', fontSize: 12 }}>
          {node?.path ?? path}
        </Text>
        {!image ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {markdown ? (
            <Tool active={preview} icon="article" label="Markdown preview" onPress={() => setPreview((value) => !value)} />
          ) : null}
          {!markdown || !preview ? (
            <>
              <Tool
                active={showLines}
                icon="format-list-numbered"
                label="Line numbers"
                onPress={() => setShowLines((value) => !value)}
              />
              <Tool active={wrap} icon="wrap-text" label="Wrap lines" onPress={() => setWrap((value) => !value)} />
            </>
          ) : (
            <Tool active={wrap} icon="wrap-text" label="Wrap code blocks" onPress={() => setWrap((value) => !value)} />
          )}
          <Tool icon="text-decrease" label="Decrease font size" onPress={() => setFontSize((value) => Math.max(11, value - 1))} />
          <Tool icon="text-increase" label="Increase font size" onPress={() => setFontSize((value) => Math.min(18, value + 1))} />
        </ScrollView>
        ) : null}
      </View>

      {error ? (
        <View style={{ padding: 16 }}>
          <InlineError message={error} palette={palette} />
        </View>
      ) : image && node ? (
        <ImageViewer name={node.name} palette={palette} uri={node.uri} />
      ) : (
        <ReaderBody
          content={content}
          extension={node?.extension ?? null}
          fontSize={fontSize}
          markdownPreview={preview}
          palette={palette}
          showCodeLines={showLines}
          wrap={wrap}
        />
      )}
    </View>
  );
}
