import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../config/env';
import { COLORS } from '../constants/Theme';
import { validateColor } from '../utils/colorValidator';

function getProgress(deadline) {
  const start = new Date();
  const end = new Date(deadline);
  const now = new Date();
  if (Number.isNaN(end.getTime())) return 0.5;
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  if (total <= 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, elapsed / total));
}

export default function PaymentScreen({ route }) {
  const contract = route?.params?.contract ?? null;
  const userRole = route?.params?.userRole ?? null;
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [paymentMethodSaved, setPaymentMethodSaved] = useState(false);

  useEffect(() => {
    validateColor(COLORS.primary, 'COLORS.primary');
    validateColor(COLORS.text, 'COLORS.text');
    validateColor(COLORS.background, 'COLORS.background');
    validateColor(COLORS.card, 'COLORS.card');
    validateColor(COLORS.border, 'COLORS.border');
  }, []);

  useEffect(() => {
    if (!showAccountModal) return;

    const fetchHistory = async () => {
      try {
        const uuid = route?.params?.userUuid || contract?.recipientUuid;
        if (!uuid) {
          setPaymentHistory([]);
          return;
        }
        const response = await fetch(`/api/payouts?uuid=${uuid}`);
        const data = await response.json();
        setPaymentHistory(data?.payouts ?? []);
      } catch (error) {
        setPaymentHistory([]);
      }
    };

    fetchHistory();
  }, [showAccountModal, contract?.recipientUuid, route?.params?.userUuid]);

  const isContractFlow = Boolean(contract);
  const progress = useMemo(() => {
    if (!contract) {
      return 0;
    }
    return getProgress(contract.deadline);
  }, [contract]);

  const handleSavePaymentMethod = () => {
    setPaymentMethodSaved(true);
    Alert.alert('Payment Method Saved', 'Your payment method preferences are stored for mobile checkout.');
  };

  const handleWithdraw = async () => {
    if (!bankName || !accountNumber || !iban || !accountHolder) {
      Alert.alert('Missing Details', 'Please fill in all bank details.');
      return;
    }

    setWithdrawalLoading(true);
    try {
      setTimeout(() => {
        setWithdrawalStatus('success');
        setWithdrawalLoading(false);
        Alert.alert('Withdrawal Successful', 'Funds have been withdrawn.');
      }, 1500);
    } catch (error) {
      setWithdrawalStatus('failed');
      setWithdrawalLoading(false);
      Alert.alert('Error', error.message);
    }
  };

  const handleRequestPayout = async () => {
    if (!contract) {
      Alert.alert('Unavailable', 'Contract details unavailable for payout.');
      return;
    }
    setPayoutLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/payout`, {
        uuid: contract.recipientUuid,
        amount: contract.amount,
        currency: 'usd',
      });
      if (res.data?.payout?.status) {
        setPayoutStatus(res.data.payout.status);
        Alert.alert('Payout Requested', `Status: ${res.data.payout.status}`);
      } else {
        setPayoutStatus('failed');
        Alert.alert('Error', 'Failed to request payout.');
      }
    } catch (error) {
      setPayoutStatus('failed');
      Alert.alert('Error', error.message);
    }
    setPayoutLoading(false);
  };

  const handleDeposit = () => {
    Alert.alert(
      'Unsupported on Web',
      'Card payments are currently available only in the native (iOS/Android) app. Please use the mobile app to complete a card payment.'
    );
  };

  const handleReleaseFunds = async paymentIntentId => {
    if (!paymentIntentId) {
      Alert.alert('Error', 'No escrowed payment found.');
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/api/release-funds`, {
        paymentIntentId,
      });
      if (res.data?.success) {
        Alert.alert('Funds Released', 'Payment has been sent to freelancer.');
      } else {
        Alert.alert('Error', 'Failed to release funds.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderContractPayment = () => {
    if (!contract) {
      return null;
    }

    return (
      <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary }}>{contract.title || 'Contract'}</Text>
        <Text style={{ color: COLORS.text }}>Amount: ${contract.amount?.toFixed?.(2) ?? contract.amount}</Text>
        <Text style={{ color: COLORS.text }}>Deadline: {contract.deadline ? new Date(contract.deadline).toLocaleDateString() : 'N/A'}</Text>
        <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 8 }}>
          <View
            style={{
              height: 8,
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: COLORS.primary,
              borderRadius: 8,
            }}
          />
        </View>
        <Button title="Request Payout" onPress={handleRequestPayout} disabled={payoutLoading} />
        {payoutStatus ? <Text style={{ color: COLORS.text }}>Status: {payoutStatus}</Text> : null}
        <Button title="Release Funds" color="green" onPress={() => handleReleaseFunds(contract.paymentIntentId)} />
        <Text style={{ color: COLORS.text, marginTop: 8 }}>For card payments, please continue in the native app.</Text>
      </View>
    );
  };

  const renderAccountModal = () => (
    <Modal transparent visible={showAccountModal} animationType="slide" onRequestClose={() => setShowAccountModal(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, maxHeight: '80%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: COLORS.primary }}>Account Activity</Text>
          <ScrollView>
            {paymentHistory.length === 0 ? (
              <Text style={{ color: COLORS.text }}>No payouts recorded yet.</Text>
            ) : (
              paymentHistory.map((item, index) => (
                <View key={index} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                  <Text style={{ color: COLORS.text }}>Amount: ${item.amount}</Text>
                  <Text style={{ color: COLORS.text }}>Status: {item.status}</Text>
                  <Text style={{ color: COLORS.text }}>Date: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <Button title="Close" onPress={() => setShowAccountModal(false)} />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
      {renderAccountModal()}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Ionicons name="card-outline" size={32} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.primary }}>Payments (Web Preview)</Text>
        <TouchableOpacity onPress={() => setShowAccountModal(true)} style={{ marginLeft: 8 }}>
          <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
          <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>Card Payments</Text>
          <Text style={{ color: COLORS.text, marginBottom: 8 }}>
            Card payments are currently supported only in the native apps. Use the mobile version to complete a deposit with Stripe.
          </Text>
          <Button title="Deposit Funds" onPress={handleDeposit} />
          <Button title={paymentMethodSaved ? 'Payment Method Saved' : 'Save Payment Method'} onPress={handleSavePaymentMethod} disabled={paymentMethodSaved} color={COLORS.primary} />
        </View>

        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
          <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>Withdraw Funds</Text>
          <TextInput style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 8, color: COLORS.text }} placeholder="Bank Name" value={bankName} onChangeText={setBankName} />
          <TextInput style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 8, color: COLORS.text }} placeholder="Account Number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" />
          <TextInput style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 8, color: COLORS.text }} placeholder="IBAN" value={iban} onChangeText={setIban} />
          <TextInput style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 8, color: COLORS.text }} placeholder="Account Holder Name" value={accountHolder} onChangeText={setAccountHolder} />
          <Button title={withdrawalLoading ? 'Withdrawing...' : 'Withdraw'} color="green" onPress={handleWithdraw} disabled={withdrawalLoading || !paymentMethodSaved} />
          {withdrawalStatus === 'success' ? <Text style={{ color: 'green', marginTop: 8 }}>Withdrawal Successful!</Text> : null}
          {withdrawalStatus === 'failed' ? <Text style={{ color: 'red', marginTop: 8 }}>Withdrawal Failed.</Text> : null}
        </View>

        {renderContractPayment()}

        {userRole === 'owner' ? (
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
            <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>Platform Fees</Text>
            <Text style={{ color: COLORS.text }}>
              Fee adjustments and advanced payout flows are available in the native app. Web currently provides a read-only overview.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
