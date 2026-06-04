import { memo, useCallback, useMemo } from 'react';
import { FlatList, Text, View, type ListRenderItem } from 'react-native';

import { highlightLine } from '@/lib/markdown';
import { type Palette } from '@/lib/palette';

type CodeBlockProps = {
  content: string;
  extension: string | null;
  fontSize: number;
  palette: Palette;
  showLines: boolean;
  wrap: boolean;
};

const VIRTUALIZE_AFTER = 80;

type LineRow = {
  index: number;
  line: string;
};

const CodeLine = memo(function CodeLine({
  extension,
  fontSize,
  gutter,
  index,
  line,
  lineHeight,
  palette,
  showLines,
  wrap,
}: {
  extension: string | null;
  fontSize: number;
  gutter: number;
  index: number;
  line: string;
  lineHeight: number;
  palette: Palette;
  showLines: boolean;
  wrap: boolean;
}) {
  const colors = useMemo(
    () => ({
      comment: palette.muted,
      keyword: palette.danger,
      number: '#d29922',
      string: palette.success,
      tag: '#7ee787',
      text: palette.text,
    }),
    [palette]
  );

  const parts = useMemo(() => highlightLine(line, extension, colors), [colors, extension, line]);

  return (
    <View style={{ flexDirection: 'row', width: wrap ? '100%' : undefined }}>
      {showLines ? (
        <Text
          style={{
            color: palette.muted,
            fontFamily: 'monospace',
            fontSize,
            lineHeight,
            marginRight: 10,
            minWidth: gutter * (fontSize * 0.62) + 8,
            textAlign: 'right',
          }}>
          {String(index + 1).padStart(gutter, ' ')}
        </Text>
      ) : null}
      <Text
        style={{
          color: palette.text,
          flex: wrap ? 1 : undefined,
          flexShrink: wrap ? 1 : undefined,
          fontFamily: 'monospace',
          fontSize,
          lineHeight,
        }}>
        {parts.map((part) => (
          <Text key={part.key} style={{ color: part.color }}>
            {part.text}
          </Text>
        ))}
      </Text>
    </View>
  );
});

export const CodeBlock = memo(function CodeBlock({
  content,
  extension,
  fontSize,
  palette,
  showLines,
  wrap,
}: CodeBlockProps) {
  const lines = useMemo(() => content.replace(/\t/g, '  ').split(/\r\n|\n|\r/), [content]);
  const gutter = String(lines.length).length;
  const lineHeight = fontSize + 8;
  const data = useMemo(() => lines.map((line, index) => ({ index, line })), [lines]);

  const renderItem: ListRenderItem<LineRow> = useCallback(
    ({ item }) => (
      <CodeLine
        extension={extension}
        fontSize={fontSize}
        gutter={gutter}
        index={item.index}
        line={item.line}
        lineHeight={lineHeight}
        palette={palette}
        showLines={showLines}
        wrap={wrap}
      />
    ),
    [extension, fontSize, gutter, lineHeight, palette, showLines, wrap]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<LineRow> | null | undefined, index: number) => ({
      index,
      length: lineHeight,
      offset: lineHeight * index,
    }),
    [lineHeight]
  );

  if (lines.length > VIRTUALIZE_AFTER) {
    return (
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={data}
        getItemLayout={getItemLayout}
        initialNumToRender={32}
        keyExtractor={(item) => String(item.index)}
        maxToRenderPerBatch={40}
        nestedScrollEnabled
        removeClippedSubviews
        renderItem={renderItem}
        windowSize={12}
      />
    );
  }

  return (
    <View style={{ gap: 0, padding: 16, width: wrap ? '100%' : undefined }}>
      {data.map((item) => (
        <CodeLine
          key={item.index}
          extension={extension}
          fontSize={fontSize}
          gutter={gutter}
          index={item.index}
          line={item.line}
          lineHeight={lineHeight}
          palette={palette}
          showLines={showLines}
          wrap={wrap}
        />
      ))}
    </View>
  );
});
