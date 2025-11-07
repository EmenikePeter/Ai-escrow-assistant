import { Text, View } from 'react-native';

export default function MyTicketsScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>My Tickets</Text>
      {/* TODO: List tickets assigned to the current user here */}
    </View>
  );
}
