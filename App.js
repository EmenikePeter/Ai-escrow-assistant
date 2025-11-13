import { API_BASE_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import Modal from 'react-native-modal';
import { UserProvider } from './src/context/UserContext';
import ChatHistoryDetailScreen from './src/screens/ChatHistoryDetailScreen';
import ContractScreen from './src/screens/ContractScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DepositScreen from './src/screens/DepositScreen';
import DisputeDetailScreen from './src/screens/DisputeDetailScreen';
import DisputeScreen from './src/screens/DisputeScreen';
import EditContractScreen from './src/screens/EditContractScreen';
import HelpLiveChatScreen from './src/screens/HelpLiveChatScreen';
import HelpScreen from './src/screens/HelpScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import InboxScreen from './src/screens/InboxScreen';
import LogInScreen from './src/screens/LogInScreen';
import OriginatorSignContractScreen from './src/screens/OriginatorSignContractScreen';
import PayoutHistoryScreen from './src/screens/PayoutHistoryScreen';
import PreviewContractScreen from './src/screens/PreviewContractScreen';
import PrintoutScreen from './src/screens/PrintoutScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReceivedContractsScreen from './src/screens/ReceivedContractsScreen';
import RecipientSignContractScreen from './src/screens/RecipientSignContractScreen';
import WalletScreen from './src/screens/WalletScreen';
import { StripeProvider } from './src/utils/StripeProvider';
let countryRegionData = [];
try {
  countryRegionData = require('country-region-data/dist/data-umd');
  if (countryRegionData.default) countryRegionData = countryRegionData.default;
} catch (e) {
  try { countryRegionData = require('country-region-data'); } catch (e2) { countryRegionData = []; }
}
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
// import BrowseTeamsScreen from './src/screens/BrowseTeamsScreen';

// SignUpScreen separated from LogInScreen
function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [regionList, setRegionList] = useState([]);
  const [stateProvince, setStateProvince] = useState('');
  // Example mapping, expand as needed
  const stateProvinceMap = {
    Nigeria: ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'],
    Ghana: ['Greater Accra', 'Ashanti', 'Central', 'Eastern', 'Northern', 'Upper East', 'Upper West', 'Volta', 'Western', 'Bono', 'Bono East', 'Ahafo', 'Oti', 'North East', 'Savannah', 'Western North'],
    Kenya: ['Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang’a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River', 'Tharaka Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'],
    'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
    Canada: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon'],
    India: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'],
    // Add more as needed
  };
  const [address, setAddress] = useState('');
  // Remove userType, skills, business from sign up
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [dob, setDob] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const phoneUtil = PhoneNumberUtil.getInstance();
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('');

  const handleSignUp = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    // Phone validation
    setPhoneError('');
    if (phone) {
      let countryCode = '';
      if (country) {
        const found = Array.isArray(countryRegionData) ? countryRegionData.find(c => c.countryName === country) : undefined;
        countryCode = found?.countryShortCode || '';
      }
      try {
        const number = phoneUtil.parseAndKeepRawInput(phone, countryCode || undefined);
        if (!phoneUtil.isValidNumberForRegion(number, countryCode)) {
          setPhoneError('Please enter a valid phone number for the selected country.');
          return;
        }
      } catch (e) {
        setPhoneError('Please enter a valid phone number for the selected country.');
        return;
      }
    }
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        phone,
        country,
        stateProvince,
        address,
        paymentMethod,
        dob,
      };
      const res = await axios.post(`${API_BASE_URL}/api/signup`, payload);
      await AsyncStorage.setItem('email', email); // Save email for later profile fetch
      console.log('[DEBUG] Email set in AsyncStorage (SignUp):', email);
      Alert.alert('Success', res.data.message || 'Account created!', [
        { text: 'OK', onPress: () => navigation.navigate('Log In') }
      ]);
      // Optionally, store token: AsyncStorage.setItem('token', res.data.token)
      // console.log('[DEBUG] Token set in AsyncStorage (SignUp):', res.data.token);
    } catch (err) {
      // Show detailed error from backend if available
      if (err.response) {
        setError(
          err.response.data?.message
            ? `Sign up failed: ${err.response.data.message}`
            : `Sign up failed: ${err.response.status} ${err.response.statusText}`
        );
      } else if (err.request) {
        setError('Sign up failed: No response from server. Check your network connection.');
      } else {
        setError(`Sign up failed: ${err.message}`);
      }
      // Log error for debugging
      console.error('Sign up error:', err);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Sign Up</Text>
      {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={{ width: '80%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ width: '80%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
        keyboardType="email-address"
      />
      <View style={{ width: '80%', position: 'relative', marginBottom: 12 }}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, paddingRight: 40 }}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={{ position: 'absolute', right: 12, top: 12 }}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#4B7BEC" />
        </TouchableOpacity>
      </View>
      <View style={{ width: '80%', flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <View style={{ borderWidth: 1, borderColor: phoneError ? 'red' : '#ccc', borderRadius: 8, padding: 12, marginRight: 8, backgroundColor: '#f5f5f5', minWidth: 60, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>{countryCode || '+--'}</Text>
        </View>
        <TextInput
          placeholder="Phone Number (optional)"
          value={phone}
          onChangeText={text => {
            setPhone(text);
            setPhoneError('');
          }}
          style={{ flex: 1, borderWidth: 1, borderColor: phoneError ? 'red' : '#ccc', borderRadius: 8, padding: 12 }}
          keyboardType="phone-pad"
        />
      </View>
      {phoneError ? <Text style={{ color: 'red', marginBottom: 8 }}>{phoneError}</Text> : null}
      <View style={{ width: '80%', marginBottom: 12 }}>
        <Text style={{ marginBottom: 4 }}>Country</Text>
        <Picker
          selectedValue={country}
          onValueChange={(value) => {
            setCountry(value);
            const found = Array.isArray(countryRegionData) ? countryRegionData.find(c => c.countryName === value) : undefined;
            setRegionList(Array.isArray(found?.regions) ? found.regions : []);
            setStateProvince('');
            // Set country code (dial code)
            if (found && found.countryShortCode) {
              try {
                const code = phoneUtil.getCountryCodeForRegion(found.countryShortCode);
                setCountryCode(code ? `+${code}` : '');
              } catch (e) {
                setCountryCode('');
              }
            } else {
              setCountryCode('');
            }
          }}
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}
        >
          <Picker.Item label="Select Country" value="" />
          {Array.isArray(countryRegionData) && countryRegionData.map((c) => (
            <Picker.Item key={c.countryShortCode} label={c.countryName} value={c.countryName} />
          ))}
        </Picker>
      </View>
      {Array.isArray(regionList) && regionList.length > 0 ? (
        <View style={{ width: '80%', marginBottom: 12 }}>
          <Text style={{ marginBottom: 4 }}>State/Province</Text>
          <Picker
            selectedValue={stateProvince}
            onValueChange={setStateProvince}
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}
          >
            <Picker.Item label="Select State/Province" value="" />
            {regionList.map((r) => (
              <Picker.Item key={r.shortCode || r.name} label={r.name} value={r.name} />
            ))}
          </Picker>
        </View>
      ) : (
        <TextInput
          placeholder="State/Province"
          value={stateProvince}
          onChangeText={setStateProvince}
          style={{ width: '80%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
        />
      )}
      <TextInput
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
        style={{ width: '80%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
      />
      <TouchableOpacity
        style={{ width: '80%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#f5f5f5' }}
        onPress={() => setShowDobPicker(true)}
      >
        <Text style={{ color: dob ? '#222' : '#888' }}>{dob ? dob : 'Select Date of Birth'}</Text>
      </TouchableOpacity>
      <Modal isVisible={showDobPicker} onBackdropPress={() => setShowDobPicker(false)}>
        <View style={{ backgroundColor: 'white', borderRadius: 8, padding: 16, alignItems: 'center' }}>
          <CalendarPicker
            onDateChange={date => {
              setShowDobPicker(false);
              if (date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                setDob(`${yyyy}-${mm}-${dd}`);
              }
            }}
            maxDate={new Date()}
            selectedStartDate={dob ? new Date(dob) : undefined}
          />
        </View>
      </Modal>
      <TextInput
        placeholder="Preferred Payment Method (optional)"
        value={paymentMethod}
        onChangeText={setPaymentMethod}
        style={{ width: '80%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
      />
      <Button title={loading ? 'Signing Up...' : 'Sign Up'} onPress={handleSignUp} color="#4B7BEC" disabled={loading} />
    </ScrollView>
  );
}

function AuthGuard({ children, navigation }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      setAuthenticated(!!token);
      setLoading(false);
    });
  }, [navigation]);

  useEffect(() => {
    if (!loading && !authenticated) {
      navigation.navigate('Log In');
    }
  }, [loading, authenticated, navigation]);

  if (loading || !authenticated) return null;
  return children;
}

function MainTabs(props) {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    AsyncStorage.getItem('email').then(async email => {
      if (email) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/profile?email=${email}`);
          setProfile(res.data);
        } catch {}
      }
    });
  }, []);
  const isAdmin = profile?.userType === 'Admin';
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Contract') iconName = 'document-text-outline';
          else if (route.name === 'Payment') iconName = 'card-outline';
          else if (route.name === 'Dispute') iconName = 'alert-circle-outline';
          else if (route.name === 'Profile') iconName = 'person-circle-outline';
          else if (route.name === 'Received') iconName = 'mail-outline';
          else if (route.name === 'AdminDashboard') iconName = 'speedometer-outline';
          else if (route.name === 'Wallet') iconName = 'wallet-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4B7BEC',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => (
          <Ionicons
            name="menu"
            size={28}
            color="#4B7BEC"
            style={{ marginRight: 16 }}
            onPress={() => props.navigation.openDrawer()}
          />
        ),
      })}
    >
      {!isAdmin && <Tab.Screen name="Home" component={HomeScreen} />}
      {!isAdmin && <Tab.Screen name="Contract">{props => <AuthGuard navigation={props.navigation}><ContractScreen {...props} /></AuthGuard>}</Tab.Screen>}
  {!isAdmin && <Tab.Screen name="Wallet">{props => <AuthGuard navigation={props.navigation}><WalletScreen {...props} /></AuthGuard>}</Tab.Screen>}
      {!isAdmin && <Tab.Screen name="Received" component={ReceivedContractsScreen} options={{ title: 'Received Contracts' }} />}
      <Tab.Screen name="Dispute">{props => <AuthGuard navigation={props.navigation}><DisputeScreen {...props} /></AuthGuard>}</Tab.Screen>
      {!isAdmin && <Tab.Screen name="Profile">{props => <AuthGuard navigation={props.navigation}><ProfileScreen {...props} /></AuthGuard>}</Tab.Screen>}
  {/* Remove AdminDashboard, Help, Inbox, TeamManagement, etc. from tabs. They will be in the drawer. */}
    </Tab.Navigator>
  );
}



function LogoutScreen({ navigation }) {
  useEffect(() => {
    (async () => {
      await AsyncStorage.removeItem('token');
    console.log('[DEBUG] Token removed from AsyncStorage (Logout)');
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
    })();
  }, [navigation]);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Logging out...</Text>
    </View>
  );
}

function MainDrawer() {
  const navigation = useNavigation();
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      setAuthenticated(!!token);
      if (!token) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const email = await AsyncStorage.getItem('email');
      if (email) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/profile?email=${email}`);
          setProfile(res.data);
          console.log('Drawer profile:', res.data);
        } catch (err) {
          setProfile(null);
          console.log('Drawer profile fetch error:', err);
        }
      }
      setLoading(false);
    };
    const focusListener = navigation.addListener('focus', checkAuth);
    checkAuth();
    return () => {
      focusListener && focusListener();
    };
  }, [navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading menu...</Text>
      </View>
    );
  }

  return (
    <Drawer.Navigator initialRouteName="MainTabs" screenOptions={{ drawerPosition: 'right' }}>
      <Drawer.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false, drawerLabel: 'App' }} />
      <Drawer.Screen name="PayoutHistory" component={PayoutHistoryScreen} options={{ drawerLabel: 'Payout History' }} />
      <Drawer.Screen name="Inbox" component={InboxScreen} options={{ drawerLabel: 'Inbox' }} />
      <Drawer.Screen name="Help" component={HelpScreen} options={{ drawerLabel: 'Help & Support' }} />
      <Drawer.Screen name="HelpLiveChat" component={HelpLiveChatScreen} options={{ drawerLabel: 'Live Chat Support' }} />
      {!authenticated && <Drawer.Screen name="Log In" component={LogInScreen} />}
      {!authenticated && <Drawer.Screen name="Sign Up" component={SignUpScreen} />}
      {authenticated && <Drawer.Screen name="Logout" component={LogoutScreen} options={{
        drawerIcon: ({ color, size }) => (
          <Ionicons name="log-out-outline" size={size} color={color} />
        ),
      }} />}
    </Drawer.Navigator>
  );
}

