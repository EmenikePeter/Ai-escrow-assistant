import { Platform } from 'react-native';

export const webStretch = Platform.OS === 'web'
    ? { width: '100%', maxWidth: 600, alignSelf: 'center' }
    : {};
