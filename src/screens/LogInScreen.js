import { API_BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUser } from '../context/UserContext';

export default function LogInScreen({ navigation }) {
  const { setUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('email', email);
      // Fetch user profile after login and set user context
      const profileRes = await axios.get(`${API_BASE_URL}/api/profile?email=${email}`, {
        headers: { Authorization: `Bearer ${res.data.token}` }
      });
      if (profileRes.data) {
        setUser(profileRes.data);
      } else {
      }
      navigation.reset({ index: 0, routes: [{ name: 'MainDrawer' }] });
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={{ width: '80%', position: 'relative', marginBottom: 12 }}>
        <TextInput
          style={[styles.input, { paddingRight: 40, marginBottom: 0 }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={{ position: 'absolute', right: 12, top: 12 }}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={{ fontSize: 16, color: '#4B7BEC' }}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      <Button title={loading ? 'Logging in...' : 'Log In'} onPress={handleLogin} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { width: '80%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  error: { color: 'red', marginBottom: 8 },
});
