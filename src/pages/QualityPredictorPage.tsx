import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Tag,
  RefreshCw,
  Eye,
  Sliders,
  Activity,
  HeartPulse,
  Pill,
  Video,
  VideoOff,
  History,
  Download,
  Share2,
  TrendingUp,
  Info,
  Layers,
  Award,
  DollarSign
} from 'lucide-react';
import { QualityPrediction } from '../types';

export const QualityPredictorPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [inputMode, setInputMode] = useState<'upload' | 'camera' | 'presets'>('presets');
  const [selectedCropHint, setSelectedCropHint] = useState<string>('Tomato');
  const [previewUrl, setPreviewUrl] = useState<string>(
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<QualityPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pastPredictions, setPastPredictions] = useState<QualityPrediction[]>([]);
  const [presetFilter, setPresetFilter] = useState<'all' | 'healthy' | 'diseased'>('all');

  // Comprehensive test presets for Indian farm produce
  const samplePresets = [
    {
      id: 'tomato-healthy-a',
      label: '🍅 Ripe Red Tomato (Grade A - Prime)',
      crop: 'Tomato',
      type: 'healthy',
      grade: 'A',
      badge: 'Healthy Prime',
      description: 'Firm calyx, uniform deep red pigmentation, zero lesions',
      url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'tomato-blight-c',
      label: '⚠️ Blighted Tomato (Early Blight - Grade C)',
      crop: 'Tomato',
      type: 'diseased',
      grade: 'C',
      badge: 'Fungal Blight',
      description: 'Concentric necrotic rings, fungal spot lesions on calyx',
      url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80&defect=blight_rot',
    },
    {
      id: 'onion-healthy-b',
      label: '🧅 Red Nashik Onion (Grade B - Standard)',
      crop: 'Onion',
      type: 'healthy',
      grade: 'B',
      badge: 'Healthy Cured',
      description: 'Well cured, tight protective tunic with mild skin weathering',
      url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'onion-purple-blotch-c',
      label: '⚠️ Purple Blotch Onion (Neck Rot - Grade C)',
      crop: 'Onion',
      type: 'diseased',
      grade: 'C',
      badge: 'Purple Blotch',
      description: 'Water-soaked purple lesions and soft rotting outer tunic',
      url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80&defect=rot_purple_blotch',
    },
    {
      id: 'potato-healthy-a',
      label: '🥔 Kufri Jyoti Potato (Grade A - Table Spec)',
      crop: 'Potato',
      type: 'healthy',
      grade: 'A',
      badge: 'Healthy Clean',
      description: 'Smooth skin, zero greening, firm tuber density',
      url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'potato-scab-c',
      label: '⚠️ Scabbed Potato (Common Scab - Grade C)',
      crop: 'Potato',
      type: 'diseased',
      grade: 'C',
      badge: 'Scab Lesions',
      description: 'Corky raised scab lesions and sub-surface necrotic patches',
      url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80&defect=scab_lesions',
    },
    {
      id: 'chilli-healthy-a',
      label: '🌶️ G4 Fresh Green Chilli (Grade A - Export)',
      crop: 'Green Chilli',
      type: 'healthy',
      grade: 'A',
      badge: 'Healthy Lustrous',
      description: 'Turgid emerald pod, firm stem attachment, zero anthracnose',
      url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'wheat-healthy-a',
      label: '🌾 Sharbati Wheat (Grade A - Lustrous Grain)',
      crop: 'Wheat',
      type: 'healthy',
      grade: 'A',
      badge: 'Grade A Grain',
      description: 'High test weight, uniform golden luster, zero karnal bunt',
      url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'garlic-healthy-a',
      label: '🧄 Ooty Garlic (Grade A - Large Bulb)',
      crop: 'Garlic',
      type: 'healthy',
      grade: 'A',
      badge: 'Healthy Dry',
      description: 'Tight cloves, clean white paper tunic, 45mm+ diameter',
      url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80',
    },
  ];

  // Fetch recent scan history on load
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/quality-predictor/history');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.predictions)) {
          setPastPredictions(data.predictions);
        }
      }
    } catch {
      // Non-blocking history
    }
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. Please enable camera permissions or upload a photo.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewUrl(dataUrl);
      setSelectedFile(null);
      stopCamera();
      setInputMode('upload');
      // Auto run analysis on snapshot
      runAnalysis(dataUrl, null, selectedCropHint);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPrediction(null);
      stopCamera();
      setInputMode('upload');
      // Auto trigger analysis
      runAnalysis(undefined, file, selectedCropHint);
    }
  };

  const handleSelectPreset = (preset: typeof samplePresets[0]) => {
    setSelectedCropHint(preset.crop);
    setPreviewUrl(preset.url);
    setSelectedFile(null);
    stopCamera();
    setInputMode('presets');
    // Auto trigger analysis for seamless testing
    runAnalysis(preset.url, null, preset.crop);
  };

  const runAnalysis = async (imgUrl?: string, file?: File | null, crop?: string) => {
    const targetCrop = crop || selectedCropHint;
    const targetImgUrl = imgUrl || previewUrl;
    const targetFile = file !== undefined ? file : selectedFile;

    setAnalyzing(true);
    setError(null);
    try {
      let res;
      if (targetFile) {
        const formData = new FormData();
        formData.append('image', targetFile);
        formData.append('cropHint', targetCrop);

        res = await fetch('/api/quality-predictor/analyze', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/quality-predictor/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: targetImgUrl,
            cropHint: targetCrop,
          }),
        });
      }

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setPrediction(data.prediction);
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error analyzing produce quality and crop health');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSellAtFairPrice = () => {
    if (!prediction) return;
    // Prefill data for Sell Harvest page
    const prefillData = {
      cropName: selectedCropHint,
      qualityGrade: prediction.predictedGrade,
      qualityPredictionId: prediction.id,
      photoUrl: prediction.imageUrl,
      askingPricePerKg: prediction.predictedFairPricePerKg || 30,
      suggestedAdjustment: prediction.suggestedPriceAdjustmentPercent,
      diseaseStatus: prediction.diseaseStatus,
      diseaseName: prediction.diseaseName,
    };
    localStorage.setItem('agriconnect_prefill_listing', JSON.stringify(prefillData));
    navigate('/farmer/place-harvest');
  };

  const filteredPresets = samplePresets.filter((p) => {
    if (presetFilter === 'healthy') return p.type === 'healthy';
    if (presetFilter === 'diseased') return p.type === 'diseased';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Module C • AI Quality Grader & Right Price Predictor
              </span>
              <span className="bg-white/10 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5" /> ICAR Standard Grading
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
              AI Produce Quality Grader & Crop Health Doctor
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Snap or upload any crop photo. Our multimodal AI performs <strong>plant pathology diagnostics</strong> (Healthy vs Diseased), certifies <strong>APMC Grade A / B / C</strong>, and calculates the <strong>exact fair right price (₹/kg & ₹/Quintal)</strong> with zero middleman deduction.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => {
                setInputMode('camera');
                startCamera();
              }}
              className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span>Live AI Camera Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Controller, Dropzone, Camera & Presets (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-5">
            {/* Input Mode Selector Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setInputMode('presets');
                  stopCamera();
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'presets'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test Samples</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputMode('camera');
                  startCamera();
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'camera'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputMode('upload');
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'upload'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload File</span>
              </button>
            </div>

            {/* Target Commodity Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Crop Commodity
              </label>
              <select
                id="quality-crop-hint-select"
                value={selectedCropHint}
                onChange={(e) => {
                  setSelectedCropHint(e.target.value);
                  if (previewUrl && !cameraActive) {
                    runAnalysis(previewUrl, selectedFile, e.target.value);
                  }
                }}
                className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm font-bold rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              >
                {[
                  'Tomato',
                  'Onion',
                  'Potato',
                  'Green Chilli',
                  'Wheat',
                  'Garlic',
                  'Soybean',
                  'Mustard',
                  'Gram (Chana)',
                  'Rice',
                  'Maize',
                  'Cotton',
                  'Banana',
                  'Apple',
                  'Ginger',
                ].map((c) => (
                  <option key={c} value={c}>
                    🌾 {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Camera Viewport Mode */}
            {inputMode === 'camera' && (
              <div className="space-y-4">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500 shadow-md flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Camera Reticle Overlay */}
                  <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></span>
                      <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></span>
                    </div>
                    <p className="text-center text-xs font-black text-white/90 drop-shadow-md bg-black/40 px-2 py-1 rounded-md self-center">
                      Align produce within frame
                    </p>
                    <div className="flex justify-between">
                      <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></span>
                      <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></span>
                    </div>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {cameraError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
                    {cameraError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap & Grade Produce</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    <VideoOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Standard Image Preview Box */}
            {inputMode !== 'camera' && (
              <div className="space-y-4">
                <div className="relative group rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-100 aspect-4/3 flex flex-col items-center justify-center">
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previewUrl}
                        alt="Produce Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-black shadow-lg hover:bg-slate-50 transition-all"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 text-center cursor-pointer hover:bg-slate-200/50 transition-colors"
                    >
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">
                        Click to browse or drop crop photo
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        JPG, PNG, WebP up to 15MB
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Re-analyze Action Button */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-3 border-2 border-slate-200 hover:border-slate-300 bg-white rounded-2xl text-xs font-extrabold text-slate-700 flex items-center justify-center gap-2 transition-all"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Upload Different Photo</span>
                  </button>

                  <button
                    id="run-quality-analysis-btn"
                    type="button"
                    onClick={() => runAnalysis()}
                    disabled={analyzing}
                    className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                    <span>{analyzing ? 'Inspecting...' : 'Scan & Grade Now'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Preset Samples Selector Box */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Instant Test Samples:
                </span>
                {/* Filter Pills */}
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setPresetFilter('all')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      presetFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setPresetFilter('healthy')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      presetFilter === 'healthy' ? 'bg-emerald-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    Healthy
                  </button>
                  <button
                    onClick={() => setPresetFilter('diseased')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      presetFilter === 'diseased' ? 'bg-red-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    Diseased
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                      previewUrl === preset.url
                        ? preset.type === 'diseased'
                          ? 'border-red-500 bg-red-50/80 ring-2 ring-red-400/20'
                          : 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate font-bold text-xs text-slate-900">{preset.label}</p>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase ${
                            preset.type === 'diseased'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          Grade {preset.grade}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Grade, Right Price Valuation & Diagnosis (7 Cols) */}
        <div className="lg:col-span-7">
          {prediction ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-sm space-y-6">
              {/* Top Hero Banner: Certified Grade & Pathology Diagnosis */}
              <div
                className={`p-6 rounded-3xl border-2 ${
                  prediction.diseaseStatus === 'diseased'
                    ? 'bg-gradient-to-br from-red-50 via-amber-50 to-orange-50 border-red-300'
                    : prediction.diseaseStatus === 'damaged'
                    ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300'
                    : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-emerald-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Grade Badge */}
                    <div
                      className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-display font-black shadow-lg shrink-0 ${
                        prediction.predictedGrade === 'A'
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                          : prediction.predictedGrade === 'B'
                          ? 'bg-teal-600 text-white shadow-teal-600/30'
                          : 'bg-amber-600 text-white shadow-amber-600/30'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Grade</span>
                      <span className="text-3xl leading-none">{prediction.predictedGrade}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider ${
                            prediction.diseaseStatus === 'diseased'
                              ? 'bg-red-600 text-white shadow-xs'
                              : prediction.diseaseStatus === 'damaged'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {prediction.diseaseStatus === 'diseased' ? (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5" /> Disease / Infection Detected
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" /> Certified Healthy & Prime
                            </>
                          )}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                          Pathogen: {prediction.pathogenType}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                        {prediction.diseaseName}
                      </h2>
                      <p className="text-xs text-slate-600">
                        ICAR Standard Analysis • Confidence Score: <strong className="text-slate-900">{(prediction.confidence * 100).toFixed(1)}%</strong>
                      </p>
                    </div>
                  </div>

                  {/* Quality Premium Tag */}
                  <div className="bg-white/90 backdrop-blur-xs px-4 py-3 rounded-2xl border-2 border-slate-200 text-right shrink-0 shadow-xs">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Valuation Multiplier
                    </span>
                    <p
                      className={`text-xl font-black font-mono ${
                        prediction.suggestedPriceAdjustmentPercent >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {prediction.suggestedPriceAdjustmentPercent >= 0
                        ? `+${prediction.suggestedPriceAdjustmentPercent}% Premium`
                        : `${prediction.suggestedPriceAdjustmentPercent}% Discount`}
                    </p>
                    <span className="text-[10px] text-slate-500">vs APMC Mandi modal benchmark</span>
                  </div>
                </div>
              </div>

              {/* 🌟 AI RIGHT PRICE VALUATION SUITE CARD */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 text-white shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
                      ₹
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <span>AI Right Price Valuation</span>
                        <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase">
                          Zero Middleman
                        </span>
                      </h3>
                      <p className="text-xs text-emerald-200/80">
                        Derived from live APMC mandi wholesale rates + ICAR Grade {prediction.predictedGrade} standard
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">
                      Recommended Fair Rate
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
                      ₹{prediction.predictedFairPricePerKg}/kg
                    </span>
                    <span className="text-xs text-slate-300 block font-mono">
                      (₹{prediction.predictedPricePerQuintal}/Quintal)
                    </span>
                  </div>
                </div>

                {/* Right Price 4-Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Mandi Modal Rate</span>
                    <p className="text-base font-black text-white font-mono mt-0.5">
                      ₹{prediction.mandiModalPrice || 28.5}/kg
                    </p>
                    <span className="text-[10px] text-emerald-300">Agmarknet Base</span>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Fair Price Range</span>
                    <p className="text-base font-black text-emerald-300 font-mono mt-0.5">
                      ₹{prediction.recommendedPriceRange?.min || prediction.predictedFairPricePerKg} - ₹{prediction.recommendedPriceRange?.max || Math.round((prediction.predictedFairPricePerKg * 1.1) * 10) / 10}
                    </p>
                    <span className="text-[10px] text-slate-300">Acceptable Spread</span>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Per Quintal (100kg)</span>
                    <p className="text-base font-black text-amber-300 font-mono mt-0.5">
                      ₹{prediction.predictedPricePerQuintal || prediction.predictedFairPricePerKg * 100}
                    </p>
                    <span className="text-[10px] text-slate-300">Wholesale Lot</span>
                  </div>

                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] font-bold text-slate-300 uppercase">Net Farmer Benefit</span>
                    <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                      +100%
                    </p>
                    <span className="text-[10px] text-emerald-300">Direct Bank Payout</span>
                  </div>
                </div>

                {/* Valuation Rationale Box */}
                {prediction.priceRationale && (
                  <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs text-emerald-100 leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{prediction.priceRationale}</span>
                  </div>
                )}
              </div>

              {/* Crop Pathology & Agronomist Diagnostic Box */}
              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-700" />
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      ICAR Agronomist Pathology & Health Diagnostic
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold">Severity:</span>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        prediction.diseaseSeverityPercent === 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : prediction.diseaseSeverityPercent < 25
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {prediction.diseaseSeverityPercent}%
                    </span>
                  </div>
                </div>

                {/* Botanical Symptoms */}
                <div>
                  <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Botanical Symptoms & Visual Defect Markers:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {prediction.symptoms.map((symptom, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {prediction.diseaseStatus === 'diseased' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <span className="font-medium">{symptom}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Agronomist Treatment / Remedy Action */}
                {prediction.treatmentRecommendation && (
                  <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      <span>ICAR Agronomist Treatment & Storage Advice:</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {prediction.treatmentRecommendation}
                    </p>
                  </div>
                )}
              </div>

              {/* APMC Physical Quality Index Breakdown */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  APMC Physical Quality Index (0 - 100 Scale)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">Color Ripeness & Saturation</span>
                      <span className="text-emerald-700 font-black">{prediction.metrics.colorRipenessScore}/100</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${prediction.metrics.colorRipenessScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">Surface Texture & Symmetry</span>
                      <span className="text-emerald-700 font-black">{prediction.metrics.surfaceUniformityScore}/100</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${prediction.metrics.surfaceUniformityScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">Blemish-Free Skin Index</span>
                      <span className="text-emerald-700 font-black">{prediction.metrics.blemishFreeScore}/100</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${prediction.metrics.blemishFreeScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">Post-Harvest Freshness Index</span>
                      <span className="text-emerald-700 font-black">{prediction.metrics.freshnessIndex}/100</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${prediction.metrics.freshnessIndex}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Next Step Action: Sell Harvest at this Price */}
              <div className="pt-2 space-y-3">
                <button
                  id="sell-harvest-at-ai-price-btn"
                  onClick={handleSellAtFairPrice}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 group active:scale-98"
                >
                  <span>Sell {selectedCropHint} at AI Fair Price (₹{prediction.predictedFairPricePerKg}/kg)</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center text-xs text-slate-500">
                  Transfers certified Grade {prediction.predictedGrade} ({prediction.diseaseStatus === 'healthy' ? 'Healthy Prime' : 'Diseased / Processing'}), inspection photo, and AI fair rate directly to the Sell Harvest screen.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] bg-white rounded-3xl border-2 border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-xl font-black text-slate-900">
                  Ready to Inspect Crop Quality & Fair Price
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select any of the <strong>Healthy</strong> or <strong>Diseased</strong> test produce on the left, or snap a live photo with your camera to run full multimodal grading.
                </p>
              </div>
              <button
                type="button"
                onClick={() => runAnalysis()}
                disabled={analyzing}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Analysis on Selected Sample</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Inspection History Drawer / Table */}
      {pastPredictions.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                Recent AI Inspection Records
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {pastPredictions.length} scans saved in database
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pastPredictions.slice(0, 6).map((pred) => (
              <div
                key={pred.id}
                onClick={() => {
                  setPrediction(pred);
                  setSelectedCropHint(pred.cropHint || 'Produce');
                  if (pred.imageUrl) setPreviewUrl(pred.imageUrl);
                }}
                className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer transition-all flex items-center gap-3"
              >
                <img
                  src={pred.imageUrl || '/uploads/sample_produce.jpg'}
                  alt={pred.cropHint}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {pred.cropHint}
                    </p>
                    <span
                      className={`text-[10px] font-black px-2 py-0.2 rounded-full uppercase ${
                        pred.predictedGrade === 'A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pred.predictedGrade === 'B'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Grade {pred.predictedGrade}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {pred.diseaseName}
                  </p>
                  <p className="text-xs font-black text-emerald-700 font-mono mt-0.5">
                    ₹{pred.predictedFairPricePerKg || 30}/kg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
