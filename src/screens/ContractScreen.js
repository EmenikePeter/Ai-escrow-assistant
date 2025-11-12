import { API_BASE_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Theme';
import { useUser } from '../context/UserContext';
import { getWithAuth, postWithAuth } from '../utils/api';
import { validateColor } from '../utils/colorValidator';
import { generateClause } from '../utils/openAI';

const LANGUAGES = [
  'English', 'French', 'Spanish', 'German', 'Chinese', 'Arabic', 'Hindi', 'Portuguese', 'Russian',
  'Swahili', 'Yoruba', 'Igbo', 'Amharic', 'Zulu', 'Hausa', 'Somali', 'Shona', 'Afrikaans', 'Tigrinya',
  'Wolof', 'Kinyarwanda', 'Lingala', 'Akan', 'Berber', 'Bemba', 'Fula', 'Malagasy', 'Oromo', 'Tswana',
  'Xhosa', 'Bambara', 'Ewe', 'Kikuyu', 'Luganda', 'Mandinka', 'Mossi', 'Sango', 'Sotho', 'Twi',
  'Urdu', 'Turkish', 'Italian', 'Dutch', 'Polish', 'Czech', 'Greek', 'Hungarian', 'Romanian', 'Bulgarian',
  'Serbian', 'Croatian', 'Slovak', 'Slovenian', 'Finnish', 'Swedish', 'Norwegian', 'Danish', 'Icelandic',
  'Estonian', 'Latvian', 'Lithuanian', 'Ukrainian', 'Belarusian', 'Georgian', 'Armenian', 'Hebrew', 'Persian',
  'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino', 'Korean', 'Japanese', 'Mongolian', 'Khmer', 'Lao',
  'Pashto', 'Nepali', 'Sinhala', 'Bengali', 'Punjabi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Marathi',
  'Urhobo', 'Fijian', 'Samoan', 'Tongan', 'Maori', 'Haitian Creole', 'Javanese', 'Sundanese', 'Burmese', 'Tibetan',
  // Add more as needed for 70+
];

// Define buttonStyles at the top level of the file
// Utility to get button color by type and disabled state
function getButtonColor(type = 'primary', disabled = false) {
  if (disabled) {
    validateColor(COLORS.disabled, 'COLORS.disabled');
    return COLORS.disabled || '#ccc';
  }
  switch (type) {
    case 'primary':
      validateColor(COLORS.primary, 'COLORS.primary');
      return COLORS.primary || '#007bff';
    case 'info':
      validateColor(COLORS.info, 'COLORS.info');
      return COLORS.info || '#17a2b8';
    case 'warning':
      validateColor(COLORS.warning, 'COLORS.warning');
      return COLORS.warning || '#ffc107';
    case 'danger':
      validateColor(COLORS.danger, 'COLORS.danger');
      return COLORS.danger || '#dc3545';
    default:
      validateColor(COLORS.primary, 'COLORS.primary');
      return COLORS.primary || '#007bff';
  }
}
const buttonStyles = {
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    paddingVertical: 14,
    marginVertical: 8,
    marginHorizontal: 0,
    shadowColor: 'transparent',
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  icon: {
    marginRight: 10,
  },
};

// Use API_BASE_URL from .env

export default function ContractScreen({ navigation }) {
  // Recipient search state
  //const [searchValue, setSearchValue] = useState('');
  //const [searchResult, setSearchResult] = useState(null);

  const handleSearchRecipient = async () => {
    try {
  const res = await getWithAuth(`${API_BASE_URL}/api/users/search?query=${searchValue}`);
      if (res.data.user) {
        setSearchResult(res.data.user);
        setSelectedRecipient(res.data.user);
        setRecipientUuid(res.data.user.uuid);
      } else {
        setSearchResult(null);
      }
    } catch (err) {
      setSearchResult(null);
    }
  };
  const userContext = useUser();
    const user = userContext.user || {};
  useEffect(() => {
    // Validate all major color usages in render styles
    validateColor(COLORS.border, 'COLORS.border');
    validateColor(COLORS.text, 'COLORS.text');
    validateColor(COLORS.primary, 'COLORS.primary');
    validateColor(COLORS.info, 'COLORS.info');
    validateColor(COLORS.warning, 'COLORS.warning');
    validateColor(COLORS.danger, 'COLORS.danger');
    validateColor(COLORS.card, 'COLORS.card');
    validateColor(COLORS.background, 'COLORS.background');
    validateColor(COLORS.disabled, 'COLORS.disabled');
    validateColor(COLORS.error, 'COLORS.error');
    validateColor(COLORS.input, 'COLORS.input');
    // Validate all hardcoded color values used in inline styles
    validateColor('#fff', 'ContractInput.backgroundColor');
    validateColor('#999', 'ContractInput.placeholderTextColor');
    validateColor('#888', 'DebugText.color');
    validateColor('#222', 'Picker.color');
    validateColor('#f7f7f7', 'Picker.backgroundColor');
    validateColor('#fff', 'Button.backgroundColor');
    validateColor('#fffbe6', 'LegalReviewResult.backgroundColor');
    validateColor('#f39c12', 'LegalReviewResult.color fallback');
    validateColor('#eaf6ff', 'ContractSummary.backgroundColor');
    validateColor('#3498db', 'ContractSummary.color fallback');
    validateColor('#e74c3c', 'DisputeClauseButton.color fallback');
    validateColor('#ffeaea', 'DisputeClause.backgroundColor');
    validateColor('#f4f8ff', 'AIChatAssistant.backgroundColor');
    validateColor('red', 'ErrorText.color');
  }, []);
  const [summaryResult, setSummaryResult] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Send contract text to backend for summarization
  const summarizeContract = async () => {
    setSummaryLoading(true);
    setSummaryResult('');
    try {
      // Combine all clauses into contract text
      const contractText = [
        `Title: ${title}`,
        `Description: ${description}`,
        `Amount: ${amount}`,
        `Deadline: ${deadline}`,
        ...clauses
      ].join('\n');
  const response = await postWithAuth(`${API_BASE_URL}/summarize-contract`, { contractText });
      setSummaryResult(response.data.summary || 'No summary result.');
    } catch (err) {
      setSummaryResult(err?.response?.data?.error || err?.message || 'Failed to summarize contract.');
    }
    setSummaryLoading(false);
  };
  const [legalReviewResult, setLegalReviewResult] = useState('');
  const [legalReviewLoading, setLegalReviewLoading] = useState(false);
  // Send contract text to backend for legal review
  const reviewLegalRisks = async () => {
    setLegalReviewLoading(true);
    setLegalReviewResult('');
    try {
      // Combine all clauses into contract text
      const contractText = [
        `Title: ${title}`,
        `Description: ${description}`,
        `Amount: ${amount}`,
        `Deadline: ${deadline}`,
        ...clauses
      ].join('\n');
  const response = await postWithAuth(`${API_BASE_URL}/review-legal`, { contractText });
      setLegalReviewResult(response.data.review || 'No review result.');
    } catch (err) {
      setLegalReviewResult(err?.response?.data?.error || err?.message || 'Failed to review contract.');
    }
    setLegalReviewLoading(false);
  };
  // Add missing onGenerateContract function
  const onGenerateContract = () => {
  // Prevent navigation if user context is not loaded or missing required fields
  if (!user?.name || !user?.email || !user?.uuid) {
    Alert.alert('Error', 'User details are not loaded. Please wait or log in again.');
    return;
  }
  // Fill originator from logged-in user profile
  const originator = {
    name: user.name,
    email: user.email,
    uuid: user.uuid,
  // role: user.role (removed, only added in SignContractScreen)
  };
  // Fill recipient from selected user
  const recipient = selectedRecipient ? {
    name: selectedRecipient.name,
    email: selectedRecipient.email,
    uuid: selectedRecipient.uuid,
  // role: selectedRecipient.role || '' (removed, only added in SignContractScreen)
  } : {
    name: '',
    email: '',
    uuid: '',
  // role: '' (removed, only added in SignContractScreen)
  };
  setError('');
  if (!title.trim() || !description.trim() || !amount.trim() || !deadline.trim()) {
    setError('Please fill all fields.');
    return;
  }
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    setError('Enter a valid payment amount.');
    return;
  }
  // Simple date format check (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline.trim())) {
    setError('Enter deadline in YYYY-MM-DD format.');
    return;
  }
  // Prepare contract object for preview
  const contract = {
    id: Date.now().toString(),
    originator,
    recipient,
    title,
    description,
    amount,
    deadline,
    inspectionRequirements,
    penalties,
    milestones,
    clauses,
    disputeClause,
    // Add other fields as needed for saving/fetching
  };
  navigation.navigate('PreviewContract', { contract });
  };
  // Debug log to confirm screen mount
  useEffect(() => {
  }, []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
    // Clause customization state
    const [inspectionInput, setInspectionInput] = useState('');
    const [inspectionRequirements, setInspectionRequirements] = useState([]);
    const [penaltyInput, setPenaltyInput] = useState('');
    const [penalties, setPenalties] = useState([]);
    const [milestoneInput, setMilestoneInput] = useState('');
    const [milestones, setMilestones] = useState([]);
    const [tone, setTone] = useState('formal');
    const [language, setLanguage] = useState('English');
    const [numClauses, setNumClauses] = useState(1);
    const [includeDispute, setIncludeDispute] = useState(false);
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [clauses, setClauses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [repoResult, setRepoResult] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [deleteResult, setDeleteResult] = useState(null);
  const [disputeClause, setDisputeClause] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'system', content: 'You are a helpful contract assistant.' }]);
  const [chatInput, setChatInput] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  // Add state for recipient UUID
  const [recipientUuid, setRecipientUuid] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [recipientList, setRecipientList] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Fetch recipient list (example: all users except current)
  useEffect(() => {
    async function fetchRecipients() {
      try {
  const res = await getWithAuth(`${API_BASE_URL}/api/users`);
        if (Array.isArray(res.data.users)) {
          setRecipientList(res.data.users.filter(u => u.email !== user.email));
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchRecipients();
  }, [user.email]);

  const addAIClause = async () => {
    setError('');
    if (!title.trim() || !description.trim() || !amount.trim() || !deadline.trim()) {
      setError('Please fill all fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        amount: amount.trim(),
        deadline: deadline.trim(),
        requirements: '', // Not used for mock
        tone,
        language,
        includeDispute,
        numClauses
      };
      // Always add mock clause in development mode
      if (__DEV__) {
        const mockClause = 'Mock Escrow Contract Clause: Payment terms, completion criteria, milestones, penalties, and dispute resolution will be generated here.';
        setClauses(prev => [...prev, mockClause]);
        setAiResponse(mockClause);
      } else {
        const clauses = await generateClause(payload);
        if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
          setError('AI did not return a valid clause.');
        } else {
          setClauses(prev => [...prev, ...clauses]);
          setAiResponse(clauses[0]);
        }
      }
    } catch (err) {
      setError(`Clause generation error: ${err}`);
    }
    setLoading(false);
  };

  const generateDisputeClause = async () => {
    setDisputeLoading(true);
    setDisputeClause('');
    try {
      const contractText = [
        `Title: ${title}`,
        `Description: ${description}`,
        `Amount: ${amount}`,
        `Deadline: ${deadline}`,
        ...clauses
      ].join('\n');
  const response = await postWithAuth(`${API_BASE_URL}/generate-dispute-clause`, { contractText, language });
      setDisputeClause(response.data.clause || 'No clause returned.');
    } catch (err) {
      setDisputeClause(err?.response?.data?.error || err?.message || 'Failed to generate dispute clause.');
    }
    setDisputeLoading(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    setChatReply('');
    const newMessages = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    try {
  const response = await postWithAuth(`${API_BASE_URL}/ai-chat`, { messages: newMessages });
      setChatReply(response.data.reply || 'No reply.');
      setChatMessages([...newMessages, { role: 'assistant', content: response.data.reply || '' }]);
    } catch (err) {
      setChatReply(err?.response?.data?.error || err?.message || 'Failed to get reply.');
    }
    setChatInput('');
    setChatLoading(false);
  };

  // Top-level error boundary
  try {
    return (
      <ScrollView>
        {/* Recipient search UI */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Recipient (search or select):</Text>
          <TextInput
            placeholder="Paste or type recipient uuid, username, or email"
            value={searchValue}
            onChangeText={setSearchValue}
            onSubmitEditing={handleSearchRecipient}
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 }}
          />  
          {searchResult && (
            <View style={{ marginTop: 8 }}>
              <Text>Recipient Name: {searchResult.name}</Text>
              <Text>Recipient Email: {searchResult.email}</Text>
              <Text>Recipient UUID: {searchResult.uuid}</Text>
            </View>
          )}
          <Button title="Search" onPress={handleSearchRecipient} />
          {/* The following block seems to be misplaced and should be removed or replaced with a valid Picker or selection UI */}
          {(searchResult || selectedRecipient) && (
            <View style={{ marginTop: 8 }}>
              <Text>Recipient Name: {(searchResult || selectedRecipient)?.name}</Text>
              <Text>Recipient Email: {(searchResult || selectedRecipient)?.email}</Text>
              <Text>Recipient UUID: {(searchResult || selectedRecipient)?.uuid}</Text>
            </View>
          )}
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Create Contract</Text>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ padding: 8 }}>
              <Ionicons name="ellipsis-vertical" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}
          <Text>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Project title"
            placeholderTextColor="#999"
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 12,
              marginBottom: 12,
              borderRadius: 10,
              backgroundColor: '#fff',
              color: COLORS.text,
            }}
          />

          <Text>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Project description"
            placeholderTextColor="#999"
            multiline
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 12,
              marginBottom: 12,
              borderRadius: 10,
              backgroundColor: '#fff',
              color: COLORS.text,
              minHeight: 80,
            }}
          />

          <Text>Amount (USD)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="500"
            placeholderTextColor="#999"
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 12,
              marginBottom: 12,
              borderRadius: 10,
              backgroundColor: '#fff',
              color: COLORS.text,
            }}
          />

          <Text>Deadline</Text>
          <TextInput
            value={deadline}
            onChangeText={setDeadline}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 12,
              marginBottom: 12,
              borderRadius: 10,
              backgroundColor: '#fff',
              color: COLORS.text,
            }}
          />

          <Text>Inspection Requirements</Text>
          <View style={{ marginBottom: 8 }}>
  <TextInput
    placeholder="Add inspection requirement"
    value={inspectionInput}
    onChangeText={setInspectionInput}
    style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 4 }}
  />
  <Button title="Add" onPress={() => {
    if (inspectionInput.trim()) {
      setInspectionRequirements([...inspectionRequirements, inspectionInput.trim()]);
      setInspectionInput('');
    }
  }} />
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
  <TextInput
    placeholder="Add penalty"
    value={penaltyInput}
    onChangeText={setPenaltyInput}
    style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 4 }}
  />
  <Button title="Add" onPress={() => {
    if (penaltyInput.trim()) {
      setPenalties([...penalties, penaltyInput.trim()]);
      setPenaltyInput('');
    }
  }} />
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
  <TextInput
    placeholder="Add milestone"
    value={milestoneInput}
    onChangeText={setMilestoneInput}
    style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 4 }}
  />
  <Button title="Add" onPress={() => {
    if (milestoneInput.trim()) {
      setMilestones([...milestones, milestoneInput.trim()]);
      setMilestoneInput('');
    }
  }} />
  {milestones.length > 0 && milestones.map((item, idx) => (
    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
      <Text style={{ flex: 1 }}>{item}</Text>
      <TouchableOpacity onPress={() => setMilestones(milestones.filter((_, i) => i !== idx))}>
        <Ionicons name="close-circle" size={20} color="red" />
      </TouchableOpacity>
    </View>
  ))}
