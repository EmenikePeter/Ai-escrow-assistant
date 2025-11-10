import { Platform } from 'react-native';

export const webStretch = Platform.OS === 'web' ? { alignItems: 'stretch' } : {};
