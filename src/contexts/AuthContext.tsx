'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { JWTPayload } from '@/lib/auth';
import { toast } from 'react-hot-toast';

// Define public routes
const publicRoutes = ['/', '/about', '/contact', '/pricing'];
const authRoutes = ['/login', '/register'];

// Helper function to check if a route is public
const isPublicRoute = (pathname: string) => {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) || 
         authRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
};

interface User {
  id: string;
  email: string;
  role: string;
  profile?: {
    name?: string;
    avatar?: string;
  };
  subscription?: {
    isPremium: boolean;
    endDate?: Date;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  updateProfile: (data: Partial<User['profile']>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  checkAuthStatus: (force?: boolean) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialSession: JWTPayload | null;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession ? {
    ...initialSession,
    profile: {},
    subscription: { isPremium: false },
  } : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<number>(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Computed property for authentication state
  const isAuthenticated = !!user;

  const handleApiResponse = async (response: Response, errorMessage: string) => {
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData;
      
      try {
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }
      } catch (e) {
        errorData = { error: errorMessage };
      }

      if (response.status === 401) {
        console.log('Unauthorized response, clearing user state');
        setUser(null);
      }
      throw new Error(errorData.error || errorMessage);
    }

    const data = await response.json();
    return data;
  };

  const checkAuthStatus = useCallback(async (force: boolean = false) => {
    // Skip check if we're on auth pages
    if (authRoutes.some(route => pathname?.startsWith(route))) {
      console.log('Skipping auth check on auth pages');
      return;
    }

    // Skip check if we're on public pages and not forced
    if (!force && isPublicRoute(pathname || '')) {
      console.log('Skipping auth check on public page');
      return;
    }

    // Prevent multiple simultaneous auth checks
    if (isAuthenticating) {
      console.log('Auth check already in progress, skipping');
      return;
    }

    // Skip check if we have a user and it hasn't been long enough since last check
    const now = Date.now();
    if (!force && user && now - lastCheck < 300000) { // 5 minutes
      console.log('Skipping auth check - user exists and last check was recent');
      return;
    }

    try {
      console.log('Checking authentication status...');
      setIsAuthenticating(true);
      setLoading(true);
      
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });

      if (res.status === 401) {
        console.log('Unauthorized response, clearing user state');
        setUser(null);
        if (!isPublicRoute(pathname) && !authRoutes.some(route => pathname?.startsWith(route))) {
          router.push('/login');
        }
        return;
      }

      const data = await res.json();
      
      if (!data) {
        console.log('No user data in response');
        setUser(null);
        if (!isPublicRoute(pathname) && !authRoutes.some(route => pathname?.startsWith(route))) {
          router.push('/login');
        }
        return;
      }

      console.log('User authenticated:', data);
      setUser(data);
      setError(null);
      setLastCheck(now);
    } catch (error) {
      console.error('Auth check error:', error);
      setError('Network error');
      setUser(null);
      if (!isPublicRoute(pathname) && !authRoutes.some(route => pathname?.startsWith(route))) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, lastCheck, user, router, pathname]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting login for:', email);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await handleApiResponse(res, 'Login failed');
      console.log('Login successful:', data.user);
      
      setUser(data.user);
      setError(null);
      setLastCheck(Date.now());
      
      // Get the redirect URL from query params or use default
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') || (data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
      
      // Force an auth check after login
      await checkAuthStatus(true);
      
      // Then navigate
      router.push(from);
      toast.success('Login successful');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (!isInitialized) {
      if (initialSession) {
        console.log('Using initial session:', initialSession);
        setUser(initialSession);
        setLastCheck(Date.now());
      }
      setIsInitialized(true);
      // Force auth check on initialization if not on a public route or auth route
      if (!isPublicRoute(pathname || '') && !authRoutes.some(route => pathname?.startsWith(route))) {
        checkAuthStatus(true);
      }
    }
  }, [isInitialized, initialSession, pathname, checkAuthStatus]);

  // Update the route change effect to be more selective
  useEffect(() => {
    if (isInitialized && !isAuthenticating) {
      // Only check auth if:
      // 1. We're not on a public route or auth route
      // 2. We have a user (to verify their session is still valid)
      // 3. We're not already checking auth
      const shouldCheck = (!isPublicRoute(pathname || '') && !authRoutes.some(route => pathname?.startsWith(route))) || !!user;
      if (shouldCheck) {
        checkAuthStatus(false);
      }
    }
  }, [pathname, isInitialized, isAuthenticating, checkAuthStatus, user]);

  const logout = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Logout failed');
      }

      // Clear user state
      setUser(null);
      setLastCheck(0);
      
      // Clear any local storage data
      localStorage.removeItem('currentWorkoutPlan');
      localStorage.removeItem('completedWorkouts');
      
      // Navigate to login page
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      console.log('Attempting registration for:', email);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await handleApiResponse(res, 'Registration failed');
      console.log('Registration successful:', data.user);
      setUser(data.user);
      setLastCheck(Date.now());
      router.push('/dashboard');
      toast.success('Registration successful');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User['profile']>) => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
        cache: 'no-store',
      });

      const responseData = await handleApiResponse(res, 'Profile update failed');
      setUser(prev => prev ? { ...prev, profile: { ...prev.profile, ...data } } : null);
      toast.success('Profile updated successfully');
      return responseData;
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : 'Profile update failed');
      toast.error(error instanceof Error ? error.message : 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
        cache: 'no-store',
      });

      await handleApiResponse(res, 'Password change failed');
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Password change error:', error);
      setError(error instanceof Error ? error.message : 'Password change failed');
      toast.error(error instanceof Error ? error.message : 'Password change failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include',
        cache: 'no-store',
      });

      await handleApiResponse(res, 'Account deletion failed');
      setUser(null);
      router.push('/login');
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Account deletion error:', error);
      setError(error instanceof Error ? error.message : 'Account deletion failed');
      toast.error(error instanceof Error ? error.message : 'Account deletion failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    deleteAccount,
    checkAuthStatus,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 