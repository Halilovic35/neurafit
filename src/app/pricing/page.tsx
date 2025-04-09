'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/outline';

const tiers = [
  {
    name: 'Free',
    id: 'free',
    price: '0',
    description: 'Perfect for getting started with basic fitness tracking.',
    features: [
      'Basic workout plans',
      'Step tracking',
      'Basic progress monitoring',
      'Limited meal suggestions',
      'Community access',
    ],
    cta: 'Get Started',
    href: '/register',
  },
  {
    name: 'Monthly Premium',
    id: 'premium-monthly',
    price: '9.99',
    description: 'Everything you need for advanced fitness and nutrition tracking.',
    features: [
      'Advanced AI workout plans',
      'Personalized meal plans',
      'Detailed progress analytics',
      'AI chat support 24/7',
      'Premium workout library',
      'Advanced hydration tracking',
      'Custom workout scheduling',
      'Priority support',
    ],
    cta: 'Start Monthly',
    href: '/register?plan=premium-monthly',
  },
  {
    name: 'Quarterly Premium',
    id: 'premium-quarterly',
    price: '19.99',
    period: '3 months',
    savings: 'Save 33%',
    description: 'Most popular choice with great savings.',
    features: [
      'All Monthly Premium features',
      'Save $10 vs monthly plan',
      'Quarterly progress reports',
      'Extended workout history',
      'Advanced goal tracking',
      'Premium support priority',
      'Early access to new features',
      'Customizable dashboard',
    ],
    cta: 'Start Quarterly',
    href: '/register?plan=premium-quarterly',
    featured: true,
  },
  {
    name: 'Yearly Premium',
    id: 'premium-yearly',
    price: '59.99',
    period: 'year',
    savings: 'Save 50%',
    description: 'Best value for long-term commitment.',
    features: [
      'All Quarterly Premium features',
      'Save $60 vs monthly plan',
      'Annual fitness assessment',
      'Personal training consultation',
      'Premium workout templates',
      'VIP support access',
      'Custom exercise library',
      'Advanced analytics exports',
    ],
    cta: 'Start Yearly',
    href: '/register?plan=premium-yearly',
  },
];

const faqs = [
  {
    question: 'Can I cancel my subscription at any time?',
    answer:
      'Yes, you can cancel your Premium subscription at any time. Your benefits will continue until the end of your current billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, PayPal, and Apple Pay for secure and convenient payments.',
  },
  {
    question: 'Is there a free trial for Premium?',
    answer:
      'Yes, new users can try Premium features free for 7 days. Cancel anytime during the trial period.',
  },
  {
    question: 'Can I switch between plans?',
    answer:
      'Yes, you can upgrade to Premium or downgrade to Free at any time. Changes take effect at the end of your billing cycle.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-xl text-gray-600 dark:text-gray-300"
          >
            Choose the plan that best fits your fitness journey
          </motion.p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-4 lg:gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`relative rounded-2xl ${
                tier.featured
                  ? 'bg-indigo-600 text-white shadow-xl'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-1 ring-gray-200 dark:ring-gray-700'
              }`}
            >
              <div className="p-8 h-full flex flex-col">
                <h3
                  className={`text-2xl font-semibold leading-8 ${
                    tier.featured ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {tier.name}
                </h3>
                {tier.savings && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tier.featured ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                    } mt-2`}
                  >
                    {tier.savings}
                  </span>
                )}
                <p
                  className={`mt-4 text-sm leading-6 ${
                    tier.featured ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tier.description}
                </p>
                <div className="mt-6">
                  <div className="flex items-baseline gap-x-1">
                    <span
                      className={`text-4xl font-bold tracking-tight ${
                        tier.featured ? 'text-white' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      ${tier.price}
                    </span>
                    <span
                      className={`text-sm font-semibold leading-6 ${
                        tier.featured ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {tier.period ? `/${tier.period}` : '/month'}
                    </span>
                  </div>
                </div>
                <ul
                  role="list"
                  className={`mt-8 space-y-3 text-sm leading-6 ${
                    tier.featured ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        className={`h-6 w-5 flex-none ${
                          tier.featured ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`mt-auto block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    tier.featured
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50 focus-visible:outline-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {faq.question}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Home
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
} 