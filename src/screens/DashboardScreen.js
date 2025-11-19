import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/BackButton';
import { useUser } from '../context/UserContext';
import { getWithAuth } from '../utils/api';

const CARD_MAX_HEIGHT = 400; // adjust as needed

export default function DashboardScreen({ navigation }) {
  const { user } = useUser();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter contracts by status logic
  const filteredContracts = contracts.filter(contract => {
    if (contract.status === 'draft') {
      // Only show to originator
      return contract.originator?.email === user.email;
    }
    if (contract.status === 'sent') {
      // Show to originator
      return contract.originator?.email === user.email;
    }
    if (contract.status === 'signed') {
      // Show to both originator and recipient
      const isOriginator = contract.originator?.email === user.email;
      const isRecipient = contract.recipient?.email === user.email;
      const visible = isOriginator || isRecipient;
      console.log(`[DashboardScreen] Contract ${contract._id} status: signed, isOriginator: ${isOriginator}, isRecipient: ${isRecipient}, visible: ${visible}`);
      return visible;
    }
    // Default: hide
    console.log(`[DashboardScreen] Contract ${contract._id} status: ${contract.status}, not visible to user: ${user.email}`);
    return false;
  });

  useEffect(() => {
    async function fetchContracts() {
      try {
        console.log('[DashboardScreen] Fetching contracts for user:', user.email);
        const res = await getWithAuth(`${process.env.API_BASE_URL}/api/contracts/dashboard?email=${user.email}`);
        console.log('[DashboardScreen] Contracts fetched:', res.data.contracts);
        setContracts(res.data.contracts || []);
      } catch (err) {
        setError('Failed to fetch contracts.');
        console.log('[DashboardScreen] Error fetching contracts:', err);
      }
      setLoading(false);
    }
    if (user?.email) fetchContracts();
  }, [user]);

  const renderContract = (item) => {
    const signatures = Array.isArray(item.signatures) ? item.signatures : [];
    const isOriginator = item.originator?.email?.toLowerCase() === user?.email?.toLowerCase();
    const canFundEscrow = item.status === 'signed' && isOriginator;

    return (
      <View style={styles.card}>
        {/* Scrollable body inside the card */}
        <View style={{ maxHeight: CARD_MAX_HEIGHT }}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            <Pressable
              onPress={() => {
                if (item.status === 'draft') {
                  navigation.navigate('OriginatorSignContractScreen', { contract: item });
                } else if (item.status === 'signed') {
                  navigation.navigate('PrintoutScreen', { contract: item });
                } else {
                  navigation.navigate('PreviewContract', { contract: item });
                }
              }}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.detail}>Amount: {item.amount}</Text>
              <Text style={styles.deadline}>
                Deadline: {new Date(item.deadline).toLocaleDateString()}
              </Text>
              <Text style={styles.detail}>
                Inspection Requirements: {item.inspectionRequirements}
              </Text>
              <Text style={styles.detail}>Penalties: {item.penalties}</Text>
              <Text style={styles.detail}>Milestones: {item.milestones}</Text>
              <Text style={styles.detail}>Clauses: {item.clauses}</Text>
              <Text style={styles.detail}>Dispute Clause: {item.disputeClause}</Text>
              <Text style={styles.detail}>Status: {item.status}</Text>
              <Text style={styles.detail}>Role(s): {item.roles?.join(', ')}</Text>
              <Text style={styles.detail}>
                Originator: {item.originator?.name} ({item.originator?.role})
              </Text>
              <Text style={styles.detail}>
                Originator Email: {item.originator?.email}
              </Text>
              <Text style={styles.detail}>
                Originator UUID: {item.originator?.uuid}
              </Text>
              <Text style={styles.detail}>
                Recipient: {item.recipient?.name} ({item.recipient?.role})
              </Text>
              <Text style={styles.detail}>
                Recipient Email: {item.recipient?.email}
              </Text>
              <Text style={styles.detail}>
                Recipient UUID: {item.recipient?.uuid}
              </Text>
              <Text style={styles.detail}>Signatures:</Text>
              {signatures.map((sig, idx) => (
                <View key={idx} style={{ marginLeft: 10 }}>
                  <Text>Name: {sig.name}</Text>
                  <Text>Role: {sig.role}</Text>
                  <Text>Signature: {sig.signature}</Text>
                  <Text>Date: {new Date(sig.date).toLocaleString()}</Text>
                </View>
              ))}
              <Text style={styles.detail}>
                Created At: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.detail}>
                Updated At: {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Fixed button row at bottom of card */}
        {item.status === 'draft' && (
          <TouchableOpacity
            style={{
              backgroundColor: '#4B7BEC',
              padding: 10,
              borderRadius: 8,
              marginTop: 8,
              alignItems: 'center',
            }}
            onPress={() => {
              navigation.navigate('EditContractScreen', { contract: item });
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Edit</Text>
          </TouchableOpacity>
        )}
        {canFundEscrow && (
          <TouchableOpacity
            style={{
              backgroundColor: '#34a853',
              padding: 10,
              borderRadius: 8,
              marginTop: 8,
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('Deposit', { contract: item })}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Proceed to Deposit</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderListItem = ({ item }) => (
    <View style={{ marginBottom: 12 }}>
      {renderContract(item)}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#4B7BEC" /></View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}><Text style={{ color: 'red' }}>{error}</Text></View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={filteredContracts}
        keyExtractor={item => item._id}
        renderItem={renderListItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={(
          <>
            <BackButton />
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>My Contracts</Text>
          </>
        )}
        ListEmptyComponent={<Text>No contracts found.</Text>}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  detail: { fontSize: 14, color: '#333', marginBottom: 2 },
});
