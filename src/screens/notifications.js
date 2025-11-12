import * as Notifications from 'expo-notifications';
import { Platform, View } from 'react-native';
import BackButton from './BackButton'; // Adjust the import based on your file structure

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    // Validate hardcoded color value for notification light
    const { validateColor } = require('./colorValidator');
    validateColor('#FF231F7C', 'Notification.lightColor');
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleNotification = async (title, body, seconds) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { seconds },
  });
};

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <BackButton />
      {/* ...existing screen content... */}
    </View>
  );
}
