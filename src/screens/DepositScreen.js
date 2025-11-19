import { useMemo } from 'react';
import { Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import PaymentScreen from './PaymentScreen';

export default function DepositScreen({ route, navigation }) {
  const contract = route?.params?.contract;
  const contractId =
    contract?._id || contract?.id || contract?.contractId || route?.params?.contractId || '';

  const paymentRoute = useMemo(
    () => ({
      params: {
        contract,
        contractId,
        userRole: route?.params?.userRole,
        from: 'deposit-screen',
      },
    }),
    [contract, contractId, route?.params?.userRole]
  );

  if (!contract) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'white' }}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>No contract found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <BackButton />
      <View style={{ flex: 1 }}>
        <PaymentScreen route={paymentRoute} navigation={navigation} />
      </View>
    </View>
  );
}
