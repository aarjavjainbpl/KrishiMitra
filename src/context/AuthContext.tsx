import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string, role: UserRole, name?: string) => Promise<void>;
  register: (data: Partial<User> & { password?: string }) => Promise<void>;
  logout: () => void;
  switchDemoUser: (role: 'farmer' | 'buyer') => void;
  selectPersona: (personaId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo preset accounts for 1-click testing (Bhopal, MP Centric)
const DEMO_USERS: Record<'farmer' | 'buyer', User> = {
  farmer: {
    id: 'user-farmer-1',
    name: 'Rameshwar Patidar (Farmer)',
    role: 'farmer',
    phone: '+91 98260 12345',
    email: 'ramesh.farmer@krishimitra.in',
    passwordHash: '',
    locationLat: 23.2350,
    locationLng: 77.2950,
    state: 'Madhya Pradesh',
    district: 'Bhopal (Phanda)',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  buyer: {
    id: 'user-buyer-1',
    name: 'Bhopal Fresh Wholesale Mart (Buyer)',
    role: 'buyer',
    phone: '+91 98261 44556',
    email: 'priya.buyer@freshbazaar.in',
    passwordHash: '',
    locationLat: 23.2985,
    locationLng: 77.3920,
    state: 'Madhya Pradesh',
    district: 'Bhopal (Karond APMC)',
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('krishimitra_user') || localStorage.getItem('agriconnect_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null; // Require explicit login / work role selection
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('krishimitra_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('krishimitra_user');
      localStorage.removeItem('agriconnect_user');
    }
  }, [user]);

  const login = async (email: string, _password?: string) => {
    setIsLoading(true);
    try {
      const demoMatch = Object.values(DEMO_USERS).find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      const role: UserRole = email.includes('buyer') ? 'buyer' : 'farmer';
      const selectedUser = demoMatch || {
        ...DEMO_USERS[role],
        email,
        name: email.split('@')[0],
        role,
      };
      setUser(selectedUser);
      const mockToken = 'demo-jwt-token-' + Date.now();
      setToken(mockToken);
      localStorage.setItem('krishimitra_token', mockToken);
      localStorage.setItem('agriconnect_token', mockToken);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (
    phone: string,
    _otp: string,
    role: UserRole = 'farmer',
    name?: string
  ) => {
    setIsLoading(true);
    try {
      const cleanPhone = phone.trim();
      const baseUser = DEMO_USERS[role] || DEMO_USERS.farmer;
      const newUser: User = {
        ...baseUser,
        id: `user-${role}-${Date.now().toString().slice(-4)}`,
        phone: cleanPhone.startsWith('+91') ? cleanPhone : `+91 ${cleanPhone}`,
        name: name?.trim() || (role === 'farmer' ? 'Rameshwar Patidar' : 'Bhopal Fresh Mart'),
        role,
      };
      setUser(newUser);
      const mockToken = `phone-jwt-${role}-${Date.now()}`;
      setToken(mockToken);
      localStorage.setItem('krishimitra_token', mockToken);
      localStorage.setItem('agriconnect_token', mockToken);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Partial<User> & { password?: string }) => {
    setIsLoading(true);
    try {
      const role = data.role || 'farmer';
      const newUser: User = {
        id: `user-${role}-${Date.now()}`,
        name: data.name || (role === 'farmer' ? 'Farmer Member' : 'Buyer Member'),
        email: data.email || `${role}${Date.now()}@krishimitra.in`,
        phone: data.phone || '+91 98260 00000',
        role,
        passwordHash: '',
        state: data.state || 'Madhya Pradesh',
        district: data.district || 'Bhopal',
        locationLat: data.locationLat || 23.25,
        locationLng: data.locationLng || 77.41,
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      const mockToken = `jwt-reg-${Date.now()}`;
      setToken(mockToken);
      localStorage.setItem('krishimitra_token', mockToken);
      localStorage.setItem('agriconnect_token', mockToken);
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

  const switchDemoUser = (role: 'farmer' | 'buyer') => {
    const target = DEMO_USERS[role];
    setUser(target);
    const mockToken = `demo-${role}-jwt-token`;
    setToken(mockToken);
    localStorage.setItem('krishimitra_token', mockToken);
    localStorage.setItem('agriconnect_token', mockToken);
  };

  const selectPersona = (personaId: string) => {
    if (personaId.includes('buyer')) {
      switchDemoUser('buyer');
    } else {
      switchDemoUser('farmer');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithPhone,
        register,
        logout,
        switchDemoUser,
        selectPersona,
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

