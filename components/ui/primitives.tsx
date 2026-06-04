import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { radius, spacing, type Palette } from '@/lib/palette';

type IconName = keyof typeof MaterialIcons.glyphMap;

export function SectionLabel({ children, palette }: { children: string; palette: Palette }) {
  return (
    <Text
      style={{
        color: palette.muted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        paddingHorizontal: 2,
        textTransform: 'uppercase',
      }}>
      {children}
    </Text>
  );
}

export function Section({
  children,
  palette,
  title,
}: PropsWithChildren<{ palette: Palette; title?: string }>) {
  return (
    <View style={{ gap: spacing.sm }}>
      {title ? <SectionLabel palette={palette}>{title}</SectionLabel> : null}
      <View
        style={{
          backgroundColor: palette.fill,
          borderColor: palette.border,
          borderRadius: radius.sm,
          borderWidth: 1,
          overflow: 'hidden',
        }}>
        {children}
      </View>
    </View>
  );
}

export function SettingRow({
  children,
  detail,
  icon,
  label,
  last,
  palette,
}: PropsWithChildren<{ detail?: string; icon: IconName; label: string; last?: boolean; palette: Palette }>) {
  return (
    <View
      style={{
        alignItems: 'center',
        borderBottomColor: palette.border,
        borderBottomWidth: last ? 0 : 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 56,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      }}>
      <MaterialIcons color={palette.accent} name={icon} size={20} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700' }}>{label}</Text>
        {detail ? <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 17 }}>{detail}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function Chip({
  children,
  onPress,
  palette,
  selected,
}: {
  children: string;
  onPress?: () => void;
  palette: Palette;
  selected?: boolean;
}) {
  const content = (
    <Text style={{ color: selected ? '#ffffff' : palette.text, fontSize: 12, fontWeight: '700' }}>{children}</Text>
  );

  if (!onPress) {
    return (
      <View
        style={{
          backgroundColor: selected ? palette.accent : palette.secondary,
          borderColor: selected ? palette.accent : palette.border,
          borderRadius: radius.pill,
          borderWidth: 1,
          paddingHorizontal: spacing.md,
          paddingVertical: 7,
        }}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? palette.accent : pressed ? palette.secondary : palette.fill,
        borderColor: selected ? palette.accent : palette.border,
        borderRadius: radius.pill,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
      })}>
      {content}
    </Pressable>
  );
}
