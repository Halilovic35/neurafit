import React from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { initializeDatabase } from "@/lib/db";
import { getServerSession } from '@/lib/auth';
import { ClientProviders } from '@/components/ClientProviders';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NeuraFit - Your AI Fitness Coach",
  description: "Personalized workout and meal plans powered by AI",
};

// Initialize database
initializeDatabase().catch(console.error);

async function getInitialSession() {
  const session = await getServerSession();
  return session;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getInitialSession();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders session={session}>
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
