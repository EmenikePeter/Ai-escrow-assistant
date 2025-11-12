import { API_BASE_URL } from '@env';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { COLORS } from '../constants/Theme';

// Use API_BASE_URL from .env

export default function PayoutHistoryScreen({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [filter, setFilter] = useState('all');
  const userUuid = route?.params?.uuid;

  useEffect(() => {
    async function fetchPayouts() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/payouts?uuid=${userUuid}`);
        setPayouts(res.data.payouts || []);
      } catch (err) {
        Alert.alert('Error', err.message);
      }
      setLoading(false);
    }
    fetchPayouts();
  }, [userUuid]);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: 'white' }}>
      <BackButton goBack={navigation.goBack} />
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16 }}>Payout History</Text>
      <View style={{ flexDirection: 'row', marginVertical: 12 }}>
        <Button title="All" onPress={() => setFilter('all')} color={filter === 'all' ? 'blue' : 'gray'} />
        <Button title="Pending" onPress={() => setFilter('pending')} color={filter === 'pending' ? 'blue' : 'gray'} />
        <Button title="Completed" onPress={() => setFilter('completed')} color={filter === 'completed' ? 'blue' : 'gray'} />
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> : (
        <FlatList
          data={payouts.filter(p => filter === 'all' ? true : p.status === filter)}
          keyExtractor={item => `${item.payoutId}-${item.createdAt}`}
          renderItem={({ item }) => (
            <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Amount: ${item.amount}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Date: {new Date(item.createdAt).toLocaleString()}</Text>
              <Text>Payout ID: {item.payoutId}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: 'gray', marginTop: 32 }}>No payouts found.</Text>}
        />
      )}
    </View>
  );
}
