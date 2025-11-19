import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/BackButton';
import { API_BASE_URL } from '../config/env';
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
      await postWithAuth(`${API_BASE_URL}/api/contracts/draft`, contractData);
      Alert.alert(
        'Success',
        'Contract draft saved!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ],
        { cancelable: false },
      );
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

  const footerPaddingVertical = Platform.select({ web: 24, ios: 24, default: 16 });
  const footerHeight = 64 + footerPaddingVertical * 2; // button height + padding for scroll inset
  const windowHeight = useWindowDimensions().height || 0;
  const isWeb = Platform.OS === 'web';
  const scrollableHeight = isWeb ? Math.max(windowHeight - footerHeight, 320) : undefined;

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: 'white', position: 'relative' },
        isWeb && {
          height: windowHeight,
          maxHeight: windowHeight,
          overflow: 'hidden'
        }
      ]}
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;
        if (__DEV__) {
          console.log('[PreviewContract] SafeAreaView layout', { width, height });
        }
      }}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          style={[
            { flex: 1 },
            isWeb && scrollableHeight ? { height: scrollableHeight, maxHeight: scrollableHeight } : null
          ]}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 32 + footerHeight,
            flexGrow: 1,
            width: '100%',
            maxWidth: 960,
            alignSelf: 'center',
            minHeight: isWeb && scrollableHeight ? scrollableHeight : undefined
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ right: 1 }}
          nestedScrollEnabled
          onLayout={({ nativeEvent }) => {
            const { width, height } = nativeEvent.layout;
            if (__DEV__) {
              console.log('[PreviewContract] ScrollView layout', { width, height });
            }
          }}
          onContentSizeChange={(width, height) => {
            if (__DEV__) {
              console.log('[PreviewContract] ScrollView content size', { width, height });
            }
          }}
        >
          <BackButton />
          <View
            onLayout={({ nativeEvent }) => {
              if (__DEV__) {
                console.log('[PreviewContract] Content wrapper layout', nativeEvent.layout);
              }
            }}
          >
            <View style={{alignItems: 'center', marginBottom: 16}}>
              <Ionicons name="document-text-outline" size={36} color={'blue'} />
              <Text style={{fontSize: 22, fontWeight: 'bold', color: 'blue', marginTop: 8}}>Contract Preview</Text>
            </View>
            {/* Contract Sheet Preview */}
            <View style={{backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: 'gray', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4}}>
              {/* Top: Originator info */}
              <View style={{marginBottom: 12}}>
                  <Text style={{fontWeight: 'bold', fontSize: 16, color: 'navy'}}>Party 1 (Originator):</Text>
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
                <Text style={{fontWeight: 'bold', fontSize: 16, color: 'navy'}}>Party 2 (Recipient):</Text>
                <Text>Name: {contract.recipient?.name || '_________'}</Text>
                <Text>Email: {contract.recipient?.email || '_________'}</Text>
                <Text>UUID: {contract.recipient?.uuid || '_________'}</Text>
                {contract.recipient?.role && <Text>Role: {contract.recipient.role}</Text>}
              </View>
              {/* Contract details */}
              <View style={{marginBottom: 12}}>
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
                    <Text key={idx} style={{marginLeft: 8, color: 'maroon'}}>• {clause}</Text>
                  ))
                ) : (
                  <Text style={{marginLeft: 8}}>No clauses specified.</Text>
                )}
                {contract.disputeClause && (
                  <Text style={{marginTop: 8, color: 'purple'}}>Dispute Clause: {contract.disputeClause}</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingVertical: footerPaddingVertical,
          borderTopWidth: 1,
          borderColor: '#edf0f5',
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOpacity: Platform.OS === 'web' ? 0.08 : 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 6,
          zIndex: 50
        }}
      >
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.primary,
              paddingVertical: 14,
              borderRadius: 32,
              alignItems: 'center',
              opacity: editing ? 0.7 : 1,
            }}
            onPress={handleSaveDraft}
          >
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.primary,
              paddingVertical: 14,
              borderRadius: 32,
              alignItems: 'center',
              opacity: editing ? 0.7 : 1,
            }}
            onPress={() => navigation.navigate('EditContractScreen', {contract})}
          >
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PreviewContractScreen;
