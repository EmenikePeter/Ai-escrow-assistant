import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getWithAuth, putWithAuth } from '../utils/api';
import { sendHelpIssue } from '../utils/help';

const issueCategories = [
  'General',
  'Payment',
  'Contract',
  'Technical',
  'Dispute',
  'Other',
];

export default function HelpScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState(issueCategories[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyTicketId, setReplyTicketId] = useState(null);

  useState(() => {
    AsyncStorage.getItem('email').then(e => e && setEmail(e));
    AsyncStorage.getItem('userId').then(id => id && setUserId(id));
    // Fetch tickets for user
    if (userId) {
      getWithAuth(`/support/tickets?userId=${userId}`).then(res => {
        setTickets(res.data || []);
      });
    }
  }, []);

  const handleSend = async () => {
    if (!email || !selectedCategory || !subject.trim() || !message.trim()) {
      alert('Please fill all fields.');
      return;
    }
    try {
      await sendHelpIssue(email, selectedCategory, subject, message);
      alert('Your issue has been sent to support.');
      setMessage('');
      setSubject('');
      // Refresh tickets
      if (userId) {
        getWithAuth(`/support/tickets?userId=${userId}`).then(res => {
          setTickets(res.data || []);
        });
      }
    } catch (err) {
      alert('Failed to send issue.');
    }
  };

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    try {
      await putWithAuth(`/support/tickets/${ticketId}`, { reply: replyText });
      setReplyText('');
      setReplyTicketId(null);
      // Refresh tickets
      getWithAuth(`/support/tickets?userId=${userId}`).then(res => {
        setTickets(res.data || []);
      });
    } catch (err) {
      alert('Failed to send reply.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Contact Support</Text>
      <Text style={styles.label}>Select Issue Category:</Text>
      <Picker
        selectedValue={selectedCategory}
        style={styles.picker}
        onValueChange={itemValue => setSelectedCategory(itemValue)}
      >
        {issueCategories.map(cat => (
          <Picker.Item key={cat} label={cat} value={cat} />
        ))}
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="Subject"
        value={subject}
        onChangeText={setSubject}
      />
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={4}
        placeholder="Describe your issue or problem..."
        value={message}
        onChangeText={setMessage}
      />
      <TouchableOpacity style={styles.button} onPress={handleSend}>
        <Text style={styles.buttonText}>Send to Support</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.liveChatButton} onPress={() => navigation.navigate('HelpLiveChat')}>
        <Text style={styles.buttonText}>Live Chat</Text>
      </TouchableOpacity>
      {/* Display user's tickets */}
      <Text style={{ fontWeight: 'bold', marginTop: 20 }}>Your Tickets:</Text>
      {tickets.length === 0 ? (
        <Text>No tickets found.</Text>
      ) : (
        tickets.map(ticket => (
          <View key={ticket._id} style={{ backgroundColor: '#f1f1f1', borderRadius: 8, padding: 10, marginVertical: 6 }}>
            <Text style={{ fontWeight: 'bold' }}>{ticket.subject}</Text>
            <Text>Status: {ticket.status}</Text>
            <Text>Category: {ticket.category}</Text>
            <Text>Message: {ticket.message}</Text>
            {ticket.reply && <Text style={{ color: '#4B7BEC' }}>Reply: {ticket.reply}</Text>}
            {/* Reply input for ticket */}
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginTop: 8 }}
              placeholder="Reply to this ticket..."
              value={replyTicketId === ticket._id ? replyText : ''}
              onChangeText={text => {
                setReplyTicketId(ticket._id);
                setReplyText(text);
              }}
            />
            <TouchableOpacity
              style={{ backgroundColor: '#4B7BEC', padding: 8, borderRadius: 6, alignItems: 'center', marginTop: 4 }}
              onPress={() => handleReply(ticket._id)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send Reply</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 16, marginBottom: 8 },
  picker: { height: 50, width: '100%', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12, minHeight: 80 },
  button: { backgroundColor: '#4B7BEC', padding: 12, borderRadius: 6, alignItems: 'center', marginBottom: 10 },
  liveChatButton: { backgroundColor: '#34A853', padding: 12, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
