'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarIcon,
  BeakerIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'AI-Driven Customization',
    description:
      'Our advanced AI analyzes your profile to create the perfect workout and meal plans tailored to your goals.',
    icon: BoltIcon,
  },
  {
    name: 'Smart Meal Planning',
    description:
      'Get personalized meal plans that match your dietary preferences and nutritional needs.',
    icon: BeakerIcon,
  },
  {
    name: '24/7 AI Chat Assistant',
    description:
      'Your virtual fitness coach is always available to answer questions and provide guidance.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: 'Progress Tracking',
    description:
      'Track your workouts, measurements, and progress with detailed analytics and insights.',
    icon: ChartBarIcon,
  },
  {
    name: 'Community Support',
    description:
      'Connect with like-minded individuals and share your fitness journey with others.',
    icon: UserGroupIcon,
  },
  {
    name: 'Mobile Integration',
    description:
      'Track steps, hydration, and workouts on the go with our mobile-friendly features.',
    icon: DevicePhoneMobileIcon,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl"
            >
              Transform Your Fitness Journey with AI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300"
            >
              Get personalized workout plans, nutrition advice, and real-time AI coaching
              to help you achieve your fitness goals faster and more effectively.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Get Started Free
              </Link>
              <Link
                href="/about"
                className="text-sm font-semibold leading-6 text-gray-900 dark:text-white"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400"
            >
              Everything You Need
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            >
              AI-Powered Fitness Platform
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300"
            >
              Experience the future of fitness with our comprehensive suite of AI-powered
              features designed to help you reach your goals.
            </motion.p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex flex-col"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <feature.icon
                      className="h-5 w-5 flex-none text-indigo-600 dark:text-indigo-400"
                      aria-hidden="true"
                    />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
