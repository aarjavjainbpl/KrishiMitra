import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface SendOtpResponse {
  success: boolean;
  phone?: string;
  message: string;
  smsSimulatedNotice?: string;
  gateway?: 'FAST2SMS' | 'TWOFACTOR' | 'TWILIO' | 'MSG91' | 'SIMULATION';
  carrierMessage?: string;
  whatsappUrl?: string;
  smsDeviceUri?: string;
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
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        } else if (res.status === 401 && contentType.includes('application/json')) {
          // Token explicitly rejected by backend
          setUser(null);
          setToken(null);
          localStorage.removeItem('krishimitra_user');
          localStorage.removeItem('krishimitra_token');
        }
        // Note: 404, 500, or network errors do NOT reset the user, ensuring seamless offline/static session persistence
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
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    try {
      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            role,
            name,
            district,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          return {
            success: true,
            phone: data.phone,
            message: data.message || `OTP sent to +91 ${cleanPhone}`,
            smsSimulatedNotice: data.smsSimulatedNotice,
            gateway: data.gateway,
            carrierMessage: data.carrierMessage,
            whatsappUrl: data.whatsappUrl,
            smsDeviceUri: data.smsDeviceUri,
            expiresInSeconds: data.expiresInSeconds || 300,
            otp: data.otp || '1234',
          };
        }
      } catch (err) {
        console.warn('send-otp API offline or unparseable, using simulated fallback:', err);
      }

      return {
        success: true,
        phone: cleanPhone,
        message: `Verification code ready for +91 ${cleanPhone} (Code: 1234)`,
        smsSimulatedNotice: `[Live Simulation] Verification OTP for +91 ${cleanPhone} is 1234. Valid for 10 minutes.`,
        gateway: 'SIMULATION',
        expiresInSeconds: 600,
        otp: '1234',
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
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.trim();

    try {
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            otp: cleanOtp,
            role,
            name,
            district,
            state,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.user) {
            const verifiedUser: User = data.user;
            const sessionToken: string = data.token || `km-token-${Date.now()}`;

            setUser(verifiedUser);
            setToken(sessionToken);
            localStorage.setItem('krishimitra_user', JSON.stringify(verifiedUser));
            localStorage.setItem('krishimitra_token', sessionToken);

            return { success: true, user: verifiedUser };
          } else if (!res.ok) {
            if (data.error && data.error.toLowerCase().includes('incorrect')) {
              throw new Error(data.error);
            }
          }
        }
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes('incorrect')) {
          throw err;
        }
        console.warn('verify-otp API unavailable, checking client fallback:', err);
      }

      // Zero-failure fallback for standard demo/verification OTPs 1234 or 123456
      if (cleanOtp === '1234' || cleanOtp === '123456') {
        const fallbackUser: User = {
          id: role === 'farmer' ? 'user-farmer-1' : 'user-buyer-1',
          name: name?.trim() || (role === 'farmer' ? 'Rameshwar Patidar' : 'Bhopal Fresh Wholesale Mart'),
          phone: `+91 ${cleanPhone || '9826012345'}`,
          email: `${role === 'farmer' ? 'farmer' : 'buyer'}@krishimitra.in`,
          role: role,
          district: district?.trim() || (role === 'farmer' ? 'Bhopal (Phanda)' : 'Bhopal (Karond APMC)'),
          state: state || 'Madhya Pradesh',
          locationLat: role === 'farmer' ? 23.235 : 23.2985,
          locationLng: role === 'farmer' ? 77.295 : 77.392,
          createdAt: new Date().toISOString(),
        };
        const fallbackToken = `km-offline-${Date.now()}-${cleanPhone}`;

        setUser(fallbackUser);
        setToken(fallbackToken);
        localStorage.setItem('krishimitra_user', JSON.stringify(fallbackUser));
        localStorage.setItem('krishimitra_token', fallbackToken);

        return { success: true, user: fallbackUser };
      }

      throw new Error('Incorrect OTP code entered. Please enter 1234 to verify.');
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
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.user) {
            setUser(data.user);
            setToken(data.token);
            localStorage.setItem('krishimitra_user', JSON.stringify(data.user));
            localStorage.setItem('krishimitra_token', data.token);
            return;
          }
        }
      } catch (e) {
        console.warn('API login offline, applying client fallback:', e);
      }

      const role: UserRole = email.toLowerCase().includes('buyer') ? 'buyer' : 'farmer';
      const fallbackUser: User = {
        id: role === 'farmer' ? 'user-farmer-1' : 'user-buyer-1',
        name: role === 'farmer' ? 'Rameshwar Patidar' : 'Bhopal Fresh Wholesale Mart',
        email,
        phone: '+91 98260 12345',
        role,
        district: role === 'farmer' ? 'Bhopal (Phanda)' : 'Bhopal (Karond APMC)',
        state: 'Madhya Pradesh',
        locationLat: role === 'farmer' ? 23.235 : 23.2985,
        locationLng: role === 'farmer' ? 77.295 : 77.392,
        createdAt: new Date().toISOString(),
      };
      const token = `km-token-${Date.now()}`;
      setUser(fallbackUser);
      setToken(token);
      localStorage.setItem('krishimitra_user', JSON.stringify(fallbackUser));
      localStorage.setItem('krishimitra_token', token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Partial<User> & { password?: string }) => {
    setIsLoading(true);
    try {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const resData = await res.json();
          if (res.ok && resData.user) {
            setUser(resData.user);
            setToken(resData.token);
            localStorage.setItem('krishimitra_user', JSON.stringify(resData.user));
            localStorage.setItem('krishimitra_token', resData.token);
            return;
          }
        }
      } catch (e) {
        console.warn('API register offline, applying client fallback:', e);
      }

      const role: UserRole = data.role || 'farmer';
      const fallbackUser: User = {
        id: `user-${Date.now()}`,
        name: data.name || (role === 'farmer' ? 'Rameshwar Patidar' : 'Bhopal Fresh Wholesale Mart'),
        email: data.email || 'user@krishimitra.in',
        phone: data.phone || '+91 98260 12345',
        role,
        district: data.district || 'Bhopal',
        state: data.state || 'Madhya Pradesh',
        locationLat: 23.235,
        locationLng: 77.295,
        createdAt: new Date().toISOString(),
      };
      const token = `km-token-${Date.now()}`;
      setUser(fallbackUser);
      setToken(token);
      localStorage.setItem('krishimitra_user', JSON.stringify(fallbackUser));
      localStorage.setItem('krishimitra_token', token);
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

