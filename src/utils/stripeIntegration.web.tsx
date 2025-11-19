import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Stripe, StripeCardElementOptions } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { ReactNode, useCallback, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

type StripePromiseCache = Record<string, Promise<Stripe | null>>;

const stripePromiseCache: StripePromiseCache = {};

function getStripePromise(publishableKey?: string) {
  const key = publishableKey ?? '';
  if (!stripePromiseCache[key]) {
    stripePromiseCache[key] = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromiseCache[key];
}

type ProviderProps = {
  publishableKey?: string;
  children?: ReactNode;
};

export function PaymentStripeProvider({ publishableKey, children }: ProviderProps) {
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);
  return <Elements stripe={stripePromise}>{children}</Elements>;
}

type CardFieldProps = {
  onCardChange?: (details: { complete: boolean; brand?: string | null; last4?: string | null }) => void;
  cardStyle?: {
    backgroundColor?: string;
    textColor?: string;
    placeholderColor?: string;
  };
  style?: StyleProp<ViewStyle>;
  postalCodeEnabled?: boolean;
  placeholder?: {
    number?: string;
  };
  [key: string]: unknown;
};

const baseCardStyles = {
  base: {
    color: '#111111',
    fontSize: '16px',
    fontFamily: 'system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif',
    '::placeholder': {
      color: '#888888',
    },
  },
  invalid: {
    color: '#d32f2f',
  },
} as const;

export function PaymentCardField({
  onCardChange,
  cardStyle,
  style,
  postalCodeEnabled = false,
  placeholder: _placeholder,
  ...rest
}: CardFieldProps) {
  const mergedOptions = useMemo<StripeCardElementOptions>(() => {
    const base = {
      ...baseCardStyles.base,
      color: cardStyle?.textColor ?? baseCardStyles.base?.color,
      '::placeholder': {
        ...(baseCardStyles.base?.['::placeholder'] || {}),
        color: cardStyle?.placeholderColor ?? baseCardStyles.base?.['::placeholder']?.color,
      },
    };

    return {
      style: {
        base,
        invalid: baseCardStyles.invalid,
      },
      hidePostalCode: !postalCodeEnabled,
    };
  }, [cardStyle, postalCodeEnabled]);

  const handleChange = useCallback(
    (event: any) => {
      onCardChange?.({
        complete: Boolean(event.complete),
        brand: event.brand ?? event.card?.brand ?? null,
        last4: event.card?.last4 ?? null,
      });
    },
    [onCardChange]
  );

  const backgroundStyle = cardStyle?.backgroundColor
    ? { backgroundColor: cardStyle.backgroundColor }
    : { backgroundColor: '#ffffff' };

  return (
    <View
      style={[
        { width: '100%', minHeight: 50, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8 },
        backgroundStyle,
        style,
      ]}
    >
      {/* Spread remaining props to stay compatible with native CardField sets */}
      <CardElement onChange={handleChange} options={mergedOptions} {...rest} />
    </View>
  );
}

export function usePaymentConfirm() {
  const stripe = useStripe();
  const elements = useElements();

  const confirmPayment = useCallback(
    async (clientSecret: string) => {
      if (!stripe || !elements) {
        return {
          paymentIntent: null,
          error: { message: 'Stripe has not finished loading. Please try again shortly.' },
        };
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        return {
          paymentIntent: null,
          error: { message: 'Card details are incomplete.' },
        };
      }

      return stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });
    },
    [stripe, elements]
  );

  return { confirmPayment };
}
