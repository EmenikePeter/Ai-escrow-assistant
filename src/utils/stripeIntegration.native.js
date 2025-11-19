import { CardField, StripeProvider, useConfirmPayment } from '@stripe/stripe-react-native';

export const PaymentStripeProvider = StripeProvider;
export const PaymentCardField = CardField;
export const usePaymentConfirm = useConfirmPayment;
