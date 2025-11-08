import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Button, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../config/env';
import { COLORS } from '../constants/Theme';
import { useUser } from '../context/UserContext';
import { getWithAuth } from '../utils/api';

export default function ReceivedContractsScreen({ navigation }) {
  const { user } = useUser();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchContracts = async () => {
    if (!user?.email) {
      console.log('[ReceivedContractsScreen] No user email, skipping fetch. User:', user);
      return;
    }
    setLoading(true);
    try {
      const res = await getWithAuth(`${API_BASE_URL}/api/contracts/received?email=${user.email}`);
      setContracts(res.data.contracts || []);
      console.log('[ReceivedContractsScreen] Received contracts:', res.data.contracts);
    } catch (err) {
      console.log('[ReceivedContractsScreen] Error fetching contracts:', err?.message, err?.response?.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, [user]);

  return (
    <ScrollView style={{ backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: COLORS.primary }}>
        Received Contracts
      </Text>
      <Button title={loading ? 'Loading...' : 'Refresh'} color={COLORS.primary} onPress={fetchContracts} />
      {contracts.length === 0 ? (
        <Text style={{ color: COLORS.text, marginTop: 16 }}>No contracts received yet.</Text>
      ) : (
        contracts.map((c, idx) => (
          <TouchableOpacity
            key={c._id || idx}
            onPress={() => navigation.navigate('RecipientSignContractScreen', { contract: c })}
          >
            <View style={{ marginBottom: 12, backgroundColor: COLORS.card, padding: 12, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
              <Ionicons name="document-outline" size={20} color={COLORS.primary} style={{ marginBottom: 4 }} />
              <Text style={{ color: COLORS.text }}>Title: {c.title}</Text>
              <Text style={{ color: COLORS.text }}>Amount: ${c.amount}</Text>
              <Text style={{ color: COLORS.text }}>From: {c.originator?.name || c.originator?.email || 'Unknown'}</Text>
              <Text style={styles.partyLabel}>Party 1 (Originator):</Text>
              <Text>Name: {c.originator.name}</Text>
              <Text>Email: {c.originator.email}</Text>
              <Text>UUID: {c.originator.uuid}</Text>
              <Text>Role: {c.originator.role}</Text>
              {/* Show signature below role if present */}
              {c.signatures && c.signatures.length > 0 && (
                <Text>Signature: {c.signatures.find(s => s.email === c.originator.email)?.signature || 'Not signed yet'}</Text>
              )}
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 14,
                  borderRadius: 32,
                  marginTop: 10,
                  alignItems: 'center',
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 2,
                }}
                onPress={() => navigation.navigate('RecipientSignContractScreen', { contract: c })}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Review &amp; Sign</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = {
  partyLabel: {
    marginTop: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  contractCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 8,
  },
};
