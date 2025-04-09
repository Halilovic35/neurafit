'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  BoltIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarIcon,
  HeartIcon,
  LightBulbIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl"
          >
            About NeuraFit
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-xl text-gray-600 dark:text-gray-300"
          >
            Your AI-Powered Personal Fitness Companion
          </motion.p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Our Mission
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              At NeuraFit, we believe that everyone deserves access to personalized,
              high-quality fitness guidance. Our AI-powered platform combines cutting-edge
              technology with proven fitness principles to create a truly personalized
              training experience that adapts to your unique needs and goals.
            </p>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              We're committed to making premium fitness coaching accessible to everyone,
              leveraging artificial intelligence to provide personalized workout plans,
              nutrition guidance, and real-time feedback that traditionally only came
              with expensive personal trainers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl">
              <div className="p-8 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-2xl font-bold mb-4">Key Statistics</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-3xl font-bold">10K+</p>
                      <p className="text-sm">Active Users</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">95%</p>
                      <p className="text-sm">Success Rate</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">500+</p>
                      <p className="text-sm">Workout Plans</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">24/7</p>
                      <p className="text-sm">AI Support</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose NeuraFit?
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="relative p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                  <value.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {value.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ready to Transform Your Fitness Journey?
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Join thousands of users who have already achieved their fitness goals with
            NeuraFit.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Home
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
            >
              View Pricing
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const features = [
  {
    title: 'AI-Powered Personalization',
    description:
      'Our advanced AI algorithms create workout and nutrition plans tailored to your unique goals, fitness level, and preferences.',
    icon: LightBulbIcon,
  },
  {
    title: 'Real-Time Progress Tracking',
    description:
      'Monitor your progress with detailed analytics, performance metrics, and visual progress tracking tools.',
    icon: ChartBarIcon,
  },
  {
    title: '24/7 AI Support',
    description:
      'Get instant answers to your fitness and nutrition questions with our AI chatbot, available whenever you need guidance.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
];

const values = [
  {
    title: 'Innovation',
    description: 'Continuously improving our AI technology to provide the best fitness experience.',
    icon: BoltIcon,
  },
  {
    title: 'Community',
    description: 'Building a supportive environment where members inspire and motivate each other.',
    icon: UserGroupIcon,
  },
  {
    title: 'Well-being',
    description: 'Promoting holistic health through balanced nutrition and sustainable fitness habits.',
    icon: HeartIcon,
  },
]; 