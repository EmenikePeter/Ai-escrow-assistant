import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Button, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Theme';

export default function WalletScreen({ navigation }) {
  // Payment method management state
  const [paymentMethodType, setPaymentMethodType] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [paymentMethodSaved, setPaymentMethodSaved] = useState(false);

  // Withdrawal state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState('');

  // Payment history modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    // Fetch payment history for current user (stub)
    setPaymentHistory([]);
  }, [showAccountModal]);

  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Ionicons name="wallet-outline" size={36} color={'blue'} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'blue', marginRight: 8 }}>Wallet</Text>
        <TouchableOpacity onPress={() => setShowAccountModal(true)} style={{ marginLeft: 8 }}>
          <Ionicons name="person-circle-outline" size={28} color={'blue'} />
        </TouchableOpacity>
        <Text style={{ marginLeft: 12, fontSize: 22, fontWeight: 'bold', color: '#163ad8ff' }}>Account</Text>
      </View>
      <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: 'gray', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
        <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>Select Payment Method</Text>
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
        {/* Payment method input fields and save button */}
        {/* ...existing payment method UI... */}
        <Button
          title={paymentMethodSaved ? 'Payment Method Saved' : 'Save Payment Method'}
          color={COLORS.primary}
          onPress={() => setPaymentMethodSaved(true)}
          disabled={paymentMethodSaved || (paymentMethodType === 'card' && (!cardNumber || !cardExpiry || !cardCVC))}
        />
      </View>
      {/* Withdrawal fields */}
      <View style={{ marginTop: 32, width: '100%', backgroundColor: 'white', borderRadius: 12, padding: 16, elevation: 2, shadowColor: 'gray', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
        <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>Withdraw Funds</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 6, padding: 8, width: '100%', marginBottom: 8, color: 'black' }}
          placeholder="Bank Name"
          value={bankName}
          onChangeText={setBankName}
        />
        <TextInput
          style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 6, padding: 8, width: '100%', marginBottom: 8, color: 'black' }}
          placeholder="Account Number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
        />
        <TextInput
          style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 6, padding: 8, width: '100%', marginBottom: 8, color: 'black' }}
          placeholder="IBAN"
          value={iban}
          onChangeText={setIban}
        />
        <TextInput
          style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 6, padding: 8, width: '100%', marginBottom: 8, color: 'black' }}
          placeholder="Account Holder Name"
          value={accountHolder}
          onChangeText={setAccountHolder}
        />
        <Button
          title={withdrawalLoading ? 'Withdrawing...' : 'Withdraw'}
          color={'green'}
          onPress={() => setWithdrawalLoading(true)}
          disabled={withdrawalLoading || !paymentMethodSaved}
        />
      </View>
      {/* Payment history modal */}
      <Modal visible={showAccountModal} animationType="slide" onRequestClose={() => setShowAccountModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: 'blue' }}>Payment History</Text>
          <ScrollView>
            {paymentHistory.length === 0 ? (
              <Text style={{ color: 'gray', marginTop: 32 }}>No payment history found.</Text>
            ) : (
              paymentHistory.map((item, idx) => (
                <View key={idx} style={{ marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold', color: 'black' }}>Contract ID: {item.contractId || '-'}</Text>
                  <Text style={{ color: 'black' }}>Amount: ${item.amount}</Text>
                  <Text style={{ color: 'black' }}>Date: {new Date(item.createdAt).toLocaleString()}</Text>
                  <Text style={{ color: item.status === 'paid' ? 'green' : 'orange', fontWeight: 'bold' }}>Status: {item.status}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <Button title="Close" onPress={() => setShowAccountModal(false)} color={'blue'} />
        </View>
      </Modal>
    </View>
  );
}
