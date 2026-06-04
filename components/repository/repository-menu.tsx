import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppPalette } from '@/hooks/use-theme-preference';
import { spacing, type Palette } from '@/lib/palette';
import type { SavedRepository } from '@/lib/repository-storage';

type MenuAction = {
  destructive?: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
};

export function RepositoryMenu({
  onClose,
  palette: paletteProp,
  repository,
  visible,
  pinned,
  onPin,
  onSync,
  onDelete,
}: {
  onClose: () => void;
  palette?: Palette;
  repository: SavedRepository | null;
  visible: boolean;
  pinned: boolean;
  onPin: () => void;
  onSync: () => void;
  onDelete: () => void;
}) {
  const fallbackPalette = useAppPalette();
  const palette = paletteProp ?? fallbackPalette;
  const insets = useSafeAreaInsets();

  if (!repository) {
    return null;
  }

  const actions: MenuAction[] = [
    {
      icon: pinned ? 'push-pin' : 'bookmark-border',
      label: pinned ? 'Unpin repository' : 'Pin repository',
      onPress: () => {
        onClose();
        onPin();
      },
    },
    {
      icon: 'history',
      label: 'View commit log',
      onPress: () => {
        onClose();
        router.push({
          pathname: '/repository/commits',
          params: { id: repository.id },
        });
      },
    },
    {
      icon: 'sync',
      label: 'Sync repository',
      onPress: () => {
        onClose();
        onSync();
      },
    },
    {
      icon: 'call-split',
      label: 'Branches',
      onPress: () => {
        onClose();
        router.push({
          pathname: '/repository/branches',
          params: { id: repository.id },
        });
      },
    },
    {
      destructive: true,
      icon: 'delete-outline',
      label: 'Delete repository',
      onPress: () => {
        onClose();
        onDelete();
      },
    },
  ];

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.45)', flex: 1 }} />
        <View
          style={{
            backgroundColor: palette.fill,
            borderColor: palette.border,
            borderRadius: 12,
            borderWidth: 1,
            marginHorizontal: 16,
            marginBottom: Math.max(16, insets.bottom + 8),
            overflow: 'hidden',
          }}>
        <View style={{ borderBottomColor: palette.border, borderBottomWidth: 1, padding: spacing.md }}>
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 16, fontWeight: '800' }}>
            {repository.fullName}
          </Text>
          <Text style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>Repository actions</Text>
        </View>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: pressed ? palette.secondary : 'transparent',
              flexDirection: 'row',
              gap: spacing.md,
              minHeight: 52,
              paddingHorizontal: spacing.md,
            })}>
            <MaterialIcons
              color={action.destructive ? palette.danger : palette.text}
              name={action.icon}
              size={22}
            />
            <Text
              style={{
                color: action.destructive ? palette.danger : palette.text,
                flex: 1,
                fontSize: 15,
                fontWeight: '600',
              }}>
              {action.label}
            </Text>
          </Pressable>
        ))}
        </View>
      </View>
    </Modal>
  );
}
