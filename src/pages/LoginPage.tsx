import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  ShoppingBag,
  Phone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Lock,
  User,
  RefreshCw,
  ArrowLeft,
  Truck,
  Building2,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginWithPhone, switchDemoUser } = useAuth();

  // Role Selection: 'farmer' | 'buyer' | 'admin'
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  
  // Auth Step: 'phone' (enter mobile & name) | 'otp' (enter 4-digit code)
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const [phone, setPhone] = useState<string>('9826012345');
  const [userName, setUserName] = useState<string>('Rameshwar Patidar');
  const [workDetails, setWorkDetails] = useState<string>('Wheat & Soybean Producer, Phanda, Bhopal (MP)');
  const [otp, setOtp] = useState<string>('1234');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<boolean>(false);

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
      setPhone('9826012345');
      setUserName('Rameshwar Patidar');
      setWorkDetails('Wheat & Soybean Producer, Phanda, Bhopal (MP)');
      speakVoiceGuide('Welcome Farmer! Select your mobile number to list harvests, check live APMC mandi benchmarks, and receive direct buyer payouts.');
    } else {
      setPhone('9826144556');
      setUserName('Bhopal Fresh Wholesale Mart');
      setWorkDetails('Wholesale Produce Trader, Karond APMC Yard, Bhopal');
      speakVoiceGuide('Welcome Buyer! Enter your phone to source farm produce directly from growers with AI quality inspections and multi-stop logistics.');
    }
  };

  // Send OTP
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      setOtp('1234'); // Preset verification code for seamless instant testing
      speakVoiceGuide('A 4-digit verification code has been sent to your mobile number. Enter 1 2 3 4 to verify.');
    }, 350);
  };

  // Verify OTP and Start
  const handleVerifyAndStart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter the 4-digit OTP code (Default: 1234)');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginWithPhone(phone, otp, selectedRole, userName);
      if (selectedRole === 'farmer') {
        navigate('/farmer/place-harvest');
      } else {
        navigate('/buyer/browse');
      }
    } catch (err: any) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Fast Instant Start
  const handleInstantStart = (role: UserRole) => {
    switchDemoUser(role);
    if (role === 'farmer') {
      navigate('/farmer/place-harvest');
    } else {
      navigate('/buyer/browse');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-emerald-50/40 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-2xl w-full bg-white rounded-3xl border-2 border-slate-200 shadow-2xl p-6 sm:p-10 space-y-6">
        
        {/* Main Branding Header with Spoken Audio Assistance */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-700/20 text-3xl font-black shrink-0">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                  KrishiMitra • Farmer-to-Buyer Portal
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                  SIH26033
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">
                Direct Farm Marketplace & APMC Mandi Intelligence
              </p>
            </div>
          </div>

          {/* Spoken Voice Assistance Trigger */}
          <button
            type="button"
            onClick={() => speakVoiceGuide(
              'Welcome to KrishiMitra! To begin, select your account type: Farmer, Wholesale Buyer, or APMC Admin. Then verify your number to enter your workspace.'
            )}
            title="Listen to audio guide"
            className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 shrink-0 ${
              speaking
                ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse ring-2 ring-amber-300'
                : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-slate-200'
            }`}
          >
            {speaking ? <VolumeX className="w-5 h-5 text-amber-700" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
            <span className="text-[10px] font-black">
              {speaking ? 'Stop' : '🔊 Audio Guide'}
            </span>
          </button>
        </div>

        {/* STEP 1: SPECIFY WHAT WORK YOU DO (ROLE DECLARATION) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>1. Select Account & Role:</span>
            </label>
            <span className="text-[11px] text-emerald-700 font-bold">
              Isolated Role Workspaces
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* 1. Farmer Option */}
            <button
              type="button"
              id="role-select-farmer"
              onClick={() => handleRoleSelect('farmer')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                selectedRole === 'farmer'
                  ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {selectedRole === 'farmer' && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-xs">
                  ✓
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">👨‍🌾</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    Farmer
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-bold">
                    Crop Producer
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                List harvests with AI image quality & right price prediction, check live APMC mandi benchmarks, and get direct buyer orders
              </p>
            </button>

            {/* 2. Buyer Option */}
            <button
              type="button"
              id="role-select-buyer"
              onClick={() => handleRoleSelect('buyer')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                selectedRole === 'buyer'
                  ? 'border-slate-900 bg-slate-100/90 shadow-md ring-2 ring-slate-900/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {selectedRole === 'buyer' && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-xs">
                  ✓
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">🛒</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    Wholesale Buyer
                  </h3>
                  <p className="text-[10px] text-slate-700 font-bold">
                    Bulk Trader / Mart
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Source directly from farms, inspect certified produce quality, optimize multi-stop vehicle routes & escrow pay
              </p>
            </button>

          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 2: PHONE & WORK PROFILE DETAILS */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>2. Mobile Number:</span>
                  <span className="text-[11px] font-bold text-emerald-700">🔒 Secured SMS OTP</span>
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700 font-black text-sm">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9826012345"
                    className="w-full pl-16 pr-4 py-3.5 bg-white border-2 border-slate-300 rounded-xl text-base font-bold text-slate-900 tracking-wider focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Your Name / Firm Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Work Location & District:
                  </label>
                  <input
                    type="text"
                    value={workDetails}
                    onChange={(e) => setWorkDetails(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Submit Send OTP Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-3 active:scale-98 ${
                selectedRole === 'farmer'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/30'
                  : selectedRole === 'buyer'
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
              }`}
            >
              <span>{loading ? 'Sending OTP Code...' : 'Send Verification OTP'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* STEP 3: OTP CODE VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyAndStart} className="space-y-4 bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                  Enter 4-Digit Verification Code:
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sent to +91 {phone} ({userName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Number
              </button>
            </div>

            {/* Big OTP Input Display */}
            <div className="flex items-center justify-center gap-3 py-2">
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="w-48 text-center text-3xl font-black tracking-widest py-3 bg-white border-2 border-emerald-600 rounded-2xl text-emerald-950 shadow-inner focus:ring-4 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-medium">Test OTP Code: <strong>1234</strong></span>
              <button
                type="button"
                onClick={() => setOtp('1234')}
                className="text-emerald-700 font-bold hover:underline"
              >
                ✨ 1-Click Auto Fill (1234)
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-3 active:scale-98 ${
                selectedRole === 'farmer'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/30'
                  : selectedRole === 'buyer'
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>
                {loading
                  ? 'Verifying...'
                  : selectedRole === 'farmer'
                  ? 'Verify & Open Farmer Portal'
                  : selectedRole === 'buyer'
                  ? 'Verify & Open Buyer Mart'
                  : 'Verify & Open APMC Admin'}
              </span>
            </button>
          </form>
        )}

        {/* 1-TAP INSTANT ACCESS BY WORK TYPE */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-black text-slate-800 uppercase tracking-wide">
              ⚡ Instant 1-Tap Quick Launch:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              id="instant-farmer-login"
              onClick={() => handleInstantStart('farmer')}
              className="py-3 px-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black rounded-xl border border-emerald-300 text-xs flex items-center justify-between transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">👨‍🌾</span>
                <div className="text-left">
                  <p className="font-black text-xs text-emerald-950">Farmer Portal</p>
                  <p className="text-[10px] text-emerald-800">List produce, AI price advice & orders</p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Enter
              </span>
            </button>

            <button
              type="button"
              id="instant-buyer-login"
              onClick={() => handleInstantStart('buyer')}
              className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-xl border border-slate-300 text-xs flex items-center justify-between transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <div className="text-left">
                  <p className="font-black text-xs text-slate-900">Wholesale Buyer Mart</p>
                  <p className="text-[10px] text-slate-600">Browse farm harvest, inspect quality & VRP</p>
                </div>
              </div>
              <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Enter
              </span>
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Escrow Bank Guarantee
          </span>
          <span>•</span>
          <span>🏛️ Official APMC Mandi Feeds</span>
          <span>•</span>
          <span>🌾 Zero Middleman Commissions</span>
        </div>

        {/* 1-Click Source Code ZIP Download Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              📦
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">
                Run KrishiMitra Locally on Your Computer
              </p>
              <p className="text-[11px] text-slate-500">
                Complete source code with start.sh & start.bat scripts
              </p>
            </div>
          </div>
          <a
            href="/api/download-zip"
            download="krishimitra-app.zip"
            id="login-download-zip-btn"
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </a>
        </div>

      </div>
    </div>
  );
};
