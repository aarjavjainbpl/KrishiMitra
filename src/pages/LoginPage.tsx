import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  Volume2,
  VolumeX,
  CheckCircle2,
  Lock,
  User,
  RefreshCw,
  ArrowLeft,
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();

  // Role Selection: 'farmer' | 'buyer'
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');

  // Auth Step: 'phone' (enter mobile & details) | 'otp' (verify 6-digit SMS code)
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const [phone, setPhone] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [district, setDistrict] = useState<string>('Bhopal');
  const [otp, setOtp] = useState<string>('');

  // Live SMS Simulation alert from telecom gateway
  const [smsNotice, setSmsNotice] = useState<string | null>(null);

  // Resend Countdown Timer (30s cooldown)
  const [resendTimer, setResendTimer] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<boolean>(false);

  // Resend countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Spoken Audio Voice Guide in English
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

  // Switch role selection
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'farmer') {
      speakVoiceGuide('Welcome Farmer. Enter your 10-digit mobile number to receive a secure login OTP.');
    } else {
      speakVoiceGuide('Welcome Buyer. Enter your phone number to access the direct farm produce wholesale marketplace.');
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await sendOtp(cleanPhone, selectedRole, userName.trim(), district.trim());
      setStep('otp');
      setOtp('');
      setResendTimer(30); // 30 seconds cooldown
      setSuccessMsg(`OTP sent to +91 ${cleanPhone}`);
      
      if (response.smsSimulatedNotice) {
        setSmsNotice(response.smsSimulatedNotice);
      }

      speakVoiceGuide(`A 6-digit verification code has been dispatched to your mobile number.`);
    } catch (err: any) {
      setError(err.message || 'Could not send verification code. Please check your mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
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
      setError(err.message || 'Invalid verification code. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    setError(null);
    setLoading(true);
    try {
      const res = await sendOtp(cleanPhone, selectedRole, userName.trim(), district.trim());
      setResendTimer(30);
      setSuccessMsg(`A fresh OTP has been sent to +91 ${cleanPhone}`);
      if (res.smsSimulatedNotice) {
        setSmsNotice(res.smsSimulatedNotice);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-emerald-50/40 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
        
        {/* Main Branding Header */}
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

          {/* Spoken Voice Assistance Trigger */}
          <button
            type="button"
            id="audio-guide-toggle-btn"
            onClick={() => speakVoiceGuide(
              step === 'phone'
                ? 'Welcome to KrishiMitra. Select your role as Farmer or Wholesale Buyer, enter your 10-digit mobile number, and receive your login verification code.'
                : 'Enter the 6-digit verification code received on your mobile phone to complete your login.'
            )}
            title="Listen to audio instructions"
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 shrink-0 ${
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

        {/* Live Incoming SMS Simulation Banner */}
        {smsNotice && (
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg border border-slate-700 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  📲 SMS Gateway Notification
                </span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-snug">
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

        {/* STEP 1: PHONE NUMBER & WORK DETAILS */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Select Account Role</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Farmer */}
                <button
                  type="button"
                  id="role-farmer-btn"
                  onClick={() => handleRoleSelect('farmer')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all relative ${
                    selectedRole === 'farmer'
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
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
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all relative ${
                    selectedRole === 'buyer'
                      ? 'border-slate-900 bg-slate-100 shadow-xs ring-2 ring-slate-900/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛒</span>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-tight">Wholesale Buyer</h3>
                      <p className="text-[10px] text-slate-700 font-bold">Bulk Trader / Mart</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Mobile Number & Profile */}
            <div className="space-y-3.5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>2. Mobile Number</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">10-Digit Indian Mobile</span>
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
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-16 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-base font-bold text-slate-900 tracking-wider focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Your Full Name:
                  </label>
                  <input
                    type="text"
                    id="login-name-input"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder={selectedRole === 'farmer' ? 'e.g. Rameshwar Patidar' : 'e.g. Bhopal Fresh Mart'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    District / APMC Market:
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

            {/* Send OTP Button */}
            <button
              type="submit"
              id="send-otp-btn"
              disabled={loading || phone.length < 10}
              className={`w-full py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedRole === 'farmer'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div>
                <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                  Enter 6-Digit Verification Code
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sent to <strong className="text-slate-900">+91 {phone}</strong>
                </p>
              </div>
              <button
                type="button"
                id="change-phone-btn"
                onClick={() => {
                  setStep('phone');
                  setError(null);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Edit Number
              </button>
            </div>

            {/* 6-Digit OTP Box */}
            <div className="py-2 flex flex-col items-center">
              <input
                type="text"
                id="otp-verification-input"
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtp(val);
                  if (error) setError(null);
                }}
                placeholder="------"
                className="w-56 text-center text-3xl font-black tracking-widest py-3 bg-white border-2 border-emerald-600 rounded-2xl text-emerald-950 shadow-inner focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Enter the 6-digit code received via SMS
              </p>
            </div>

            {/* Resend OTP Timer & Trigger */}
            <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1">
              {resendTimer > 0 ? (
                <span className="font-semibold text-slate-500">
                  Resend code in <strong className="text-emerald-700">{resendTimer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  id="resend-otp-btn"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Resend OTP Code
                </button>
              )}
              <span className="text-[11px] text-slate-400">Valid for 5 minutes</span>
            </div>

            {/* Verify & Enter Button */}
            <button
              type="submit"
              id="verify-otp-btn"
              disabled={loading || otp.length !== 6}
              className={`w-full py-3.5 rounded-2xl font-black text-base shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedRole === 'farmer'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {selectedRole === 'farmer' ? 'Verify & Open Farmer Hub' : 'Verify & Open Buyer Mart'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security & Compliance Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 font-semibold pt-3 border-t border-slate-100">
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
