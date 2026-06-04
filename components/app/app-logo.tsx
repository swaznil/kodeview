import { Image } from 'expo-image';
import { memo } from 'react';
import { type ImageStyle, type StyleProp } from 'react-native';

const logoSource = require('@/assets/images/icon.png');

export const AppLogo = memo(function AppLogo({
  size = 38,
  style,
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      accessibilityLabel="KodeView"
      contentFit="contain"
      source={logoSource}
      style={[{ borderRadius: size / 4, height: size, width: size }, style]}
      transition={120}
    />
  );
});
