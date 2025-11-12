import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import BackButton from '../components/BackButton';
import { COLORS } from '../constants/Theme';
import { useUser } from '../context/UserContext';
import { validateColor } from '../utils/colorValidator';
import { getItem } from '../utils/storage';

export default function HistoryScreen({ navigation }) {
  useEffect(() => {
    validateColor(COLORS.primary, 'COLORS.primary');
    validateColor(COLORS.text, 'COLORS.text');
    validateColor(COLORS.background, 'COLORS.background');
    validateColor(COLORS.card, 'COLORS.card');
    validateColor(COLORS.error, 'COLORS.error');
    validateColor('#f00', 'DisputeWarningIcon.color fallback');
  }, []);
  const { user } = useUser();
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    getItem('contracts').then(setContracts);
    getItem('disputes').then(setDisputes);
  }, []);

  useEffect(() => {
    async function fetchChatHistory() {
      if (!user?.email) return;
      setLoadingChats(true);
      try {
        const res = await axios.get(`/api/history/user/${encodeURIComponent(user.email)}`);
        setChatHistory(res.data || []);
      } catch (e) {
        setChatHistory([]);
      }
      setLoadingChats(false);
    }
    fetchChatHistory();
  }, [user]);

  return (
    <View style={{ flex: 1 }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: COLORS.background }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="chatbubbles-outline" size={36} color={COLORS.primary} />
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 }}>Chat History</Text>
        </View>
        {loadingChats ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : chatHistory.length === 0 ? (
          <Text style={{ color: COLORS.text }}>No past chats yet.</Text>
        ) : chatHistory.map((s, idx) => (
          <TouchableOpacity key={s.session?._id || idx} onPress={() => navigation.navigate('ChatHistoryDetail', { session: s.session, messages: s.messages })}>
            <View style={{ marginBottom: 12, backgroundColor: COLORS.card, padding: 12, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primary} style={{ marginBottom: 4 }} />
              <Text style={{ color: COLORS.text }}>Session ID: {s.session?._id}</Text>
              <Text style={{ color: COLORS.text }}>Closed: {s.session?.updatedAt ? new Date(s.session.updatedAt).toLocaleString() : ''}</Text>
              <Text style={{ color: COLORS.text }}>Agent: {s.session?.agentEmail || 'N/A'}</Text>
              <Text style={{ color: COLORS.text }}>Messages: {s.messages?.length || 0}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ alignItems: 'center', marginBottom: 16, marginTop: 24 }}>
          <Ionicons name="time-outline" size={36} color={COLORS.primary} />
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 }}>Contract History</Text>
        </View>
        {contracts.length === 0 ? (
          <Text style={{ color: COLORS.text }}>No contracts yet.</Text>
        ) : contracts.map((c, idx) => (
          <TouchableOpacity key={c.id ? c.id : `contract-${idx}`} onPress={() => navigation.navigate('PreviewContract', { contract: c })}>
            <View style={{ marginBottom: 12, backgroundColor: COLORS.card, padding: 12, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
              <Ionicons name="document-outline" size={20} color={COLORS.primary} style={{ marginBottom: 4 }} />
              <Text style={{ color: COLORS.text }}>Title: {c.title}</Text>
              <Text style={{ color: COLORS.text }}>Amount: ${c.amount}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <Ionicons name="alert-circle-outline" size={28} color={COLORS.primary} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 }}>Dispute History</Text>
        </View>
        {disputes.length === 0 ? (
          <Text style={{ color: COLORS.text }}>No disputes yet.</Text>
        ) : disputes.map((d, idx) => (
          <TouchableOpacity key={d.id ? d.id : `dispute-${idx}`} onPress={() => navigation.navigate('DisputeDetail', { dispute: d })}>
            <View style={{ marginBottom: 12, backgroundColor: COLORS.card, padding: 12, borderRadius: 8, elevation: 2, borderColor: COLORS.error, borderWidth: 1 }}>
              <Ionicons name="warning-outline" size={20} color={COLORS.error || '#f00'} style={{ marginBottom: 4 }} />
              <Text style={{ color: COLORS.text }}>Contract ID: {d.contractId}</Text>
              <Text style={{ color: COLORS.text }}>Issue: {d.issue}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
