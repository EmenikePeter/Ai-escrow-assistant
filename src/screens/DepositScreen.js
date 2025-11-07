import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Button, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Theme';

export default function DepositScreen({ route, navigation }) {
  const contract = route?.params?.contract;
  const [paymentMethodType, setPaymentMethodType] = useState('card');
  const [cardDetails, setCardDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!contract) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'white' }}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>No contract found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Ionicons name="document-outline" size={36} color={'blue'} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'blue', marginRight: 8 }}>Deposit to Escrow</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={{ marginLeft: 8 }}>
          <Ionicons name="wallet-outline" size={28} color={'blue'} />
        </TouchableOpacity>
      </View>
      <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: 'gray', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
        <Text style={{ color: 'black' }}>Contract: {contract.title}</Text>
        <Text style={{ color: 'black' }}>Amount: ${contract.amount}</Text>
        <Text style={{ color: 'black', fontWeight: 'bold', marginTop: 8 }}>Awaiting Deposit</Text>
        <Text style={{ marginTop: 12, fontWeight: 'bold', color: COLORS.primary }}>Select Payment Method</Text>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setPaymentMethodType('card')} style={{ marginRight: 8 }}>
            <Text style={{ color: paymentMethodType === 'card' ? 'blue' : 'gray' }}>Card</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaymentMethodType('applepay')} style={{ marginRight: 8 }}>
            <Text style={{ color: paymentMethodType === 'applepay' ? 'blue' : 'gray' }}>Apple Pay</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaymentMethodType('googlepay')} style={{ marginRight: 8 }}>
            <Text style={{ color: paymentMethodType === 'googlepay' ? 'blue' : 'gray' }}>Google Pay</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaymentMethodType('local')}>
            <Text style={{ color: paymentMethodType === 'local' ? 'blue' : 'gray' }}>Local Method</Text>
          </TouchableOpacity>
        </View>
        {/* Payment method input fields for deposit only */}
        {/* ...existing payment method UI for deposit... */}
        <Button
          title={loading ? 'Processing...' : 'Deposit Funds'}
          onPress={() => setLoading(true)}
          disabled={loading || !cardDetails?.complete}
        />
        <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={{ marginTop: 12 }}>
          <Text style={{ color: 'blue', textAlign: 'right' }}>Manage payment methods →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
