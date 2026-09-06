import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface SendOtpResponse {
  success: boolean;
  phone?: string;
  message: string;
  smsSimulatedNotice?: string;
  expiresInSeconds?: number;
  otp?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sendOtp: (phone: string, role?: UserRole, name?: string, district?: string) => Promise<SendOtpResponse>;
  verifyOtp: (phone: string, otp: string, role?: UserRole, name?: string, district?: string, state?: string) => Promise<{ success: boolean; user: User }>;
  loginWithPhone: (phone: string, otp: string, role?: UserRole, name?: string) => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: Partial<User> & { password?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('krishimitra_user') || localStorage.getItem('agriconnect_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync user & token to localStorage
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('krishimitra_user', JSON.stringify(user));
      localStorage.setItem('krishimitra_token', token);
    } else if (!user) {
      localStorage.removeItem('krishimitra_user');
      localStorage.removeItem('krishimitra_token');
      localStorage.removeItem('agriconnect_user');
      localStorage.removeItem('agriconnect_token');
    }
  }, [user, token]);

  // Validate active token with server on initial load
  useEffect(() => {
    const checkAuthSession = async () => {
      const storedToken = localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token');
      if (!storedToken) return;

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        } else if (res.status === 401 || res.status === 403 || res.status === 404) {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem('krishimitra_user');
          localStorage.removeItem('krishimitra_token');
        }
      } catch (err) {
        console.warn('Session verification fallback to cached user:', err);
      }
    };

    checkAuthSession();
  }, []);

  // 1. Send OTP to Mobile Number
  const sendOtp = async (
    phone: string,
    role: UserRole = 'farmer',
    name?: string,
    district?: string
  ): Promise<SendOtpResponse> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          role,
          name,
          district,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code');
      }

      return {
        success: true,
        phone: data.phone,
        message: data.message || `OTP sent to +91 ${phone}`,
        smsSimulatedNotice: data.smsSimulatedNotice,
        expiresInSeconds: data.expiresInSeconds || 300,
        otp: data.otp,
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP & Authenticate Session
  const verifyOtp = async (
    phone: string,
    otp: string,
    role: UserRole = 'farmer',
    name?: string,
    district?: string,
    state?: string
  ): Promise<{ success: boolean; user: User }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp,
          role,
          name,
          district,
          state,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      const verifiedUser: User = data.user;
      const sessionToken: string = data.token;

      setUser(verifiedUser);
      setToken(sessionToken);
      localStorage.setItem('krishimitra_user', JSON.stringify(verifiedUser));
      localStorage.setItem('krishimitra_token', sessionToken);

      return { success: true, user: verifiedUser };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (
    phone: string,
    otp: string,
    role: UserRole = 'farmer',
    name?: string
  ) => {
    await verifyOtp(phone, otp, role, name);
  };

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('krishimitra_user', JSON.stringify(data.user));
      localStorage.setItem('krishimitra_token', data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Partial<User> & { password?: string }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Registration failed');
      }
      setUser(resData.user);
      setToken(resData.token);
      localStorage.setItem('krishimitra_user', JSON.stringify(resData.user));
      localStorage.setItem('krishimitra_token', resData.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('krishimitra_user');
    localStorage.removeItem('krishimitra_token');
    localStorage.removeItem('agriconnect_user');
    localStorage.removeItem('agriconnect_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        sendOtp,
        verifyOtp,
        loginWithPhone,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

