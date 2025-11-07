import { API_BASE_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Theme';
import { useUser } from '../context/UserContext';
import { postWithAuth } from '../utils/api';
import { validateColor } from '../utils/colorValidator';

const PreviewContractScreen = ({ navigation, route }) => {
  // Removed duplicate handleSaveDraft function
  const userContext = useUser();
  const user = userContext?.user || {};
  useEffect(() => {
    validateColor(COLORS.primary, 'COLORS.primary');
    validateColor(COLORS.text, 'COLORS.text');
    validateColor(COLORS.background, 'COLORS.background');
    validateColor(COLORS.card, 'COLORS.card');
    validateColor(COLORS.border, 'COLORS.border');
    // Validate all hardcoded color values used in inline styles
    validateColor('#fff', 'ContractCard.backgroundColor');
    validateColor('#000', 'ContractCard.shadowColor');
    // Do NOT send contract to backend on mount
  }, []);

  // Add missing state and contract variable
  const [editing, setEditing] = useState(false);
  const [contract, setContract] = useState(route.params?.contract || {
  originator: { name: '', email: '', uuid: '' },
  recipient: { name: '', email: '', uuid: '' },
    title: '',
    description: '',
    amount: '',
    inspectionRequirements: [],
    penalties: [],
    milestones: [],
    deadline: '',
    clauses: [],
    disputeClause: '',
  });

  const handleSaveDraft = async () => {
    try {
      // Prepare contract data with all fields and status 'draft'
      const contractData = {
        ...contract,
        status: 'draft'
      };
      // Always trim originator and recipient name/email before sending
      if (contractData.originator) {
        contractData.originator.name = contractData.originator.name?.trim();
        contractData.originator.email = contractData.originator.email?.trim();
      }
      if (contractData.recipient) {
        contractData.recipient.name = contractData.recipient.name?.trim();
        contractData.recipient.email = contractData.recipient.email?.trim();
      }
      console.log('[Save Draft] Sending contract data:', contractData);
      const response = await postWithAuth(`${API_BASE_URL}/api/contracts/draft`, contractData);
      alert('Contract draft saved!');
      navigation.goBack();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        alert('Failed to save contract draft: ' + err.response.data.error);
        console.log('[Save Draft] Backend error:', err.response.data);
      } else {
        alert('Failed to save contract draft.');
        console.log('[Save Draft] Error:', err);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: 'white' }}>
      <View>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="document-text-outline" size={36} color={'blue'} />
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'blue', marginTop: 8 }}>Contract Preview</Text>
        </View>
        {/* Contract Sheet Preview */}
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: 'gray', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          {/* Top: Originator info */}
          <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'navy' }}>Party 1 (Originator):</Text>
              <Text>Name: {contract.originator?.name || '_________'}</Text>
              <Text>Email: {contract.originator?.email || '_________'}</Text>
              <Text>UUID: {contract.originator?.uuid || '_________'}</Text>
              <Text>Role: {contract.originator.role}</Text>
              {/* Show signature below role if present */}
              {contract.signatures && contract.signatures.length > 0 && (
                <Text>Signature: {contract.signatures.find(s => s.email === contract.originator.email)?.signature || 'Not signed yet'}</Text>
              )}
          </View>
          {/* Middle: Recipient info */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'navy' }}>Party 2 (Recipient):</Text>
            <Text>Name: {contract.recipient?.name || '_________'}</Text>
            <Text>Email: {contract.recipient?.email || '_________'}</Text>
            <Text>UUID: {contract.recipient?.uuid || '_________'}</Text>
            {contract.recipient?.role && <Text>Role: {contract.recipient.role}</Text>}
          </View>
          {/* Contract details */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: 'navy' }}>Contract Details:</Text>
            <Text>Title: {contract.title}</Text>
            <Text>Description: {contract.description}</Text>
            <Text>Amount: ${contract.amount}</Text>
            <Text>Deadline: {contract.deadline}</Text>
            <Text>
              Inspection Requirements: {Array.isArray(contract.inspectionRequirements) && contract.inspectionRequirements.length > 0
                ? contract.inspectionRequirements.join(', ')
                : 'None specified.'}
            </Text>
            <Text>
              Penalties: {Array.isArray(contract.penalties) && contract.penalties.length > 0
                ? contract.penalties.join(', ')
                : 'None specified.'}
            </Text>
            <Text>
              Milestones: {Array.isArray(contract.milestones) && contract.milestones.length > 0
                ? contract.milestones.join(', ')
                : 'None specified.'}
            </Text>
            <Text>Clauses:</Text>
            {Array.isArray(contract.clauses) && contract.clauses.length > 0 ? (
              contract.clauses.map((clause, idx) => (
                <Text key={idx} style={{ marginLeft: 8, color: 'maroon' }}>• {clause}</Text>
              ))
            ) : (
              <Text style={{ marginLeft: 8 }}>No clauses specified.</Text>
            )}
            {contract.disputeClause && (
              <Text style={{ marginTop: 8, color: 'purple' }}>Dispute Clause: {contract.disputeClause}</Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.primary,
              paddingVertical: 14,
              borderRadius: 32,
              marginRight: 8,
              alignItems: 'center',
              opacity: editing ? 0.7 : 1,
            }}
            onPress={handleSaveDraft}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.primary,
              paddingVertical: 14,
              borderRadius: 32,
              marginLeft: 8,
              alignItems: 'center',
              opacity: editing ? 0.7 : 1,
            }}
            onPress={() => navigation.navigate('EditContractScreen', { contract })}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default PreviewContractScreen;