</View>

          <Text>Tone</Text>
          <TextInput
            placeholder="formal or friendly"
            value={tone}
            onChangeText={setTone}
            style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginBottom: 8 }}
          />
          <Text>Language</Text>
          <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 12, overflow: 'hidden', backgroundColor: '#f7f7f7' }}>
            <Picker
              selectedValue={language}
              onValueChange={setLanguage}
              style={{ height: 48, fontSize: 16, color: '#222' }}
            >
              {LANGUAGES.map(lang => (
                <Picker.Item key={lang} label={lang} value={lang} />
              ))}
            </Picker>
          </View>
          <Text>Number of Clauses</Text>
          <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 12, overflow: 'hidden', backgroundColor: '#f7f7f7' }}>
            <Picker
              selectedValue={numClauses}
              onValueChange={val => setNumClauses(val)}
              style={{ height: 48, fontSize: 16, color: '#222' }}
            >
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <Picker.Item key={n} label={n.toString()} value={n} />
              ))}
            </Picker>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text>Include Dispute Clause</Text>
            <Button title={includeDispute ? 'Yes' : 'No'} onPress={() => setIncludeDispute(v => !v)} />
          </View>

          <Text style={{ marginTop: 12, fontWeight: 'bold' }}>Clauses</Text>
          {clauses.map((clause, idx) => <Text key={idx} style={{ marginVertical: 4 }}>• {clause}</Text>)}

          {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 10 }} />}
          <View style={{ marginTop: 32, marginBottom: 8 }}>
            {/* Main actions only */}
            <TouchableOpacity
              style={{ ...buttonStyles.base, backgroundColor: getButtonColor('primary', loading), marginBottom: 12 }}
              onPress={onGenerateContract}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={22} color="#fff" style={buttonStyles.icon} />
              <Text style={{ ...buttonStyles.text, color: '#fff' }}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity
            style={{ ...buttonStyles.base, backgroundColor: getButtonColor('primary', loading), marginBottom: 12 }}
            onPress={addAIClause}
            disabled={loading}
            activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={22} color="#fff" style={buttonStyles.icon} />
              <Text style={{ ...buttonStyles.text, color: '#fff' }}>Add AI Clause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ ...buttonStyles.base, backgroundColor: getButtonColor('danger', disputeLoading || !title || !description || !amount || !deadline), marginBottom: 12 }}
              onPress={generateDisputeClause}
              disabled={disputeLoading || !title || !description || !amount || !deadline}
              activeOpacity={0.8}
            >
              <Ionicons name="alert-circle-outline" size={22} color="#fff" style={buttonStyles.icon} />
              <Text style={{ ...buttonStyles.text, color: '#fff' }}>Dispute Clause</Text>
            </TouchableOpacity>
          </View>
          {/* Modal for secondary actions */}
          <Modal
            visible={menuVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setMenuVisible(false)}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16, color: COLORS.primary }}>More Actions</Text>
                <TouchableOpacity
                  style={{ ...buttonStyles.base, backgroundColor: getButtonColor('info', summaryLoading || clauses.length === 0), marginBottom: 12 }}
                  onPress={summarizeContract}
                  disabled={summaryLoading || clauses.length === 0}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-text-outline" size={22} color="#fff" style={buttonStyles.icon} />
                  <Text style={{ ...buttonStyles.text, color: '#fff' }}>Summarize Contract</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ ...buttonStyles.base, backgroundColor: getButtonColor('warning', legalReviewLoading || clauses.length === 0), marginBottom: 12 }}
                  onPress={reviewLegalRisks}
                  disabled={legalReviewLoading || clauses.length === 0}
                  activeOpacity={0.8}
                >
                  <Ionicons name="shield-checkmark-outline" size={22} color="#fff" style={buttonStyles.icon} />
                  <Text style={{ ...buttonStyles.text, color: '#fff' }}>Review for Legal Risks</Text>
                </TouchableOpacity>
                {/* Send Contract moved to Preview screen, not shown here */}
                <TouchableOpacity
                  style={{ ...buttonStyles.base, backgroundColor: COLORS.disabled || '#ccc', marginBottom: 0 }}
                  onPress={() => setMenuVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={{ ...buttonStyles.text, color: '#333' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {legalReviewLoading && <ActivityIndicator size="small" color={COLORS.warning || '#f39c12'} style={{ marginVertical: 8 }} />}
          {legalReviewResult ? (
            <View style={{ marginTop: 16, backgroundColor: '#fffbe6', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontWeight: 'bold', color: COLORS.warning || '#f39c12' }}>Legal Review Result:</Text>
              <Text style={{ marginTop: 8 }}>{legalReviewResult}</Text>
            </View>
          ) : null}

          {summaryLoading && <ActivityIndicator size="small" color={COLORS.info || '#3498db'} style={{ marginVertical: 8 }} />}
          {summaryResult ? (
            <View style={{ marginTop: 16, backgroundColor: '#eaf6ff', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontWeight: 'bold', color: COLORS.info || '#3498db' }}>Contract Summary:</Text>
              <Text style={{ marginTop: 8 }}>{summaryResult}</Text>
            </View>
          ) : null}

          {disputeLoading && <ActivityIndicator size="small" color={COLORS.danger || '#e74c3c'} style={{ marginVertical: 8 }} />}
          {disputeClause ? (
            <View style={{ marginTop: 16, backgroundColor: '#ffeaea', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontWeight: 'bold', color: COLORS.danger || '#e74c3c' }}>Dispute Clause:</Text>
              <Text style={{ marginTop: 8 }}>{disputeClause}</Text>
            </View>
          ) : null}
          {/* ...existing contract form fields... */}
          {/* Removed direct Send Contract button from here */}
        </ScrollView>
      </ScrollView>
    );
  } catch (err) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>ContractScreen Error:</Text>
        <Text selectable style={{ color: 'red', marginTop: 8 }}>{err?.message || String(err)}</Text>
      </View>
    );
  }
}
