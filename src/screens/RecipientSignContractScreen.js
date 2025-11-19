import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { useUser } from '../context/UserContext';
import { postWithAuth } from '../utils/api';

const ROLE_OPTIONS = [
  { label: 'Client', value: 'client' },
  { label: 'Freelancer', value: 'freelancer' },
  { label: 'Hiring', value: 'hiring' },
  { label: 'Offering Services', value: 'offering_services' },
  { label: 'Buyer', value: 'buyer' },
  { label: 'Seller', value: 'seller' },
  { label: 'Agent', value: 'agent' },
  { label: 'Others', value: 'others' },
];

export default function RecipientSignContractScreen({ route, navigation }) {
  const contract = route.params?.contract;
  const { user } = useUser();
  const [role, setRole] = useState('client');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const webScrollHeight = Platform.OS === 'web' ? Math.max(windowHeight - 120, 360) : undefined;

  if (!contract) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 18 }}>Error: No contract data found.</Text>
      </View>
    );
  }

  const handleSign = async (actionType = 'accept') => {
    if (!signature.trim()) {
      Alert.alert('Error', 'Please type your name as signature.');
      return;
    }
    setLoading(true);
    try {
      const contractData = {
        contractId: contract._id,
        selectedRole: role, // Send as selectedRole for backend compatibility
        signature,
        action: actionType,
      };
      await postWithAuth(`${process.env.API_BASE_URL}/api/contracts/sign`, contractData);
      const successMessage = actionType === 'accept'
        ? 'Contract signed and sent to originator.'
        : 'Contract declined.';
      Alert.alert('Success', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            if (actionType === 'accept') {
              navigation.navigate('Dashboard');
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', `Failed to ${actionType === 'accept' ? 'sign and send' : 'decline'} contract.`);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}) }}>
      <BackButton />
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff', ...(webScrollHeight ? { height: webScrollHeight, maxHeight: webScrollHeight } : {}) }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator
      >
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Sign Contract (Recipient)</Text>

        {/* Contract Preview Section */}
        <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#0057FF', textAlign: 'center', marginVertical: 20 }}>
          Contract Preview
        </Text>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Party 1 (Originator):</Text>
          <Text>Name: {contract.originator?.name}</Text>
          <Text>Email: {contract.originator?.email}</Text>
          <Text>UUID: {contract.originator?.uuid}</Text>
          <Text>Role: {contract.originator?.role || 'N/A'}</Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>Party 2 (Recipient):</Text>
          <Text>Name: {contract.recipient?.name}</Text>
          <Text>Email: {contract.recipient?.email}</Text>
          <Text>UUID: {contract.recipient?.uuid}</Text>
          <Text>Role: {contract.recipient?.role || 'N/A'}</Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>Contract Details:</Text>
          <Text>Title: {contract.title || 'N/A'}</Text>
          <Text>Description: {contract.description || 'N/A'}</Text>
          <Text>Amount: {typeof contract.amount === 'number' ? `$${contract.amount}` : contract.amount || 'N/A'}</Text>
          <Text>Deadline: {contract.deadline || 'N/A'}</Text>
          <Text>Status: {contract.status || 'N/A'}</Text>
          <Text>Created At: {contract.createdAt ? new Date(contract.createdAt).toLocaleString() : 'N/A'}</Text>
          <Text>Updated At: {contract.updatedAt ? new Date(contract.updatedAt).toLocaleString() : 'N/A'}</Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Clauses:</Text>
          {Array.isArray(contract.clauses) && contract.clauses.length > 0 ? (
            contract.clauses.map((clause, idx) => (
              <Text key={`clause-${idx}`} style={{ marginLeft: 10 }}>• {clause}</Text>
            ))
          ) : (
            <Text style={{ marginLeft: 10 }}>No clauses specified.</Text>
          )}
          <Text style={{ marginTop: 8 }}>Dispute Clause:</Text>
          <Text style={{ marginLeft: 10, color: contract.disputeClause ? 'red' : '#333' }}>
            {contract.disputeClause || 'None provided.'}
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Penalties:</Text>
          {Array.isArray(contract.penalties) && contract.penalties.length > 0 ? (
            contract.penalties.map((penalty, idx) => (
              <Text key={`penalty-${idx}`} style={{ marginLeft: 10 }}>• {typeof penalty === 'string' ? penalty : JSON.stringify(penalty)}</Text>
            ))
          ) : (
            <Text style={{ marginLeft: 10 }}>No penalties listed.</Text>
          )}
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Milestones:</Text>
          {Array.isArray(contract.milestones) && contract.milestones.length > 0 ? (
            contract.milestones.map((milestone, idx) => (
              <Text key={`milestone-${idx}`} style={{ marginLeft: 10 }}>• {typeof milestone === 'string' ? milestone : JSON.stringify(milestone)}</Text>
            ))
          ) : (
            <Text style={{ marginLeft: 10 }}>No milestones listed.</Text>
          )}
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Inspection Requirements:</Text>
          {Array.isArray(contract.inspectionRequirements) && contract.inspectionRequirements.length > 0 ? (
            contract.inspectionRequirements.map((item, idx) => (
              <Text key={`inspection-${idx}`} style={{ marginLeft: 10 }}>• {item}</Text>
            ))
          ) : (
            <Text style={{ marginLeft: 10 }}>No inspection requirements specified.</Text>
          )}
        </View>

        {/* Signing UI */}
        <Text style={{ marginBottom: 8, marginTop: 24 }}>Select your role for this contract:</Text>
        <Picker
          selectedValue={role}
          onValueChange={setRole}
          style={{ marginBottom: 16 }}
        >
          {ROLE_OPTIONS.map(opt => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
        <TextInput
          placeholder="Type your name as signature"
          value={signature}
          onChangeText={setSignature}
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 24 }}>
          <TouchableOpacity
            style={{ flex: 1, marginRight: 8, backgroundColor: '#2979FF', borderRadius: 6, padding: 12 }}
            onPress={() => handleSign('accept')}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>{loading ? 'Signing...' : 'Accept, Sign & Send'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, marginLeft: 8, backgroundColor: '#ccc', borderRadius: 6, padding: 12 }}
            onPress={() => handleSign('decline')}
            disabled={loading}
          >
            <Text style={{ color: '#333', fontWeight: 'bold', textAlign: 'center' }}>{loading ? 'Declining...' : 'Decline'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
