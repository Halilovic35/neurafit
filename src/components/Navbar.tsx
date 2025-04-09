'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, loading, error, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    if (!mounted) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mounted]);

  // Close menus when route changes
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      setIsProfileOpen(false);
      await logout();
    } catch (error) {
      toast.error('Failed to logout');
    }
  }, [logout]);

  const handleNavigation = useCallback((href: string) => {
    // Don't navigate if already on the page
    if (pathname === href) {
      setIsOpen(false);
      setIsProfileOpen(false);
      return;
    }

    // Don't navigate while loading
    if (loading) {
      toast.error('Please wait while we verify your session');
      return;
    }

    setIsOpen(false);
    setIsProfileOpen(false);

    const isPublicRoute = ['/', '/about', '/pricing', '/login', '/register'].includes(href);
    
    if (!user && !isPublicRoute) {
      toast.error('Please log in to access this page');
      router.push('/login');
      return;
    }

    // For authenticated users
    if (user) {
      // Check admin routes
      if (href.startsWith('/admin') && user.role !== 'ADMIN') {
        toast.error('Admin access required');
        router.push('/dashboard');
        return;
      }

      router.push(href);
      return;
    }

    router.push(href);
  }, [pathname, router, user, loading]);

  const navigation = {
    public: [
      { name: 'Home', href: '/' },
      { name: 'About', href: '/about' },
      { name: 'Pricing', href: '/pricing' },
    ],
    authenticated: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Workouts', href: '/workouts' },
      { name: 'Meal Plans', href: '/meal-plans' },
      { name: 'Chat', href: '/chat' },
    ],
    admin: [
      { name: 'Admin Panel', href: '/admin' },
    ],
  };

  const navigationItems = user
    ? user.role === 'ADMIN'
      ? [...navigation.authenticated, ...navigation.admin]
      : navigation.authenticated
    : navigation.public;

  // Render null during initial mount
  if (!mounted) {
    return null;
  }

  // Show minimal header during loading
  if (loading) {
    return (
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                NeuraFit
              </span>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <button
                onClick={() => handleNavigation('/')}
                className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 focus:outline-none"
              >
                NeuraFit
              </button>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`${
                    pathname === item.href
                      ? 'border-indigo-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium focus:outline-none transition-colors duration-200`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                >
                  <FiUser className="h-6 w-6" />
                  <span className="text-sm font-medium">{user.email}</span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => handleNavigation('/profile')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                        >
                          <div className="flex items-center space-x-2">
                            <FiSettings className="h-4 w-4" />
                            <span>Settings</span>
                          </div>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                        >
                          <div className="flex items-center space-x-2">
                            <FiLogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex space-x-4">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium focus:outline-none"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/register')}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium focus:outline-none transition-colors duration-200"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="sm:hidden ml-4">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
              >
                {isOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden"
            >
              <div className="pt-2 pb-3 space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`${
                      pathname === item.href
                        ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium focus:outline-none transition-colors duration-200 w-full text-left`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
} 