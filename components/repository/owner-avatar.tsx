import { Image } from 'expo-image';
import { memo } from 'react';
import { View } from 'react-native';

import { ownerAvatarUrl } from '@/lib/github';
import { type Palette } from '@/lib/palette';

export const OwnerAvatar = memo(function OwnerAvatar({
  owner,
  palette,
  size = 40,
  uri,
}: {
  owner: string;
  palette: Palette;
  size?: number;
  uri?: string | null;
}) {
  const source = uri ?? ownerAvatarUrl(owner, size * 2);

  return (
    <View
      style={{
        backgroundColor: palette.secondary,
        borderColor: palette.border,
        borderRadius: size / 2,
        borderWidth: 1,
        height: size,
        overflow: 'hidden',
        width: size,
      }}>
      <Image
        accessibilityLabel={`${owner} avatar`}
        cachePolicy="memory-disk"
        contentFit="cover"
        recyclingKey={source}
        source={{ uri: source }}
        style={{ height: size, width: size }}
        transition={150}
      />
    </View>
  );
});
