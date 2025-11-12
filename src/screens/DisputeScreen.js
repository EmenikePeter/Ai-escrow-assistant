import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { COLORS } from '../constants/Theme';
import { validateColor } from '../utils/colorValidator';
import { generateClause } from '../utils/openAI';
import { addItem, getItem, setItem } from '../utils/storage';


export default function DisputeScreen({ route }) {
    validateColor(COLORS.primary, 'COLORS.primary');
    validateColor(COLORS.text, 'COLORS.text');
    validateColor(COLORS.background, 'COLORS.background');
    validateColor(COLORS.card, 'COLORS.card');
    validateColor(COLORS.error, 'COLORS.error');
    // Validate all hardcoded color values used in inline styles
    validateColor('#000', 'DisputeCard.shadowColor');
    validateColor('#ccc', 'DisputeInput.borderColor fallback');
    validateColor('red', 'ErrorText.color');
    validateColor('#F5F6FA', 'AIOption.backgroundColor');
  validateColor('#28a745', 'AIOptionButton.color fallback');
  validateColor('#007bff', 'AISuggestionButton.color fallback');
  const contract = route?.params?.contract;
  const [issue, setIssue] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOptions, setAiOptions] = useState([]);
  const [error, setError] = useState('');
  if (!contract) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No contract selected.</Text>
      </View>
    );
  }

  const submitDispute = async () => {
    if (!issue) return Alert.alert('Error', 'Please describe the issue.');

    const dispute = {
      id: Date.now().toString(),
      contractId: contract.id,
      issue,
    };

    await addItem('disputes', dispute);
    Alert.alert('Dispute Submitted', `Your dispute about "${contract.title}" has been recorded.`);
    setIssue('');
  };

  const getAISuggestions = async () => {
    setAiLoading(true);
    setError('');
    setAiOptions([]);
    try {
      // Use OpenAI to generate compromise options
      const prompt = `Contract dispute: ${issue}. Suggest 2-3 compromise options (e.g., extend deadline, partial payment) for both parties.`;
      const response = await generateClause('Dispute Resolution', prompt);
      // Assume response is a string with options separated by newlines or commas
      const options = response.split(/\n|,/).map(opt => opt.trim()).filter(Boolean);
      setAiOptions(options);
    } catch (_err) {
      setError('Failed to get AI suggestions.');
    }
    setAiLoading(false);
  };

  const agreeOption = async (option) => {
    // Example: parse option and update contract locally
    let updatedContract = { ...contract };
    if (option.toLowerCase().includes('extend deadline')) {
      // Extend deadline by 3 days
      const d = new Date(contract.deadline);
      d.setDate(d.getDate() + 3);
      updatedContract.deadline = d.toISOString().slice(0, 10);
    } else if (option.toLowerCase().includes('partial payment')) {
      // Reduce amount by 20% as example
      updatedContract.amount = Math.round(contract.amount * 0.8);
    }
    // Save updated contract locally
    let contracts = await getItem('contracts');
    contracts = contracts.map(c => c.id === contract.id ? updatedContract : c);
    await setItem('contracts', contracts);
    Alert.alert('Agreement Applied', `Contract updated: ${option}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackButton />
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="alert-circle-outline" size={36} color={COLORS.error || COLORS.primary} />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 }}>Dispute</Text>
      </View>
      <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
        <Text style={{ color: COLORS.text }}>Contract: {contract.title}</Text>
        <TextInput
          value={issue}
          onChangeText={setIssue}
          placeholder="Describe your issue"
          multiline
          style={{ borderWidth: 1, borderColor: COLORS.border || '#ccc', padding: 10, marginVertical: 20, borderRadius: 8, minHeight: 80, color: COLORS.text, backgroundColor: COLORS.input || COLORS.background }}
        />
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="send-outline" size={24} color={COLORS.primary} style={{ marginBottom: 8 }} />
          <Button title="Submit Dispute" color={COLORS.primary} onPress={submitDispute} />
        </View>
        <Button title={aiLoading ? 'Getting AI Suggestion...' : 'Get AI Suggestion'} color={COLORS.secondary || '#007bff'} onPress={getAISuggestions} disabled={aiLoading || !issue} />
        {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}
        {aiOptions.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8, color: COLORS.primary }}>AI Compromise Options:</Text>
            {aiOptions.map((opt, idx) => (
              <View key={idx} style={{ marginBottom: 8, backgroundColor: '#F5F6FA', borderRadius: 8, padding: 10 }}>
                <Text style={{ color: COLORS.text }}>{opt}</Text>
                <Button title="Agree" color={COLORS.success || '#28a745'} onPress={() => agreeOption(opt)} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
