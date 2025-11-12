import { API_BASE_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect } from 'react';
import { Button, Text, View } from 'react-native';
import { COLORS } from '../constants/Theme';
import { validateColor } from '../utils/colorValidator';

// Use API_BASE_URL from .env

export default function HomeScreen({ navigation }) {
  useEffect(() => {
  validateColor(COLORS.primary, 'COLORS.primary');
  validateColor(COLORS.text, 'COLORS.text');
  validateColor(COLORS.background, 'COLORS.background');
    // Validate all hardcoded color values used in inline styles
    // No additional hardcoded colors in HomeScreen inline styles
  }, []);
  const handleProfilePress = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const email = await AsyncStorage.getItem('email');
      if (token && email) {
  const profileRes = await axios.get(`${API_BASE_URL}/api/profile?email=${email}`);
        navigation.navigate('Profile', { profile: profileRes.data });
      } else {
        navigation.navigate('Profile');
      }
    } catch (_err) {
      navigation.navigate('Profile');
    }
  };

  const [profile, setProfile] = React.useState(null);
  React.useEffect(() => {
    AsyncStorage.getItem('email').then(async email => {
      if (email) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/profile?email=` + email);
          setProfile(res.data);
          // Always store MongoDB ObjectId as userId
          if (res.data._id && /^[a-fA-F0-9]{24}$/.test(res.data._id)) {
            await AsyncStorage.setItem('userId', res.data._id);
          }
        } catch {}
      }
    });
  }, []);
  const isAdmin = profile?.userType === 'Admin';
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <Ionicons name="shield-checkmark-outline" size={64} color={COLORS.primary} />
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginTop: 12 }}>Contracts & Payments Made Simple</Text>
      </View>
      {!isAdmin && <View style={{ width: '90%', marginBottom: 20 }}>
        <Button title="Create Contract" color={COLORS.primary} onPress={() => navigation.navigate('Contract')} />
      </View>}
      {!isAdmin && <View style={{ width: '90%' }}>
        <Button title="View Contracts" color={COLORS.primary} onPress={() => navigation.navigate('Dashboard')} />
      </View>}
      {!isAdmin && <View style={{ width: '90%', marginTop: 20 }}>
        <Button title="Profile" color={COLORS.primary} onPress={handleProfilePress} />
      </View>}
    </View>
  );
}
