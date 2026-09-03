import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  Volume2,
  VolumeX,
  User,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Sparkles,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();

  // Role Selection: 'farmer' | 'buyer'
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');

  // Input states shown right on the front
  const [phone, setPhone] = useState<string>('9826012345');
  const [otp, setOtp] = useState<string>('1234');
  const [userName, setUserName] = useState<string>('Rameshwar Patidar');
  const [district, setDistrict] = useState<string>('Bhopal');

  // Live simulation notice if user clicks "Send OTP to Mobile"
  const [smsNotice, setSmsNotice] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<boolean>(false);

  // Spoken Voice Guide
  const speakVoiceGuide = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (speaking) {
        setSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Switch role
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'farmer') {
      setUserName('Rameshwar Patidar');
      speakVoiceGuide('Farmer Login. Put your mobile number and use OTP 1234 shown on screen to sign in.');
    } else {
      setUserName('Bhopal Fresh Mart');
      speakVoiceGuide('Wholesale Buyer Login. Put your phone number and use OTP 1234 shown on screen to sign in.');
    }
  };

  // Optional: Trigger SMS dispatch
  const handleRequestSmsOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError(null);
    setSendingOtp(true);
    try {
      const response = await sendOtp(cleanPhone, selectedRole, userName.trim(), district.trim());
      setOtp(response.otp || '1234');
      setSuccessMsg(`OTP sent to +91 ${cleanPhone}. (Code: ${response.otp || '1234'})`);
      if (response.smsSimulatedNotice) {
        setSmsNotice(response.smsSimulatedNotice);
      }
      speakVoiceGuide(`Verification code ${response.otp || '1234'} is ready.`);
    } catch (err: any) {
      setOtp('1234');
      setSuccessMsg('Default OTP 1234 is ready to use.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify and Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the OTP code (Default: 1234)');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(
        cleanPhone,
        cleanOtp,
        selectedRole,
        userName.trim() || undefined,
        district.trim() || undefined,
        'Madhya Pradesh'
      );

      if (result.success) {
        if (result.user.role === 'farmer') {
          navigate('/farmer/place-harvest');
        } else {
          navigate('/buyer/browse');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please use OTP 1234.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-emerald-50/40 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-9 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-emerald-700 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-700/20 text-2xl font-black shrink-0">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                  KrishiMitra
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                  SIH26033
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">
                Direct Farm-to-Buyer Marketplace & Mandi Intelligence
              </p>
            </div>
          </div>

          {/* Spoken Voice Assistance */}
          <button
            type="button"
            id="audio-guide-toggle-btn"
            onClick={() => speakVoiceGuide(
              selectedRole === 'farmer'
                ? 'Welcome Farmer. Put your mobile number and use OTP 1234 shown on the front screen to log in.'
                : 'Welcome Buyer. Put your mobile number and use OTP 1234 shown on the front screen to log in.'
            )}
            title="Listen to voice guide"
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 shrink-0 cursor-pointer ${
              speaking
                ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-300'
                : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-slate-200'
            }`}
          >
            {speaking ? <VolumeX className="w-4 h-4 text-amber-700" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span className="text-[10px] font-bold">
              {speaking ? 'Stop' : 'Voice Guide'}
            </span>
          </button>
        </div>

        {/* SMS notice if requested */}
        {smsNotice && (
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg border border-slate-700 flex items-start gap-3 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
              📲
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  SMS Gateway Notice
                </span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-0.5">
                {smsNotice}
              </p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && !error && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Login Form - All on Front */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* 1. Role Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Choose Role</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Farmer */}
              <button
                type="button"
                id="role-farmer-btn"
                onClick={() => handleRoleSelect('farmer')}
                className={`p-3 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                  selectedRole === 'farmer'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">👨‍🌾</span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">Farmer</h3>
                    <p className="text-[10px] text-emerald-700 font-bold">Crop Producer</p>
                  </div>
                </div>
              </button>

              {/* Buyer */}
              <button
                type="button"
                id="role-buyer-btn"
                onClick={() => handleRoleSelect('buyer')}
                className={`p-3 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                  selectedRole === 'buyer'
                    ? 'border-slate-900 bg-slate-100 shadow-xs ring-2 ring-slate-900/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🛒</span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">Wholesale Buyer</h3>
                    <p className="text-[10px] text-slate-700 font-bold">Bulk Trader / Mart</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Mobile Number & Details */}
          <div className="space-y-3.5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>2. Mobile Number</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700">10-Digit Mobile</span>
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700 font-black text-sm">
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  id="login-phone-input"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ''));
                    if (error) setError(null);
                  }}
                  placeholder="9826012345"
                  className="w-full pl-16 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-base font-bold text-slate-900 tracking-wider focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>Full Name:</span>
                </label>
                <input
                  type="text"
                  id="login-name-input"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter Name"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>District / Mandi:</span>
                </label>
                <input
                  type="text"
                  id="login-district-input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Bhopal"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 3. OTP Code Input - Shown Directly on Front */}
          <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border-2 border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-700" />
                <span>3. Verification OTP</span>
              </label>

              {/* OTP Displayed Prominently on Front */}
              <div className="flex items-center gap-1.5 bg-emerald-100/90 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-300 text-xs font-black">
                <span>OTP:</span>
                <span className="font-mono text-emerald-950 text-sm tracking-wider">1234</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <input
                type="text"
                id="otp-verification-input"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  if (error) setError(null);
                }}
                placeholder="1234"
                className="w-full sm:w-48 text-center text-xl font-black tracking-widest py-2.5 bg-white border-2 border-emerald-600 rounded-xl text-emerald-950 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />

              {/* 1-Click Auto Fill Button */}
              <button
                type="button"
                id="auto-fill-otp-btn"
                onClick={() => {
                  setOtp('1234');
                  setError(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>1-Click Auto Fill (1234)</span>
              </button>

              {/* Optional: Send SMS Request */}
              <button
                type="button"
                id="request-sms-btn"
                onClick={handleRequestSmsOtp}
                disabled={sendingOtp}
                className="w-full sm:w-auto px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${sendingOtp ? 'animate-spin' : ''}`} />
                <span>{sendingOtp ? 'Sending...' : 'Get SMS OTP'}</span>
              </button>
            </div>

            <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Enter <strong>1234</strong> shown above or click Auto Fill to log in instantly.</span>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading || !phone || !otp}
            className={`w-full py-4 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedRole === 'farmer'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/25'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/25'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying & Opening Dashboard...</span>
              </>
            ) : (
              <>
                <span>
                  {selectedRole === 'farmer' ? 'Verify OTP & Enter Farmer Hub' : 'Verify OTP & Enter Buyer Store'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Security & Compliance Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Escrow Bank Protection
          </span>
          <span>•</span>
          <span>🏛️ APMC Mandi Benchmarks</span>
          <span>•</span>
          <span>🌾 Direct Farmer Payouts</span>
        </div>

      </div>
    </div>
  );
};
