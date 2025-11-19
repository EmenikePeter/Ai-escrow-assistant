import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../config/env';
import { COLORS } from '../constants/Theme';
import { useUser } from '../context/UserContext';
import { getWithAuth, postWithAuth } from '../utils/api';
import { validateColor } from '../utils/colorValidator';
import { PaymentCardField, PaymentStripeProvider, usePaymentConfirm } from '../utils/stripeIntegration';

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

function PaymentScreenContent(props) {
  const { route, publishableKey } = props;
  const { user } = useUser();
  // Payment method state
  // Payment method selection
  const [paymentMethodType, setPaymentMethodType] = useState('card');
  const [paymentMethodSaved, setPaymentMethodSaved] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [localReference, setLocalReference] = useState('');
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);

  // Bank details for payout
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState('');

  // Save payment method handler
  const handleSavePaymentMethod = async () => {
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
  };

  // Withdrawal handler
  const handleWithdraw = async () => {
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
  };
  // Payout state
  const [payoutStatus, setPayoutStatus] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Request payout handler
  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    try {
      const res = await postWithAuth(`${API_BASE_URL}/api/payout`, {
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
      const message = err?.response?.data?.message || err.message || 'Failed to request payout.';
      Alert.alert('Error', message);
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
    validateColor('#000', 'PaymentCardField.textColor');
    validateColor('#fff', 'PaymentCardField.backgroundColor');
    validateColor('#eee', 'ProgressBar.backgroundColor');
    validateColor('#ccc', 'PlatformFeeInput.borderColor');
    validateColor('green', 'EscrowedText.color');
    validateColor('#888', 'UnauthorizedText.color');
  }, []);
  // Fee customization state
  const initialContract = route?.params?.contract || null;
  const initialContractId =
    route?.params?.contractId ||
    initialContract?._id ||
    initialContract?.id ||
    initialContract?.contractId ||
    '';
  const [contract, setContract] = useState(initialContract);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState('');
  const contractId = contract?._id || contract?.id || contract?.contractId || initialContractId;
  const isContractFlow = !!contractId;
  const [customFee, setCustomFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [escrowed, setEscrowed] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [cardDetails, setCardDetails] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [freelancerAccountId, setFreelancerAccountId] = useState(initialContract?.freelancerStripeAccountId || '');
  const [riskSignals, setRiskSignals] = useState({ flags: [], summary: '' });
  const [riskLoading, setRiskLoading] = useState(false);
  const userRole = route?.params?.userRole;
  const { confirmPayment } = usePaymentConfirm();

  const fetchContract = useCallback(async () => {
    if (!contractId) return;
    setContractLoading(true);
    setContractError('');
    try {
      const res = await getWithAuth(`${API_BASE_URL}/api/contracts/${contractId}`);
      if (res?.data?.contract) {
        setContract(res.data.contract);
      }
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to load contract details.';
      setContractError(message);
    } finally {
      setContractLoading(false);
    }
  }, [contractId]);

  const fetchRiskSignals = useCallback(async () => {
    if (!contractId) return;
    setRiskLoading(true);
    try {
      const res = await getWithAuth(`${API_BASE_URL}/api/contracts/${contractId}/risk`);
      setRiskSignals({
        flags: Array.isArray(res?.data?.flags) ? res.data.flags : [],
        summary: res?.data?.summary || '',
      });
    } catch (err) {
      setRiskSignals({ flags: [], summary: '' });
    } finally {
      setRiskLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (isContractFlow && contractId && (!contract || (contract._id || contract.id || contract.contractId) !== contractId)) {
      fetchContract();
    }
  }, [contractId, isContractFlow, contract, fetchContract]);

  useEffect(() => {
    if (isContractFlow && contractId) {
      fetchRiskSignals();
    }
  }, [contractId, isContractFlow, fetchRiskSignals]);

  useEffect(() => {
    if (contract?.freelancerStripeAccountId) {
      setFreelancerAccountId(contract.freelancerStripeAccountId);
    }
  }, [contract?.freelancerStripeAccountId]);

  useEffect(() => {
    if (contract?.localPaymentReference) {
      setLocalReference(contract.localPaymentReference);
    }
  }, [contract?.localPaymentReference]);

  useEffect(() => {
    if (contract?.escrowStatus) {
      const fundedStatuses = ['funded', 'partially_released', 'released', 'payout_requested', 'completed'];
      setEscrowed(fundedStatuses.includes(contract.escrowStatus));
    }
    if (contract?.lastPaymentIntentId) {
      setPaymentIntentId(contract.lastPaymentIntentId);
    }
  }, [contract?.escrowStatus, contract?.lastPaymentIntentId]);

  const handleDeposit = async () => {
    if (!contractId) {
      Alert.alert('Missing Contract', 'A contract is required to deposit funds.');
      return;
    }
    const workingContract = contract || initialContract;
    if (!workingContract) {
      Alert.alert('Missing Contract', 'Contract details are still loading.');
      return;
    }
    if (paymentMethodType === 'card' && !cardDetails?.complete) {
      Alert.alert('Incomplete Card', 'Enter complete card details before depositing.');
      return;
    }
    if (paymentMethodType === 'local' && !localReference) {
      Alert.alert('Missing Reference', 'Add a reference number for your local payment method.');
      return;
    }
    setLoading(true);
    try {
      // 1. Get PaymentIntent clientSecret from backend
      // Use custom fee if provided, else default to 5%
      const platformFee = customFee !== '' ? Number(customFee) : workingContract.fee || workingContract.amount * 0.05;
      const res = await postWithAuth(`${API_BASE_URL}/api/create-payment-intent`, {
        amount: workingContract.amount,
        currency: 'usd',
        freelancerStripeAccountId: workingContract.freelancerStripeAccountId,
        fee: platformFee,
        recipientUuid: workingContract.recipientUuid, // Pass UUID for backend routing
        contractId,
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
        // Refresh stored payment methods after a successful deposit in case a new card was saved by Stripe
        fetchPaymentMethods();
        await postWithAuth(`${API_BASE_URL}/api/contracts/${contractId}/escrow/confirm`, {
          paymentIntentId: paymentIntent.id,
          amount: workingContract.amount,
          currency: 'usd',
          methodType: 'card',
        });
        await fetchContract();
        await fetchRiskSignals();
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to process payment.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalPay = useCallback(async () => {
    if (!contractId) {
      Alert.alert('Missing Contract', 'A contract is required to submit a local payment.');
      return;
    }
    const workingContract = contract || initialContract;
    if (!workingContract) {
      Alert.alert('Missing Contract', 'Contract details are still loading.');
      return;
    }
    if (!localReference) {
      Alert.alert('Missing Reference', 'Add a reference number for your local payment method.');
      return;
    }
    setLoading(true);
    try {
      const res = await postWithAuth(`${API_BASE_URL}/api/payments/local`, {
        contractId,
        reference: localReference,
      });
      setEscrowed(true);
      Alert.alert('Local Payment Recorded', res?.data?.message || 'Local payment has been submitted for review.');
      if (res?.data?.contract) {
        setContract(res.data.contract);
      }
      await fetchContract();
      await fetchRiskSignals();
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to record local payment.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [contractId, contract, initialContract, localReference, fetchContract, fetchRiskSignals]);

  const handleApplePay = useCallback(() => {
    Alert.alert('Not Available', 'Apple Pay support is not enabled yet.');
  }, []);

  const handleGooglePay = useCallback(() => {
    Alert.alert('Not Available', 'Google Pay support is not enabled yet.');
  }, []);

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

  const handleReleaseFunds = async () => {
    if (!paymentIntentId) {
      Alert.alert('Error', 'No escrowed payment found.');
      return;
    }
    setLoading(true);
    try {
      const res = await postWithAuth(`${API_BASE_URL}/api/release-funds`, {
        paymentIntentId,
      });
      if (res.data.success) {
        Alert.alert('Funds Released', 'Payment has been sent to freelancer.');
      } else {
        Alert.alert('Error', 'Failed to release funds.');
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to release funds.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  // Onboarding handler
  const handleStripeOnboarding = async () => {
    try {
      const res = await postWithAuth(`${API_BASE_URL}/api/create-stripe-account`, {
        email: contract.freelancerEmail, // or get from user context
      });
      setFreelancerAccountId(res.data.accountId);
      setOnboardingUrl(res.data.onboardingUrl);
      setShowOnboarding(true);

      // TODO: Save accountId to backend for this freelancer (call user update endpoint)
      // await postWithAuth('/api/update-freelancer-stripe-id', { email: ..., accountId: res.data.accountId });
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to start Stripe onboarding.';
      Alert.alert('Error', message);
    }
  };

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);

  const contractLocalReference = contract?.localPaymentReference || '';

  useEffect(() => {
    if (contractLocalReference) {
      setLocalReference(contractLocalReference);
    }
  }, [contractLocalReference]);

  const userIdentifier = user?.uuid || user?._id || user?.id || user?.email || '';
  const userEmail = user?.email || '';

  const isApplePayAvailable = false;
  const isGooglePayAvailable = false;
  const isLocalMethodAvailable = true;

  const paymentOptions = useMemo(
    () => [
      { type: 'card', label: 'Card', enabled: true },
      { type: 'applepay', label: 'Apple Pay', enabled: isApplePayAvailable },
      { type: 'googlepay', label: 'Google Pay', enabled: isGooglePayAvailable },
      { type: 'local', label: 'Local Method', enabled: isLocalMethodAvailable },
    ],
    [isApplePayAvailable, isGooglePayAvailable, isLocalMethodAvailable]
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
      console.warn('[PaymentScreen] Failed to load payment methods', err?.response?.data || err.message);
      setPaymentMethods([]);
    } finally {
      setPaymentMethodsLoading(false);
    }
  }, [userIdentifier]);

  useEffect(() => {
    if (!userIdentifier) return;
    fetchPaymentMethods();
  }, [userIdentifier, fetchPaymentMethods]);

  const fetchPaymentHistory = useCallback(async () => {
    if (!userIdentifier) return;
    setPaymentHistoryLoading(true);
    try {
      const historyUrl = contractId
        ? `${API_BASE_URL}/api/wallet/history?contractId=${contractId}`
        : `${API_BASE_URL}/api/wallet/history`;
      const res = await getWithAuth(historyUrl);
      const history = Array.isArray(res?.data?.history)
        ? res.data.history
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setPaymentHistory(history);
    } catch (err) {
      console.warn('[PaymentScreen] Failed to load wallet history', err?.response?.data || err.message);
      setPaymentHistory([]);
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, [contractId, userIdentifier]);

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

  if (!contract) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'white' }}>
        <Ionicons name="card-outline" size={36} color={'blue'} />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'blue', marginTop: 8 }}>Payment</Text>
        <View style={{ marginTop: 24, width: '100%', backgroundColor: 'white', borderRadius: 12, padding: 16, elevation: 2, shadowColor: 'gray', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <Text style={{ fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 }}>Select Payment Method</Text>
            {/* Payment method selection UI */}
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

{/* Card Payment UI */}
{paymentMethodType === 'card' && (
  <>
    <PaymentCardField
      postalCodeEnabled={true}
      placeholder={{ number: '4242 4242 4242 4242' }}
      cardStyle={{ backgroundColor: 'white', textColor: 'black' }}
      style={{ height: 50, marginVertical: 10 }}
      onCardChange={handleCardDetailsChange}
    />
    <Button
      title={loading ? 'Processing...' : 'Deposit Funds'}
      onPress={handleDeposit}
      disabled={loading || !cardDetails?.complete}
    />
  </>
)}

{/* Apple Pay UI */}
{isApplePayAvailable && paymentMethodType === 'applepay' && (
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
{isGooglePayAvailable && paymentMethodType === 'googlepay' && (
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
      onChangeText={handleLocalReferenceChange}
    />
    <Button
      title={loading ? 'Processing...' : 'Deposit with Local Method'}
      onPress={handleLocalPay}
      disabled={loading || !localReference}
    />
  </>
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
      </View>
    );
  }

  const progress = getProgress(contract.deadline);

  return (
    <>
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
              {/* Payment method input fields and save button */}
              {/* ...existing payment method UI... */}
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
            {/* Payment method input fields for contract deposit only */}
            {paymentMethodType === 'card' && (
              <>
                <PaymentCardField
                  postalCodeEnabled={true}
                  placeholder={{ number: '4242 4242 4242 4242' }}
                  cardStyle={{ backgroundColor: 'white', textColor: 'black' }}
                  style={{ height: 50, marginVertical: 10 }}
                  onCardChange={handleCardDetailsChange}
                />
                <Button
                  title={loading ? 'Processing...' : 'Deposit Funds'}
                  onPress={handleDeposit}
                  disabled={loading || !cardDetails?.complete}
                />
              </>
            )}

            {isApplePayAvailable && paymentMethodType === 'applepay' && (
              <>
                <Text style={{ color: 'gray', marginBottom: 8 }}>Apple Pay will be used at checkout.</Text>
                <Button
                  title={loading ? 'Processing...' : 'Deposit with Apple Pay'}
                  onPress={handleApplePay}
                  disabled={loading}
                />
              </>
            )}

            {isGooglePayAvailable && paymentMethodType === 'googlepay' && (
              <>
                <Text style={{ color: 'gray', marginBottom: 8 }}>Google Pay will be used at checkout.</Text>
                <Button
                  title={loading ? 'Processing...' : 'Deposit with Google Pay'}
                  onPress={handleGooglePay}
                  disabled={loading}
                />
              </>
            )}

            {paymentMethodType === 'local' && (
              <>
                <Text style={{ color: 'gray', marginBottom: 8 }}>Provide the reference ID from your local transfer.</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 6, padding: 8, width: '100%', marginBottom: 8, color: 'black' }}
                  placeholder="Reference Number"
                  value={localReference}
                  onChangeText={handleLocalReferenceChange}
                />
                <Button
                  title={loading ? 'Processing...' : 'Submit Local Payment'}
                  onPress={handleLocalPay}
                  disabled={loading || !localReference}
                />
              </>
            )}

            {escrowed && (
              <View style={{ marginTop: 16 }}>
                <Button
                  title={loading ? 'Processing...' : 'Release Funds'}
                  onPress={handleReleaseFunds}
                  disabled={loading}
                  color={'green'}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </>
  );
}
function PaymentScreen({ route }) {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  return (
    <PaymentStripeProvider publishableKey={publishableKey}>
      <PaymentScreenContent route={route} publishableKey={publishableKey} />
    </PaymentStripeProvider>
  );
}

export default PaymentScreen;
