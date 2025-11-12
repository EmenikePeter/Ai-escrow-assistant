import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { ScrollView, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { COLORS } from '../constants/Theme';

export default function ChatHistoryDetailScreen() {
  const route = useRoute();
  const { session, messages } = route.params || {};

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: COLORS.background }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <BackButton />
          <Ionicons name="chatbubble-ellipses-outline" size={36} color={COLORS.primary} />
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 }}>Chat Session Details</Text>
          <Text style={{ color: COLORS.text, marginTop: 4 }}>Session ID: {session?._id}</Text>
          <Text style={{ color: COLORS.text }}>Agent: {session?.agentEmail || 'N/A'}</Text>
          <Text style={{ color: COLORS.text }}>Closed: {session?.updatedAt ? new Date(session.updatedAt).toLocaleString() : ''}</Text>
        </View>
        {(!messages || messages.length === 0) ? (
          <Text style={{ color: COLORS.text }}>No messages in this session.</Text>
        ) : messages.map((msg, idx) => (
          <View key={msg._id || idx} style={{ marginBottom: 12, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderColor: '#eee', borderWidth: 1 }}>
            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>{msg.sender === 'user' ? 'You' : (msg.from || 'Agent')}</Text>
            <Text style={{ color: COLORS.text }}>{msg.text}</Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{msg.time ? new Date(msg.time).toLocaleString() : ''}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
