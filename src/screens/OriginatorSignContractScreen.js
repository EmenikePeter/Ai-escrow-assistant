import { API_BASE_URL } from '@env';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

export default function OriginatorSignContractScreen({ route, navigation }) {
  const [role, setRole] = useState(ROLE_OPTIONS[0].value);
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const contract = route.params?.contract || {};

  const updateRole = (value) => {
    console.log('[SignContract] Role selected:', value);
    setRole(value);
  };

  const handleSignAndSend = async () => {
    if (!signature.trim()) {
      console.log('[SignContract] Missing signature:', signature);
      Alert.alert('Error', 'Please type your name as signature.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        contractId: contract._id,
    selectedRole: role, // Send as selectedRole for backend compatibility
        signature,
        userId: user?.id || user?._id,
      };
      console.log('[SignContract] Sending contract data:', payload);
  const response = await postWithAuth(`${API_BASE_URL}/api/contracts/sign`, payload);
      console.log('[SignContract] Response:', response);
      Alert.alert('Success', 'Contract signed and sent to recipient.');
      navigation.goBack();
    } catch (error) {
      console.log('[SignContract] Error:', error);
      Alert.alert('Error', 'Failed to sign contract.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          <View>
            <View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Sign Contract (Originator)</Text>
              {/* Contract Preview Section */}
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#0057FF', textAlign: 'center', marginVertical: 20 }}>Contract Preview</Text>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Party 1 (Originator):</Text>
                <Text>Name: {contract.originator?.name}</Text>
                <Text>Email: {contract.originator?.email}</Text>
                <Text>UUID: {contract.originator?.uuid}</Text>
                {contract.signatures?.originator && (
                  <Text>Signature: {contract.signatures.originator}</Text>
                )}
              </View>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>Party 2 (Recipient):</Text>
                <View>
                  <Text>Name: {contract.recipient?.name}</Text>
                  <Text>Email: {contract.recipient?.email}</Text>
                  <Text>UUID: {contract.recipient?.uuid}</Text>
                </View>
                {contract.signatures?.recipient && (
                  <Text>Signature: {contract.signatures.recipient}</Text>
                )}
              </View>
              <View style={{ marginBottom: 12 }}>
                <View>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>Contract Details:</Text>
                  <Text>Title: {contract.title}</Text>
                  <Text>Description: {contract.description}</Text>
                  <Text>Amount: ${contract.amount}</Text>
                  <Text>Deadline: {contract.deadline}</Text>
                  <Text>Clauses:</Text>
                  <Text style={{ color: 'red', marginLeft: 10 }}>• {contract.disputeClause}</Text>
                </View>
              </View>
              {/* Signing UI */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ marginBottom: 8, marginTop: 24 }}>Select your role for this contract:</Text>
                <Picker
                  selectedValue={role}
                  onValueChange={updateRole}
                  style={{ marginBottom: 16 }}
                >
                  {ROLE_OPTIONS.map(opt => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
                <TextInput
                  placeholder="Type your name as signature"
                  value={signature}
                  onChangeText={text => {
                    console.log('[SignContract] Signature input:', text);
                    setSignature(text);
                  }}
                  style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 }}
                />
              </View>
            </View>
          </View>
        </ScrollView>
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: 24 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#2979FF', borderRadius: 6, padding: 16 }}
            onPress={handleSignAndSend}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              {loading ? 'Signing...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
