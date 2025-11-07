import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Theme';
import { useUser } from '../context/UserContext';
import { validateColor } from '../utils/colorValidator';

export default function ProfileScreen({ route, navigation }) {
  useEffect(() => {
    validateColor(COLORS.primary, 'COLORS.primary');
    validateColor(COLORS.text, 'COLORS.text');
    validateColor(COLORS.background, 'COLORS.background');
    validateColor(COLORS.card, 'COLORS.card');
    validateColor(COLORS.secondary, 'COLORS.secondary');
    validateColor('#fff', 'ProfileCard.backgroundColor');
    validateColor('#000', 'ProfileCard.shadowColor');
  }, []);
  const profile = route?.params?.profile;
  const { user } = useUser();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    // Force drawer to re-render by navigating to Log In, then closing drawer
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainDrawer',
          params: {
            screen: 'Log In',
          },
        },
      ],
    });
  };

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>No profile data.</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', padding: 16 }}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Ionicons name="person-circle-outline" size={48} color={'blue'} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'blue', marginTop: 8 }}>User Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={{ ...styles.title, color: 'blue' }}>Profile</Text>
        <View style={{ ...styles.card, backgroundColor: 'white', borderColor: 'gray', shadowColor: 'gray' }}>
          <Text style={{ ...styles.label, color: 'blue' }}>Name:</Text>
          <Text style={{ ...styles.value, color: 'black' }}>{profile.name}</Text>
          <Text style={{ ...styles.label, color: 'blue' }}>Email:</Text>
          <Text style={{ ...styles.value, color: 'black' }}>{profile.email}</Text>
          <Text style={{ ...styles.label, color: 'blue' }}>Country:</Text>
          <Text style={{ ...styles.value, color: 'black' }}>{profile.country}</Text>
          {profile.stateProvince && <><Text style={{ ...styles.label, color: 'blue' }}>State/Province:</Text><Text style={{ ...styles.value, color: 'black' }}>{profile.stateProvince}</Text></>}
          {profile.address && <><Text style={{ ...styles.label, color: 'blue' }}>Address:</Text><Text style={{ ...styles.value, color: 'black' }}>{profile.address}</Text></>}
          {profile.dob && <><Text style={{ ...styles.label, color: 'blue' }}>Date of Birth:</Text><Text style={{ ...styles.value, color: 'black' }}>{profile.dob}</Text></>}
          {profile.uuid && <>
            <Text style={{ ...styles.label, color: 'blue' }}>Your Unique User ID:</Text>
            <Text selectable style={{ ...styles.value, color: 'green', fontWeight: 'bold' }}>{profile.uuid}</Text>
            <Text style={{ color: 'gray', fontSize: 12, marginBottom: 8 }}>Share this ID to receive contracts or payments.</Text>
          </>}
          {profile.phone && <><Text style={{ ...styles.label, color: 'blue' }}>Phone:</Text><Text style={{ ...styles.value, color: 'black' }}>{profile.phone}</Text></>}
          {profile.paymentMethod && <><Text style={{ ...styles.label, color: 'blue' }}>Preferred Payment Method:</Text><Text style={{ ...styles.value, color: 'black' }}>{profile.paymentMethod}</Text></>}
        </View>
        {/* Message button for user-to-user messaging */}
          {/* Only show Message button if viewing another user's profile */}
          {user?.email && profile?.email && user.email !== profile.email && (
            <TouchableOpacity
              style={{ backgroundColor: '#4B7BEC', padding: 12, borderRadius: 8, marginTop: 20, alignItems: 'center' }}
              onPress={() => navigation.navigate('MessageUser', { recipient: profile })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={'#fff'} />
              <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 4 }}>Message</Text>
            </TouchableOpacity>
          )}
      </ScrollView>
      <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 12, elevation: 3, shadowColor: 'gray', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={handleLogout} style={{ padding: 8 }}>
          <Ionicons name="log-out-outline" size={28} color={'blue'} />
        </TouchableOpacity>
        <View style={{ marginLeft: 12 }}>
          <Button title="View History" color={'blue'} onPress={() => navigation.navigate('HistoryScreen')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '100%', elevation: 2 },
  label: { fontWeight: 'bold', marginTop: 12 },
  value: { fontSize: 16, marginTop: 2 },
});
