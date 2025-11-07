import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { COLORS } from '../constants/Theme';
import { validateColor } from '../utils/colorValidator';

export default function DisputeDetailScreen({ route }) {

  useEffect(() => {
      validateColor(COLORS.primary, 'COLORS.primary');
      validateColor(COLORS.text, 'COLORS.text');
      validateColor(COLORS.background, 'COLORS.background');
      validateColor(COLORS.card, 'COLORS.card');
      validateColor(COLORS.error, 'COLORS.error');
      // Validate all hardcoded color values used in inline styles
      validateColor('#f00', 'WarningIcon.color fallback');
  }, []);
  const { dispute } = route.params;
  if (!dispute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No dispute selected.</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: COLORS.background }}>
      <Ionicons name="warning-outline" size={32} color={COLORS.error || '#f00'} style={{ marginBottom: 16 }} />
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.error, marginBottom: 12 }}>Dispute Details</Text>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>Contract ID: {dispute.contractId}</Text>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>Issue: {dispute.issue}</Text>
      {/* Add more details as needed */}
    </View>
  );
}
