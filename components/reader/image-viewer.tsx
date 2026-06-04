import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';

import { type Palette } from '@/lib/palette';

export function ImageViewer({
  name,
  palette,
  uri,
}: {
  name: string;
  palette: Palette;
  uri: string;
}) {
  return (
    <ScrollView
      contentContainerStyle={{ alignItems: 'center', gap: 12, padding: 16, paddingBottom: 32 }}
      style={{ flex: 1 }}>
      <Text style={{ alignSelf: 'flex-start', color: palette.muted, fontSize: 12 }}>{name}</Text>
      <View
        style={{
          backgroundColor: palette.fill,
          borderColor: palette.border,
          borderRadius: 8,
          borderWidth: 1,
          maxWidth: '100%',
          overflow: 'hidden',
          width: '100%',
        }}>
        <Image
          accessibilityLabel={name}
          contentFit="contain"
          source={{ uri }}
          style={{ aspectRatio: 1, maxHeight: 520, minHeight: 180, width: '100%' }}
          transition={200}
        />
      </View>
    </ScrollView>
  );
}