export default function App() {
  // ...existing code...
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <UserProvider>
      <StripeProvider publishableKey="pk_test_51RNoEOQxvR5fEokOLaTo3se939jgPBNjzBCeIwj7gwZM0DCNWE1TYSiPX5eAl35TafBk46R3o8n3wpgk0l4JhhtS00ZWRoTYEr">
        <KeyboardProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="MainDrawer" component={MainDrawer} options={{ headerShown: false }} />
              <Stack.Screen name="Inbox" component={InboxScreen} options={{ headerShown: true, title: 'Inbox' }} />
              <Stack.Screen name="Help" component={HelpScreen} options={{ headerShown: true, title: 'Help & Support' }} />
              <Stack.Screen name="HistoryScreen" component={HistoryScreen} options={{ headerShown: true, title: 'History' }} />
              <Stack.Screen name="ChatHistoryDetail" component={ChatHistoryDetailScreen} options={{ headerShown: true, title: 'Chat Session Details' }} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: true, title: 'Dashboard' }} />
              <Stack.Screen name="PreviewContract" component={PreviewContractScreen} options={{ headerShown: true, title: 'Preview Contract' }} />
              <Stack.Screen name="PrintoutScreen" component={PrintoutScreen} options={{ headerShown: true, title: 'Print / Save Contract' }} />
              <Stack.Screen name="OriginatorSignContractScreen" component={OriginatorSignContractScreen} options={{ headerShown: true, title: 'Sign Contract (Originator)' }} />
              <Stack.Screen name="RecipientSignContractScreen" component={RecipientSignContractScreen} options={{ headerShown: true, title: 'Sign Contract (Recipient)' }} />
              <Stack.Screen name="DisputeDetail" component={DisputeDetailScreen} options={{ headerShown: true, title: 'Dispute Details' }} />
              <Stack.Screen name="PayoutHistory" component={PayoutHistoryScreen} options={{ headerShown: true, title: 'Payout History' }} />
              <Stack.Screen name="ChatScreen" component={require('./src/screens/ChatScreen').default} options={{ headerShown: true, title: 'Chat' }} />
              <Stack.Screen name="Deposit" component={DepositScreen} options={{ headerShown: true, title: 'Deposit to Escrow' }} />
              <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: true, title: 'Wallet & Funds Center' }} />
              <Stack.Screen name="EditContractScreen" component={EditContractScreen} options={{ headerShown: true, title: 'Edit Contract' }} />
            </Stack.Navigator>
          </NavigationContainer>
        </KeyboardProvider>
      </StripeProvider>
    </UserProvider>
  );
}
