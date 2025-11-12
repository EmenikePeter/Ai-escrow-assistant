import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { COLORS } from '../constants/Theme';
import { putWithAuth } from '../utils/api';

const EditContractScreen = ({ navigation, route }) => {
  const contract = route.params?.contract || {};
  const [title, setTitle] = useState(contract.title || '');
  const [description, setDescription] = useState(contract.description || '');
  const [amount, setAmount] = useState(contract.amount || '');
  const [deadline, setDeadline] = useState(contract.deadline || '');
  const [inspectionInput, setInspectionInput] = useState('');
  const [inspectionRequirements, setInspectionRequirements] = useState(contract.inspectionRequirements || []);
  const [penaltyInput, setPenaltyInput] = useState('');
  const [penalties, setPenalties] = useState(contract.penalties || []);
  const [milestoneInput, setMilestoneInput] = useState('');
  const [milestones, setMilestones] = useState(contract.milestones || []);
  const [clauses, setClauses] = useState(contract.clauses || []);
  const [disputeClause, setDisputeClause] = useState(contract.disputeClause || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateContract = async () => {
    setLoading(true);
    setError('');
    try {
      const updatedContract = {
        ...contract,
        title,
        description,
        amount,
        deadline,
        inspectionRequirements,
        penalties,
        milestones,
        clauses,
        disputeClause,
        status: 'draft', // keep as draft until sent
      };
      // PATCH/PUT to backend
      await putWithAuth(`${process.env.API_BASE_URL}/api/contracts/${contract._id}`, updatedContract); // Use PUT for update
      Alert.alert('Success', 'Contract updated!');
      navigation.goBack();
    } catch (err) {
      setError('Failed to update contract.');
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: 'white' }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16 }}>Edit Contract</Text>
        {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}
        <Text>Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 8 }} />
        <Text>Description</Text>
        <TextInput value={description} onChangeText={setDescription} style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 8 }} multiline />
        <Text>Amount</Text>
        <TextInput value={amount.toString()} onChangeText={setAmount} style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 8 }} keyboardType="numeric" />
        <Text>Deadline</Text>
        <TextInput value={deadline} onChangeText={setDeadline} style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 8 }} placeholder="YYYY-MM-DD" />
        <Text>Inspection Requirements</Text>
        <View style={{ marginBottom: 8 }}>
          <TextInput placeholder="Add inspection requirement" value={inspectionInput} onChangeText={setInspectionInput} style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 4 }} />
          <Button title="Add" onPress={() => { if (inspectionInput.trim()) { setInspectionRequirements([...inspectionRequirements, inspectionInput.trim()]); setInspectionInput(''); } }} />
          {inspectionRequirements.length > 0 && inspectionRequirements.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ flex: 1 }}>{item}</Text>
              <TouchableOpacity onPress={() => setInspectionRequirements(inspectionRequirements.filter((_, i) => i !== idx))}>
                <Ionicons name="close-circle" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Text>Penalties</Text>
        <View style={{ marginBottom: 8 }}>
          <TextInput placeholder="Add penalty" value={penaltyInput} onChangeText={setPenaltyInput} style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 4 }} />
          <Button title="Add" onPress={() => { if (penaltyInput.trim()) { setPenalties([...penalties, penaltyInput.trim()]); setPenaltyInput(''); } }} />
          {penalties.length > 0 && penalties.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ flex: 1 }}>{item}</Text>
              <TouchableOpacity onPress={() => setPenalties(penalties.filter((_, i) => i !== idx))}>
                <Ionicons name="close-circle" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Text>Milestones</Text>
        <View style={{ marginBottom: 8 }}>
          <TextInput placeholder="Add milestone" value={milestoneInput} onChangeText={setMilestoneInput} style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 4 }} />
          <Button title="Add" onPress={() => { if (milestoneInput.trim()) { setMilestones([...milestones, milestoneInput.trim()]); setMilestoneInput(''); } }} />
          {milestones.length > 0 && milestones.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ flex: 1 }}>{item}</Text>
              <TouchableOpacity onPress={() => setMilestones(milestones.filter((_, i) => i !== idx))}>
                <Ionicons name="close-circle" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Text>Clauses</Text>
        {clauses.map((clause, idx) => <Text key={idx} style={{ marginVertical: 4 }}>• {clause}</Text>)}
        <Text>Dispute Clause</Text>
        <TextInput value={disputeClause} onChangeText={setDisputeClause} style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 8 }} />
        <TouchableOpacity style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: 32, alignItems: 'center', marginTop: 16 }} onPress={handleUpdateContract} disabled={loading}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default EditContractScreen;
