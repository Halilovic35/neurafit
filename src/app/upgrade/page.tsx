'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { CheckIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const premiumFeatures = [
  'Personalized AI workout recommendations',
  'Custom meal plans based on your goals',
  'Advanced progress tracking',
  'Priority support',
  'Ad-free experience',
  'Access to premium workouts',
];

type PaymentMethod = 'stripe' | 'paypal';

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async (paymentMethod: PaymentMethod) => {
    setLoading(true);

    try {
      const endpoint = paymentMethod === 'stripe' 
        ? '/api/payments/create-checkout'
        : '/api/payments/create-paypal-order';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_monthly_premium',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (paymentMethod === 'stripe') {
          window.location.href = data.url;
        } else {
          window.location.href = data.approvalUrl;
        }
      } else {
        throw new Error(data.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Failed to process upgrade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
        >
          <div className="px-6 py-8 sm:p-10">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                Upgrade to Premium
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Take your fitness journey to the next level with premium features
              </p>
            </div>

            <div className="mt-8">
              <div className="flex justify-center">
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                    $9.99
                  </span>
                  <span className="ml-2 text-2xl font-medium text-gray-500 dark:text-gray-400">
                    /month
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {premiumFeatures.map((feature) => (
                  <div key={feature} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-500" />
                    <span className="ml-3 text-base text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-8 bg-gray-50 dark:bg-gray-700 sm:px-10">
            <div className="space-y-4">
              <div className="text-center">
                <button
                  onClick={() => handleUpgrade('stripe')}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Image
                        src="/stripe-logo.svg"
                        alt="Stripe"
                        width={20}
                        height={20}
                        className="mr-2"
                      />
                      Pay with Card
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    Or
                  </span>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => handleUpgrade('paypal')}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Image
                        src="/paypal-logo.svg"
                        alt="PayPal"
                        width={20}
                        height={20}
                        className="mr-2"
                      />
                      Pay with PayPal
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cancel anytime. 30-day money-back guarantee.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 