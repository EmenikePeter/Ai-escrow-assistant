import { STRIPE_PUBLISHABLE_KEY } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { API_BASE_URL } from '../config/env';
import { COLORS } from '../constants/Theme';
import { useUser } from '../context/UserContext';
import { getWithAuth, postWithAuth } from '../utils/api';
import { PaymentCardField, PaymentStripeProvider } from '../utils/stripeIntegration';

export default function WalletScreen() {
  const { user } = useUser();
  const publishableKey =
    STRIPE_PUBLISHABLE_KEY || 'pk_test_51RNoEOQxvR5fEokOLaTo3se939jgPBNjzBCeIwj7gwZM0DCNWE1TYSiPX5eAl35TafBk46R3o8n3wpgk0l4JhhtS00ZWRoTYEr';

  const [paymentMethodType, setPaymentMethodType] = useState('card');
  const [cardDetails, setCardDetails] = useState(null);
  const [localReference, setLocalReference] = useState('');
  const [paymentMethodSaved, setPaymentMethodSaved] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState('');

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);

  const userIdentifier = user?.uuid || user?._id || user?.id || user?.email || '';
  const userEmail = user?.email || '';

  const paymentOptions = useMemo(
    () => [
      { type: 'card', label: 'Card', enabled: true },
      { type: 'local', label: 'Local Method', enabled: true },
    ],
    []
  );

  const availablePaymentOptions = useMemo(
    () => paymentOptions.filter((option) => option.enabled),
    [paymentOptions]
  );

  useEffect(() => {
    if (!availablePaymentOptions.length) return;
    if (!availablePaymentOptions.some((option) => option.type === paymentMethodType)) {
      setPaymentMethodType(availablePaymentOptions[0].type);
    }
  }, [availablePaymentOptions, paymentMethodType]);

  const fetchPaymentMethods = useCallback(async () => {
    if (!userIdentifier) {
      setPaymentMethods([]);
      return;
    }
    setPaymentMethodsLoading(true);
    try {
      const res = await getWithAuth(`${API_BASE_URL}/api/payment-methods`);
      const methods = Array.isArray(res?.data?.methods)
        ? res.data.methods
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setPaymentMethods(methods);
    } catch (err) {
      console.warn('[WalletScreen] Failed to load payment methods', err?.response?.data || err.message);
      setPaymentMethods([]);
    } finally {
      setPaymentMethodsLoading(false);
    }
  }, [userIdentifier]);

  useEffect(() => {
    if (!userIdentifier) return;
    fetchPaymentMethods();
  }, [userIdentifier, fetchPaymentMethods]);

  useEffect(() => {
    if (!paymentMethods.length) {
      setPaymentMethodSaved(false);
      return;
    }
    const hasMethodForType = paymentMethods.some((method) => {
      if (!method?.type) return true;
      return method.type === paymentMethodType;
    });
    setPaymentMethodSaved(hasMethodForType);
  }, [paymentMethods, paymentMethodType]);

  const handleCardDetailsChange = useCallback(
    (details) => {
      setCardDetails(details);
      if (paymentMethodSaved) {
        setPaymentMethodSaved(false);
      }
    },
    [paymentMethodSaved]
  );

  const handleLocalReferenceChange = useCallback(
    (value) => {
      setLocalReference(value);
      if (paymentMethodSaved) {
        setPaymentMethodSaved(false);
      }
    },
    [paymentMethodSaved]
  );

  const handleSavePaymentMethod = useCallback(async () => {
    if (!userIdentifier) {
      Alert.alert('Sign In Required', 'You must be signed in to save a payment method.');
      return;
    }
    if (paymentMethodType === 'card' && !cardDetails?.complete) {
      Alert.alert('Incomplete Card', 'Enter complete card details before saving.');
      return;
    }
    if (paymentMethodType === 'local' && !localReference) {
      Alert.alert('Missing Reference', 'Add a reference number for your local payment method.');
      return;
    }

    setSavingPaymentMethod(true);
    try {
      const payload = {
        type: paymentMethodType,
        reference: paymentMethodType === 'local' ? localReference : undefined,
        cardSummary:
          paymentMethodType === 'card'
            ? {
                brand: cardDetails?.brand,
                last4: cardDetails?.last4,
              }
            : undefined,
      };
      const res = await postWithAuth(`${API_BASE_URL}/api/payment-methods`, payload);
      const methods = Array.isArray(res?.data?.methods)
        ? res.data.methods
        : Array.isArray(res?.data)
        ? res.data
        : null;
      if (methods) {
        setPaymentMethods(methods);
      }
      setPaymentMethodSaved(true);
      Alert.alert('Payment Method Saved', 'Your payment method has been saved.');
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to save payment method.';
      Alert.alert('Error', message);
    } finally {
      setSavingPaymentMethod(false);
    }
  }, [cardDetails, localReference, paymentMethodType, userIdentifier]);

  const handleWithdraw = useCallback(async () => {
    if (!bankName || !accountNumber || !iban || !accountHolder) {
      Alert.alert('Missing Details', 'Please fill in all bank details.');
      return;
    }
    if (!userIdentifier) {
      Alert.alert('Sign In Required', 'You must be signed in to withdraw funds.');
      return;
    }
    setWithdrawalStatus('');
    setWithdrawalLoading(true);
    try {
      const res = await postWithAuth(`${API_BASE_URL}/api/wallet/withdraw`, {
        bankName,
        accountNumber,
        iban,
        accountHolder,
      });
      setWithdrawalStatus('success');
      Alert.alert('Withdrawal Successful', res?.data?.message || 'Funds have been withdrawn.');
    } catch (err) {
      setWithdrawalStatus('failed');
      const message = err?.response?.data?.message || err.message || 'Failed to withdraw funds.';
      Alert.alert('Error', message);
    } finally {
      setWithdrawalLoading(false);
    }
  }, [accountHolder, accountNumber, bankName, iban, userIdentifier]);

  const fetchPaymentHistory = useCallback(async () => {
    if (!userIdentifier) return;
    setPaymentHistoryLoading(true);
    try {
      const res = await getWithAuth(`${API_BASE_URL}/api/wallet/history`);
      const history = Array.isArray(res?.data?.history)
        ? res.data.history
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setPaymentHistory(history);
    } catch (err) {
      console.warn('[WalletScreen] Failed to load wallet history', err?.response?.data || err.message);
      setPaymentHistory([]);
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, [userIdentifier]);

  useEffect(() => {
    if (showAccountModal) {
      fetchPaymentHistory();
    }
  }, [showAccountModal, fetchPaymentHistory]);

  useEffect(() => {
    if (!publishableKey) {
      console.warn('Stripe publishable key is not configured. Set STRIPE_PUBLISHABLE_KEY in your environment.');
    }
  }, [publishableKey]);

  if (!userEmail) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.primary }}>Loading account...</Text>
      </View>
    );
  }

  return (
    <PaymentStripeProvider publishableKey={publishableKey}>
      <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
        <BackButton />
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
            {availablePaymentOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                onPress={() => setPaymentMethodType(option.type)}
                style={{ marginRight: 8 }}
              >
                <Text style={{ color: paymentMethodType === option.type ? 'blue' : 'gray' }}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {paymentMethodsLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={{ marginLeft: 8, color: 'gray' }}>Loading saved methods...</Text>
            </View>
          ) : paymentMethods.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              {paymentMethods.map((method, index) => {
                const methodId = method.id || method.paymentMethodId || method.reference || index;
                const descriptor = method.label
                  || (method.brand ? `${method.brand} ending ${method.last4 || ''}` : method.reference || 'Saved payment method');
                return (
                  <Text key={`${methodId}`} style={{ color: 'gray' }}>
                    • {descriptor}
                  </Text>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: 'gray', marginBottom: 12 }}>No saved payment methods yet.</Text>
          )}

          {paymentMethodType === 'card' && (
            <>
              <PaymentCardField
                postalCodeEnabled={true}
                placeholder={{ number: '4242 4242 4242 4242' }}
                cardStyle={{ backgroundColor: 'white', textColor: 'black' }}
                style={{ height: 50, marginVertical: 10 }}
                onCardChange={handleCardDetailsChange}
              />
            </>
          )}

          {paymentMethodType === 'local' && (
            <TextInput
              style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 6, padding: 8, width: '100%', marginBottom: 8, color: 'black' }}
              placeholder="Reference Number"
              value={localReference}
              onChangeText={handleLocalReferenceChange}
            />
          )}

          <Button
            title={savingPaymentMethod ? 'Saving...' : paymentMethodSaved ? 'Payment Method Saved' : 'Save Payment Method'}
            color={COLORS.primary}
            onPress={handleSavePaymentMethod}
            disabled={
              savingPaymentMethod ||
              (paymentMethodType === 'card' && !cardDetails?.complete) ||
              (paymentMethodType === 'local' && !localReference)
            }
          />
        </View>
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
            onPress={handleWithdraw}
            disabled={withdrawalLoading || !paymentMethodSaved}
          />
          {withdrawalStatus === 'success' && (
            <Text style={{ color: 'green', marginTop: 8 }}>Withdrawal Successful!</Text>
          )}
          {withdrawalStatus === 'failed' && (
            <Text style={{ color: 'red', marginTop: 8 }}>Withdrawal Failed.</Text>
          )}
        </View>
        <Modal visible={showAccountModal} animationType="slide" onRequestClose={() => setShowAccountModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: 'blue' }}>Payment History</Text>
            {paymentHistoryLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={{ color: 'gray', marginTop: 12 }}>Loading history...</Text>
              </View>
            ) : (
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
            )}
            <Button title="Close" onPress={() => setShowAccountModal(false)} color={'blue'} />
          </View>
        </Modal>
      </View>
    </PaymentStripeProvider>
  );
}
