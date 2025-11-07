import { openBrowserAsync } from 'expo-web-browser';
import { type PropsWithChildren } from 'react';
import { Linking, Platform, Pressable, Text, type StyleProp, type TextStyle } from 'react-native';

type Props = PropsWithChildren<{
  href: string;
  style?: StyleProp<TextStyle>;
}>;

export function ExternalLink({ href, children, style }: Props) {
  const handlePress = async () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    try {
      const supported = await Linking.canOpenURL(href);
      if (supported) {
        await openBrowserAsync(href);
      } else {
        await Linking.openURL(href);
      }
    } catch {
      // Swallow errors to avoid crashing the UI if the link fails to open.
    }
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="link">
      <Text style={style}>{children}</Text>
    </Pressable>
  );
}
