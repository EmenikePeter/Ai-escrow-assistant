import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackButton from '../components/BackButton';
import { sendMessageToUser } from '../utils/messages';
import { fetchAllUsers } from '../utils/users';

export default function MessageUserScreen({ route, navigation }) {
  const initialRecipient = route?.params?.recipient;
  const [recipient, setRecipient] = useState(initialRecipient || null);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [senderId, setSenderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('userId').then(setSenderId);
    setLoading(true);
    fetchAllUsers().then(setUsers).catch(err => setError('Failed to fetch users.')).finally(() => setLoading(false));
  }, []);

  const handleSearch = async (text) => {
    setSearch(text);
    setLoading(true);
    setError('');
    try {
      const results = await fetchAllUsers(text);
      setUsers(results);
    } catch (err) {
      setError('Failed to fetch users.');
      setUsers([]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendMessageToUser(senderId, recipient._id, message);
      alert(`Message sent to ${recipient?.name || 'user'}`);
      setMessage('');
      navigation.goBack();
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  if (!recipient) {
    return (
      <View style={{ flex: 1 }}>
        <BackButton />
        <View style={styles.container}>
          <Text style={styles.header}>Select a recipient</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Search users by name, email, or UUID"
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity
              style={{ marginLeft: 8, backgroundColor: '#4B7BEC', padding: 10, borderRadius: 6 }}
              onPress={() => handleSearch(search)}
            >
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {loading && <Text style={{ marginTop: 16 }}>Loading...</Text>}
          {error ? <Text style={{ marginTop: 16, color: 'red' }}>{error}</Text> : null}
          {!loading && !error && users.length === 0 ? (
            <Text style={{ marginTop: 16 }}>No users found.</Text>
          ) : null}
          {!loading && !error && users.length > 0 && (
            users.map(user => (
              <TouchableOpacity
                key={user._id}
                style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
                onPress={() => setRecipient(user)}
              >
                <Text style={{ fontWeight: 'bold' }}>{user.name}</Text>
                <Text style={{ color: 'gray' }}>{user.email}</Text>
                {user.uuid && <Text style={{ color: 'green', fontSize: 12 }}>UUID: {user.uuid}</Text>}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BackButton />
      <View style={styles.container}>
        <Text style={styles.header}>Send Message to {recipient.name}</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Type your message..."
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.button} onPress={handleSend}>
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12, minHeight: 80 },
  button: { backgroundColor: '#4B7BEC', padding: 12, borderRadius: 6, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});
