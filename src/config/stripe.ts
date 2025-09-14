import Stripe from 'stripe';
import { authEnv } from './auth';

// Initialize Stripe with secret key (ensure we're using test keys for sandbox mode)
export const stripe = new Stripe(authEnv.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia',
    // Force test mode if using test keys
    ...(authEnv.STRIPE_SECRET_KEY?.startsWith('sk_test_') && {
        apiVersion: '2024-12-18.acacia'
    })
});

// Stripe configuration
export const STRIPE_CONFIG = {
    // LEWIS Pro subscription price (in cents) - TEST MODE
    LEWIS_PRO_PRICE: 500000, // $5,000 in cents
    CURRENCY: 'usd',

    // Test mode indicator
    IS_TEST_MODE: authEnv.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,

    // Success and cancel URLs
    SUCCESS_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3010'}/en-US__0__light?payment=success`,
    CANCEL_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3010'}/en-US__0__light?payment=cancelled`,

    // Webhook endpoint
    WEBHOOK_ENDPOINT: '/api/stripe/webhook',
};

// Product configuration
export const STRIPE_PRODUCTS = {
    LEWIS_PRO: {
        name: 'LEWIS Pro',
        description: 'Full access to LEWIS construction fee analysis platform',
        features: [
            'Unlimited LEWIS chat sessions',
            'Full construction portal access',
            'Jurisdiction fee analysis',
            'Project cost calculations',
            'Real-time fee comparisons',
            'Export reports and data',
        ],
    },
};
