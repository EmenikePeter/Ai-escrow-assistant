import { Ionicons } from '@expo/vector-icons';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Alert, Button, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../config/env';
import { COLORS } from '../constants/Theme';
import { validateColor } from '../utils/colorValidator';
import { StripeProvider } from '../utils/StripeProvider';

// Use API_BASE_URL from .env

function getProgress(deadline) {
  const start = new Date();
  const end = new Date(deadline);
  const now = new Date();
  if (isNaN(end.getTime())) return 0.5;
  const total = end - start;
  const elapsed = now - start;
  return Math.max(0, Math.min(1, elapsed / total));
}

function PaymentScreen({ route }) {
  // Payment method state
  // Payment method selection
  const [paymentMethodType, setPaymentMethodType] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [paymentMethodSaved, setPaymentMethodSaved] = useState(false);

  // Bank details for payout
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState('');

  // Save payment method handler
  const handleSavePaymentMethod = async () => {
    // Simulate saving payment method (replace with backend call if needed)
    setPaymentMethodSaved(true);
    Alert.alert('Payment Method Saved', 'Your payment method has been saved.');
  };

  // Withdrawal handler
  const handleWithdraw = async () => {
    if (!bankName || !accountNumber || !iban || !accountHolder) {
      Alert.alert('Missing Details', 'Please fill in all bank details.');
      return;
    }
    setWithdrawalLoading(true);
    try {
      // Simulate withdrawal (replace with backend call if needed)
      setTimeout(() => {
        setWithdrawalStatus('success');
        setWithdrawalLoading(false);
        Alert.alert('Withdrawal Successful', 'Funds have been withdrawn.');
      }, 1500);
    } catch (err) {
      setWithdrawalStatus('failed');
      setWithdrawalLoading(false);
      Alert.alert('Error', err.message);
    }
  };
  // Payout state
  const [payoutStatus, setPayoutStatus] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Request payout handler
  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    try {
  const res = await axios.post(`${API_BASE_URL}/api/payout`, {
        uuid: contract.recipientUuid,
        amount: contract.amount,
        currency: 'usd',
      });
      if (res.data.payout && res.data.payout.status) {
        setPayoutStatus(res.data.payout.status);
        Alert.alert('Payout Requested', `Status: ${res.data.payout.status}`);
      } else {
        setPayoutStatus('failed');
        Alert.alert('Error', 'Failed to request payout.');
      }
    } catch (err) {
      setPayoutStatus('failed');
      Alert.alert('Error', err.message);
    }
    setPayoutLoading(false);
  };
  useEffect(() => {
  validateColor(COLORS.primary, 'COLORS.primary');
  validateColor(COLORS.text, 'COLORS.text');
  validateColor(COLORS.background, 'COLORS.background');
  validateColor(COLORS.card, 'COLORS.card');
  validateColor(COLORS.border, 'COLORS.border');
    // Validate all hardcoded color values used in inline styles
    validateColor('#000', 'CardField.textColor');
    validateColor('#fff', 'CardField.backgroundColor');
    validateColor('#eee', 'ProgressBar.backgroundColor');
    validateColor('#ccc', 'PlatformFeeInput.borderColor');
    validateColor('green', 'EscrowedText.color');
    validateColor('#888', 'UnauthorizedText.color');
  }, []);
  // Fee customization state
  const [customFee, setCustomFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [escrowed, setEscrowed] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [cardDetails, setCardDetails] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [freelancerAccountId, setFreelancerAccountId] = useState(route?.params?.contract?.freelancerStripeAccountId || '');
  const contract = route?.params?.contract;
  // Determine if this screen is being used for a contract flow or tab/account flow
  const isContractFlow = !!contract;
  const userRole = route?.params?.userRole;
  const { confirmPayment } = useConfirmPayment();

  const handleDeposit = async () => {
    setLoading(true);
    try {
      // 1. Get PaymentIntent clientSecret from backend
      // Use custom fee if provided, else default to 5%
      const platformFee = customFee !== '' ? Number(customFee) : contract.fee || contract.amount * 0.05;
  const res = await axios.post(`${API_BASE_URL}/api/create-payment-intent`, {
        amount: contract.amount,
        currency: 'usd',
        freelancerStripeAccountId: contract.freelancerStripeAccountId,
        fee: platformFee,
        recipientUuid: contract.recipientUuid, // Pass UUID for backend routing
      });
      const clientSecret = res.data.clientSecret;

      // 2. Confirm payment with Stripe
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        type: 'Card',
        billingDetails: {}, // Optionally add billing details
      });

      if (error) {
        Alert.alert('Payment failed', error.message);
      } else if (paymentIntent) {
        setEscrowed(true);
        setPaymentIntentId(paymentIntent.id);
        Alert.alert('Payment successful!', 'Funds are now in escrow.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  const handleReleaseFunds = async () => {
    if (!paymentIntentId) {
      Alert.alert('Error', 'No escrowed payment found.');
      return;
    }
    setLoading(true);
    try {
  const res = await axios.post(`${API_BASE_URL}/api/release-funds`, {
        paymentIntentId,
      });
      if (res.data.success) {
        Alert.alert('Funds Released', 'Payment has been sent to freelancer.');
      } else {
        Alert.alert('Error', 'Failed to release funds.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  // Onboarding handler
  const handleStripeOnboarding = async () => {
    try {
  const res = await axios.post(`${API_BASE_URL}/api/create-stripe-account`, {
        email: contract.freelancerEmail, // or get from user context
      });
      setFreelancerAccountId(res.data.accountId);
      setOnboardingUrl(res.data.onboardingUrl);
      setShowOnboarding(true);

      // TODO: Save accountId to backend for this freelancer (call user update endpoint)
      // await axios.post('/api/update-freelancer-stripe-id', { email: ..., accountId: res.data.accountId });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    // Fetch payment history for current user (by uuid)
    const fetchHistory = async () => {
      try {
        const uuid = route?.params?.userUuid || contract?.recipientUuid;
        if (!uuid) return;
        const res = await fetch(`/api/payouts?uuid=${uuid}`);
        const data = await res.json();
        setPaymentHistory(data.payouts || []);
      } catch (err) {
        setPaymentHistory([]);
      }
    };
    if (showAccountModal) fetchHistory();
  }, [showAccountModal]);

  if (!contract) {
    return (
      <StripeProvider publishableKey="pk_test_51RNoEOQxvR5fEokOLaTo3se939jgPBNjzBCeIwj7gwZM0DCNWE1TYSiPX5eAl35TafBk46R3o8n3wpgk0l4JhhtS00ZWRoTYEr">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'white' }}>
          <Ionicons name="card-outline" size={36} color={'blue'} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'blue', marginTop: 8 }}>Payment</Text>
          <View style={{ marginTop: 24, width: '100%', backgroundColor: 'white', borderRadius: 12, padding: 16, elevation: 2, shadowColor: 'gray', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>Select Payment Method</Text>
            {/* Payment method selection UI */}
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

{/* Card Payment UI */}
{paymentMethodType === 'card' && (
  <>
    <CardField
      postalCodeEnabled={true}
      placeholder={{ number: '4242 4242 4242 4242' }}
      cardStyle={{ backgroundColor: 'white', textColor: 'black' }}
      style={{ height: 50, marginVertical: 10 }}
      onCardChange={setCardDetails}
    />
    <Button
      title={loading ? 'Processing...' : 'Deposit Funds'}
      onPress={handleDeposit}
      disabled={loading || !cardDetails?.complete}
    />
  </>
)}

{/* Apple Pay UI */}
{paymentMethodType === 'applepay' && (
  <>
    <Text style={{ color: 'gray', marginBottom: 8 }}>Apple Pay will be used at checkout.</Text>
    <Button
      title={loading ? 'Processing...' : 'Deposit with Apple Pay'}
      onPress={handleApplePay}
      disabled={loading}
    />
  </>
)}

{/* Google Pay UI */}
{paymentMethodType === 'googlepay' && (
  <>
    <Text style={{ color: 'gray', marginBottom: 8 }}>Google Pay will be used at checkout.</Text>
    <Button
      title={loading ? 'Processing...' : 'Deposit with Google Pay'}
      onPress={handleGooglePay}
      disabled={loading}
    />
  </>
)}

{/* Local Payment UI */}
{paymentMethodType === 'local' && (
  <>
    <Text style={{ color: 'gray', marginBottom: 8 }}>Local payment method will be used at checkout.</Text>
    <TextInput
      style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 6, padding: 8, width: '100%', marginBottom: 8, color: 'black' }}
      placeholder="Reference Number"
      value={localReference}
      onChangeText={setLocalReference}
    />
    <Button
      title={loading ? 'Processing...' : 'Deposit with Local Method'}
      onPress={handleLocalPay}
      disabled={loading || !localReference}
    />
  </>
)}
            <Button
              title={paymentMethodSaved ? 'Payment Method Saved' : 'Save Payment Method'}
              color={COLORS.primary}
              onPress={handleSavePaymentMethod}
              disabled={paymentMethodSaved || (paymentMethodType === 'card' && (!cardNumber || !cardExpiry || !cardCVC))}
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
        </View>
      </StripeProvider>
    );
  }

  const progress = getProgress(contract.deadline);

  return (
    <StripeProvider publishableKey="pk_test_51RNoEOQxvR5fEokOLaTo3se939jgPBNjzBCeIwj7gwZM0DCNWE1TYSiPX5eAl35TafBk46R3o8n3wpgk0l4JhhtS00ZWRoTYEr">
      <View style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
  {/* Removed duplicate Account button row. Only show horizontal Payment header row with Account button. */}
        {/* Payment icon, header, and Account button in one row for tab screen only */}
        {!isContractFlow && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Ionicons name="card-outline" size={36} color={'blue'} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'blue', marginRight: 8 }}>Payment</Text>
            <TouchableOpacity onPress={() => setShowAccountModal(true)} style={{ marginLeft: 8 }}>
              <Ionicons name="person-circle-outline" size={28} color={'blue'} />
            </TouchableOpacity>
          </View>
        )}
        {/* Header for contract payment screen only */}
        {isContractFlow && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'blue' }}>Contract Payment</Text>
          </View>
        )}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="card-outline" size={36} color={'blue'} />
        </View>
        {/* Tab PaymentScreen: payment method management, withdrawal, account history */}
        {!isContractFlow && (
          <>
            <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: 'gray', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
              <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>Select Payment Method</Text>
              {/* Payment method selection UI */}
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
                onPress={handleSavePaymentMethod}
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
                onPress={handleWithdraw}
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
          </>
        )}
        {/* Contract PaymentScreen: contract details and deposit only */}
        {isContractFlow && (
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: 'gray', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <Text style={{ color: 'black' }}>Contract: {contract.title}</Text>
            <Text style={{ color: 'black' }}>Amount: ${contract.amount}</Text>
            <Text style={{ color: escrowed ? 'green' : 'black', fontWeight: 'bold', marginTop: 8 }}>
              {escrowed ? 'Funds in Escrow' : 'Awaiting Deposit'}
            </Text>
            {/* Payment method picker/input for contract deposit */}
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
            {/* Payment method input fields for contract deposit only */}
            {/* ...existing payment method UI for deposit... */}
            <Button
              title={loading ? 'Processing...' : 'Deposit Funds'}
              onPress={handleDeposit}
              disabled={loading || !cardDetails?.complete}
            />
          </View>
        )}
      </View>
    </StripeProvider>
  );
}

export default PaymentScreen;
