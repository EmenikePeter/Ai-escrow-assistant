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

export default function RecipientSignContractScreen({ route, navigation }) {
  const contract = route.params?.contract;
  const { user } = useUser();
  const [role, setRole] = useState('client');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Success', `Contract ${actionType === 'accept' ? 'signed and sent to originator' : 'declined'}.`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', `Failed to ${actionType === 'accept' ? 'sign and send' : 'decline'} contract.`);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Sign Contract (Recipient)</Text>

      {/* Contract Preview Section */}
      <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#0057FF', textAlign: 'center', marginVertical: 20 }}>
        Contract Preview
      </Text>
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Party 1 (Originator):</Text>
      <Text>Name: {contract.originator?.name}</Text>
      <Text>Email: {contract.originator?.email}</Text>
      <Text>UUID: {contract.originator?.uuid}</Text>
        <Text>Role: {contract.originator?.role}</Text>
        {/* Show signature below role if present */}
        {contract.signatures && contract.signatures.length > 0 && (
          <Text>Signature: {contract.signatures.find(s => s.email === contract.originator.email)?.signature || 'Not signed yet'}</Text>
        )}
      {contract.signatures?.originator && (
        <Text>Signature: {contract.signatures.originator}</Text>
      )}
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>Party 2 (Recipient):</Text>
      <Text>Name: {contract.recipient?.name}</Text>
      <Text>Email: {contract.recipient?.email}</Text>
      <Text>UUID: {contract.recipient?.uuid}</Text>
      {/* Show recipient's selected role from signatures array */}
      {contract.signatures && contract.signatures.length > 0 && (
        <Text>Role: {contract.signatures.find(s => s.email === contract.recipient.email)?.role || 'Not selected'}</Text>
      )}
      {/* Show recipient's signature */}
      {contract.signatures && contract.signatures.length > 0 && (
        <Text>Signature: {contract.signatures.find(s => s.email === contract.recipient.email)?.signature || 'Not signed yet'}</Text>
      )}
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>Contract Details:</Text>
      <Text>Title: {contract.title}</Text>
      <Text>Description: {contract.description}</Text>
      <Text>Amount: ${contract.amount}</Text>
      <Text>Deadline: {contract.deadline}</Text>
      <Text>Clauses:</Text>
      {contract.clauses && contract.clauses.length > 0 ? (
        contract.clauses.map((clause, idx) => (
          <Text key={idx} style={{ marginLeft: 10 }}>• {clause}</Text>
        ))
      ) : (
        <Text style={{ marginLeft: 10 }}>No clauses specified.</Text>
      )}
      <Text>Dispute Clause:</Text>
      <Text style={{ color: 'red', marginLeft: 10 }}>{contract.disputeClause ? contract.disputeClause : 'None specified.'}</Text>

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
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
  );
}
