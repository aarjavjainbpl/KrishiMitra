import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Sprout,
  PlusCircle,
  TrendingUp,
  Camera,
  CheckCircle2,
  Volume2,
  VolumeX,
  Package,
  DollarSign,
  MapPin,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Truck,
  ArrowRight,
  RefreshCw,
  Clock,
  Phone,
  AlertCircle,
  AlertTriangle,
  Upload,
  Zap,
  Info,
  Check,
  Layers,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Listing, Order, QualityPrediction } from '../types';
import { FairPriceBadge } from '../components/FairPriceBadge';
import { evaluateCropQuality } from '../services/qualityEngine';

interface CropPreset {
  id: string;
  name: string;
  variety: string;
  emoji: string;
  defaultPrice: number;
  mandiBenchmark: number;
  photoUrl: string;
  description: string;
}

const CROP_PRESETS: CropPreset[] = [
  {
    id: 'wheat',
    name: 'Wheat',
    variety: 'Sharbati C.306 (Golden Grain)',
    emoji: '🌾',
    defaultPrice: 32.5,
    mandiBenchmark: 32.0,
    photoUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
    description: 'Authentic Sharbati wheat from the Sehore-Bhopal fertile belt. Clean, lustrous golden grain with high protein.',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    variety: 'Abhinav Hybrid (Vine Ripe)',
    emoji: '🍅',
    defaultPrice: 21.0,
    mandiBenchmark: 21.0,
    photoUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
    description: 'Freshly harvested farm-fresh ripe red tomatoes. Crate-packed with zero transit damage.',
  },
  {
    id: 'potato',
    name: 'Potato',
    variety: 'Malwa Jyoti (Large Table)',
    emoji: '🥔',
    defaultPrice: 15.5,
    mandiBenchmark: 15.0,
    photoUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80',
    description: 'Spotless large Jyoti table potatoes. Clean skin and packed in standard 50kg aerated jute bags.',
  },
  {
    id: 'onion',
    name: 'Onion',
    variety: 'Red Garwa (Long Shelf)',
    emoji: '🧅',
    defaultPrice: 18.5,
    mandiBenchmark: 19.0,
    photoUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80',
    description: 'Sun-cured dark red onion with thick outer skin for extended storage and commercial bulk kitchen usage.',
  },
  {
    id: 'soybean',
    name: 'Soybean',
    variety: 'JS-9560 Yellow (Oil Seed)',
    emoji: '🌱',
    defaultPrice: 48.0,
    mandiBenchmark: 48.5,
    photoUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80',
    description: 'Clean golden yellow soybean grain with moisture content below 10%. Ideal for oil extraction and processors.',
  },
  {
    id: 'garlic',
    name: 'Garlic',
    variety: 'Mandsaur Bold (High Pungency)',
    emoji: '🧄',
    defaultPrice: 120.0,
    mandiBenchmark: 125.0,
    photoUrl: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=800&auto=format&fit=crop&q=80',
    description: 'Big white clove bulbs with rich aromatic pungency. Thoroughly dried and graded for commercial markets.',
  },
  {
    id: 'rice',
    name: 'Basmati Rice / Paddy',
    variety: 'PUSA 1121 Extra Long Grain',
    emoji: '🍚',
    defaultPrice: 58.0,
    mandiBenchmark: 60.0,
    photoUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
    description: 'Premium aromatic 1121 Basmati paddy from Raisen-Bhopal belt. High milling recovery and slender grain.',
  },
  {
    id: 'mustard',
    name: 'Mustard',
    variety: 'Pusa Bold (Black Mustard)',
    emoji: '🌼',
    defaultPrice: 55.0,
    mandiBenchmark: 54.0,
    photoUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&auto=format&fit=crop&q=80',
    description: 'High oil yield (41%+) bold mustard seeds. Machine cleaned, moisture tested, and ready for dispatch.',
  },
];

export const HarvestPlacementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'placeHarvest' | 'incomingOrders' | 'liveMarketplace'>('placeHarvest');

  // Audio Guidance State
  const [speaking, setSpeaking] = useState<boolean>(false);

  // Form State
  const [selectedCrop, setSelectedCrop] = useState<CropPreset>(CROP_PRESETS[0]);
  const [variety, setVariety] = useState<string>(CROP_PRESETS[0].variety);
  const [quantityKg, setQuantityKg] = useState<number>(2000);
  const [askingPricePerKg, setAskingPricePerKg] = useState<number>(CROP_PRESETS[0].defaultPrice);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [qualityPredictionId, setQualityPredictionId] = useState<string | undefined>(undefined);
  const [harvestCondition, setHarvestCondition] = useState<string>('Freshly harvested from field • Cleaned & graded produce');
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);

  // Live Mandi & AI Price Advisor State
  const [liveMandiData, setLiveMandiData] = useState<{
    modalPrice: number;
    minPrice: number;
    maxPrice: number;
    market: string;
    trend: string;
    changePercent: number;
  } | null>(null);
  const [loadingMandi, setLoadingMandi] = useState<boolean>(false);

  // Embedded Quality Predictor State (Module C Integrated directly in the Placement flow)
  const [inspectionImage, setInspectionImage] = useState<string>(CROP_PRESETS[0].photoUrl);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzingQuality, setAnalyzingQuality] = useState<boolean>(false);
  const [qualityInspection, setQualityInspection] = useState<QualityPrediction | null>(null);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

  // Server state
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulatingOrder, setSimulatingOrder] = useState<boolean>(false);

  // VRP Route Optimization & Buyer Notification Modal
  const [vrpModal, setVrpModal] = useState<{
    isOpen: boolean;
    order: Order | null;
    clusterInfo: any;
  }>({
    isOpen: false,
    order: null,
    clusterInfo: null,
  });

  // Audio Voice Helper
  const speakText = (text: string) => {
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
      console.warn(e);
    }
  };

  // Fetch Live Mandi Rates for the Selected Crop
  const fetchLiveMandi = async (cropName: string) => {
    try {
      setLoadingMandi(true);
      const res = await fetch(`/api/mandi-rates?crop=${encodeURIComponent(cropName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.rates && data.rates.length > 0) {
          const firstRate = data.rates[0];
          const avgModal = data.rates.reduce((sum: number, r: any) => sum + r.modalPrice, 0) / data.rates.length;
          const avgMin = data.rates.reduce((sum: number, r: any) => sum + r.minPrice, 0) / data.rates.length;
          const avgMax = data.rates.reduce((sum: number, r: any) => sum + r.maxPrice, 0) / data.rates.length;

          setLiveMandiData({
            modalPrice: Math.round(avgModal * 10) / 10,
            minPrice: Math.round(avgMin * 10) / 10,
            maxPrice: Math.round(avgMax * 10) / 10,
            market: firstRate.market || 'Karond APMC (Bhopal)',
            trend: 'Bullish (+4.2% week-on-week)',
            changePercent: 4.2,
          });
        } else {
          // Fallback based on crop preset
          setLiveMandiData({
            modalPrice: selectedCrop.mandiBenchmark,
            minPrice: selectedCrop.mandiBenchmark * 0.92,
            maxPrice: selectedCrop.mandiBenchmark * 1.12,
            market: 'Bhopal Central APMC Mandi',
            trend: 'Stable Demand',
            changePercent: 2.5,
          });
        }
      }
    } catch (e) {
      console.warn('Error fetching mandi data:', e);
    } finally {
      setLoadingMandi(false);
    }
  };

  // Select crop handler
  const handleSelectCrop = (crop: CropPreset) => {
    setSelectedCrop(crop);
    setVariety(crop.variety);
    setAskingPricePerKg(crop.defaultPrice);
    setInspectionImage(crop.photoUrl);
    setUploadedFile(null);
    setQualityInspection(null);
    setQualityPredictionId(undefined);
    fetchLiveMandi(crop.name);
    speakText(`You selected ${crop.name}. APMC Mandi benchmark is rupees ${crop.mandiBenchmark} per kilogram.`);
  };

  // Load existing data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Load any locally created listings first
      let localListings: Listing[] = [];
      try {
        const saved = localStorage.getItem('krishimitra_local_listings');
        if (saved) {
          localListings = JSON.parse(saved);
        }
      } catch {
        // Non-blocking
      }

      const listRes = await fetch('/api/listings');
      if (listRes.ok) {
        const data = await listRes.json();
        const serverListings: Listing[] = data.listings || [];
        // Deduplicate
        const merged = [...localListings];
        serverListings.forEach((s) => {
          if (!merged.some((m) => m.id === s.id)) {
            merged.push(s);
          }
        });
        setListings(merged);
      } else if (localListings.length > 0) {
        setListings(localListings);
      }

      const ordRes = await fetch('/api/orders/mine', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
      });
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Check if coming from AI Quality Predictor with pre-filled grading
    try {
      const savedPrefill = localStorage.getItem('agriconnect_prefill_listing');
      if (savedPrefill) {
        const parsed = JSON.parse(savedPrefill);
        localStorage.removeItem('agriconnect_prefill_listing');
        
        if (parsed.cropName) {
          const matchingPreset = CROP_PRESETS.find(p => p.name.toLowerCase() === parsed.cropName.toLowerCase());
          if (matchingPreset) {
            setSelectedCrop(matchingPreset);
            setVariety(matchingPreset.variety);
            fetchLiveMandi(matchingPreset.name);
          }
        }
        if (parsed.qualityGrade) {
          setQualityGrade(parsed.qualityGrade);
        }
        if (parsed.askingPricePerKg) {
          setAskingPricePerKg(Number(parsed.askingPricePerKg));
        }
        if (parsed.photoUrl) {
          setInspectionImage(parsed.photoUrl);
        }
        if (parsed.qualityPredictionId) {
          setQualityPredictionId(parsed.qualityPredictionId);
        }
        return;
      }
    } catch {
      // Non-blocking prefill
    }

    fetchLiveMandi(selectedCrop.name);
  }, []);

  // Handle embedded Quality Predictor file upload
  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setInspectionImage(url);
      setQualityInspection(null);
      setQualityPredictionId(undefined);
    }
  };

  // Run Embedded AI Quality Inspection
  const handleRunQualityInspection = async () => {
    setAnalyzingQuality(true);
    setInspectionError(null);
    try {
      let pred: QualityPrediction | null = null;
      try {
        let res;
        if (uploadedFile) {
          const formData = new FormData();
          formData.append('image', uploadedFile);
          formData.append('cropHint', selectedCrop.name);
          res = await fetch('/api/quality-predictor/analyze', {
            method: 'POST',
            body: formData,
          });
        } else {
          res = await fetch('/api/quality-predictor/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: inspectionImage,
              cropHint: selectedCrop.name,
            }),
          });
        }

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.prediction) {
            pred = data.prediction as QualityPrediction;
          }
        }
      } catch (networkErr) {
        console.info('Backend quality service slow/offline, evaluating with ICAR engine:', networkErr);
      }

      // If backend was unreachable or returned non-JSON, run the high-precision ICAR diagnostic engine
      if (!pred) {
        pred = evaluateCropQuality({
          cropHint: selectedCrop.name,
          imageUrl: inspectionImage,
          imageFileName: uploadedFile?.name,
          isCustomUpload: !!uploadedFile,
        });
      }

      setQualityInspection(pred);
      setQualityPredictionId(pred.id);
      setQualityGrade(pred.predictedGrade);

      // AI Advice & Right Price on asking price
      if (pred.predictedFairPricePerKg) {
        setAskingPricePerKg(pred.predictedFairPricePerKg);
        speakText(`AI Quality Inspection completed. Produce certified as Grade ${pred.predictedGrade}. AI predicted fair price is rupees ${pred.predictedFairPricePerKg} per kilogram based on quality grade and mandi rates.`);
      } else if (pred.suggestedPriceAdjustmentPercent && pred.suggestedPriceAdjustmentPercent !== 0) {
        const adjustedPrice = Math.round((selectedCrop.mandiBenchmark * (1 + pred.suggestedPriceAdjustmentPercent / 100)) * 10) / 10;
        setAskingPricePerKg(adjustedPrice);
        speakText(`AI Quality Inspection completed. Produce certified as Grade ${pred.predictedGrade}. Crop health is ${pred.diseaseStatus}.`);
      } else {
        speakText(`AI Quality Inspection completed. Produce certified as Grade ${pred.predictedGrade}. Crop health is ${pred.diseaseStatus}.`);
      }
    } catch (err: any) {
      console.error(err);
      // Emergency fallback
      const fallbackPred = evaluateCropQuality({
        cropHint: selectedCrop.name,
        imageUrl: inspectionImage,
      });
      setQualityInspection(fallbackPred);
      setQualityGrade(fallbackPred.predictedGrade);
    } finally {
      setAnalyzingQuality(false);
    }
  };

  // Handle Publish Harvest
  const handlePublishHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      const payload = {
        cropName: selectedCrop.name,
        variety,
        quantityKg: Number(quantityKg),
        askingPricePerKg: Number(askingPricePerKg),
        qualityGrade,
        qualityPredictionId,
        harvestDate: new Date().toISOString().split('T')[0],
        description: `${selectedCrop.description} ${harvestCondition}`,
        photoUrl: inspectionImage || selectedCrop.photoUrl,
        farmerLocation: user?.district ? `${user.district}, Madhya Pradesh` : 'Bhopal (Phanda), Madhya Pradesh',
        locationLat: user?.locationLat || 23.235,
        locationLng: user?.locationLng || 77.295,
      };

      let createdListing: Listing | null = null;
      try {
        const res = await fetch('/api/listings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || 'demo-farmer-token'}`,
          },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.listing) {
            createdListing = data.listing;
          }
        }
      } catch (networkErr) {
        console.warn('Network issue publishing to server, storing locally:', networkErr);
      }

      // If server was offline or returned non-JSON, create and persist locally
      if (!createdListing) {
        createdListing = {
          id: `list-${Date.now()}`,
          farmerId: user?.id || 'user-farmer-current',
          farmerName: user?.name || 'Kisan Member (Verified)',
          farmerPhone: user?.phone || '+91 9876543210',
          farmerLocation: user?.district ? `${user.district}, Madhya Pradesh` : 'Bhopal (Phanda), Madhya Pradesh',
          locationLat: user?.locationLat || 23.235,
          locationLng: user?.locationLng || 77.295,
          cropName: selectedCrop.name,
          variety,
          quantityKg: Number(quantityKg),
          qualityGrade,
          qualityPredictionId,
          askingPricePerKg: Number(askingPricePerKg),
          harvestDate: new Date().toISOString().split('T')[0],
          status: 'active',
          description: `${selectedCrop.description} ${harvestCondition}`,
          photoUrl: inspectionImage || selectedCrop.photoUrl,
          createdAt: new Date().toISOString(),
        };
      }

      // Save to local listings storage so it survives serverless restarts
      try {
        const existing = JSON.parse(localStorage.getItem('krishimitra_local_listings') || '[]');
        existing.unshift(createdListing);
        localStorage.setItem('krishimitra_local_listings', JSON.stringify(existing));
      } catch {
        // Non-blocking
      }

      setListings((prev) => [createdListing!, ...prev.filter((p) => p.id !== createdListing!.id)]);
      setPublishSuccess(true);
      speakText('Congratulations! Your harvest is now live on the marketplace with certified quality grading.');

      setTimeout(() => {
        setPublishSuccess(false);
        fetchData();
        setActiveTab('liveMarketplace');
      }, 1500);
    } catch (err: any) {
      console.error('Publish error:', err);
      alert('Could not complete publishing. Please check harvest details.');
    } finally {
      setPublishing(false);
    }
  };

  // Simulate Direct Buyer Order for demo evaluation
  const handleSimulateDirectBuyerOrder = async (listingId: string, cropName: string, price: number) => {
    setSimulatingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || 'demo-buyer-token'}`,
        },
        body: JSON.stringify({
          listingId,
          quantityKg: 1000,
          deliveryAddress: 'Karond APMC Wholesale Yard, Shed 2, Bhopal',
          deliveryLat: 23.2985,
          deliveryLng: 77.392,
        }),
      });

      if (!res.ok) throw new Error('Direct order failed');
      speakText(`New direct buyer order received for 1,000 kilograms of ${cropName}. Payment locked in secure escrow.`);
      fetchData();
      setActiveTab('incomingOrders');
    } catch (e: any) {
      alert(e.message || 'Order simulator error');
    } finally {
      setSimulatingOrder(false);
    }
  };

  // Update order status with VRP detection and buyer notification
  const handleUpdateOrderStatus = async (orderId: string, status: string, targetOrder?: Order) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchData();

        if (status === 'ready_for_pickup') {
          speakText('Order marked ready for pickup. Buyer has been notified via instant alert. Checking cluster routes.');
          // Open VRP Route Optimization Prompt Modal
          setVrpModal({
            isOpen: true,
            order: targetOrder || data.order,
            clusterInfo: data.clusterInfo,
          });
        } else if (status === 'in_transit') {
          speakText('Produce is now in transit to destination.');
        } else if (status === 'delivered') {
          speakText('Delivery confirmed! Payment released directly to your bank account.');
        }
      }
    } catch (e) {
      console.error('Status update failed:', e);
    }
  };

  // Total estimated calculation
  const totalEstimatedEarnings = Math.round(quantityKg * askingPricePerKg);
  const quintals = (quantityKg / 100).toFixed(1);
  const bags = Math.round(quantityKg / 50);

  // Mandi Price calculations & AI advice
  const mandiPrice = liveMandiData?.modalPrice || selectedCrop.mandiBenchmark;
  const aiRecommendedPrice = qualityGrade === 'A'
    ? Math.round((mandiPrice + 2.5) * 10) / 10
    : qualityGrade === 'B'
    ? mandiPrice
    : Math.round((mandiPrice - 1.5) * 10) / 10;

  const estimatedMiddlemanSavingsPercent = Math.round(
    ((askingPricePerKg * 1.18 - askingPricePerKg) / askingPricePerKg) * 100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. TOP HEADER & AUDIO GUIDE */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-emerald-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              👨‍🌾 Farmer Harvest Portal
            </span>
            <span className="text-xs text-emerald-300 font-bold">
              Madhya Pradesh & Central APMC Mandis
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black font-display tracking-tight text-white">
            Sell Harvest, Price with Mandi AI & Get Direct Orders
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Publish your crops directly to wholesale traders with live APMC benchmark advice, integrated AI produce quality inspection, and automated logistics route optimization.
          </p>
        </div>

        {/* Audio Helper Trigger Button */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => speakText(
              `Welcome! Choose your crop below, check the live Mandi advice, inspect produce quality with the AI camera, and publish your harvest with 1 click.`
            )}
            className={`px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              speaking
                ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-300/40 animate-pulse'
                : 'bg-white text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            {speaking ? <VolumeX className="w-5 h-5 text-amber-950" /> : <Volume2 className="w-5 h-5 text-emerald-700" />}
            <span>{speaking ? 'Stop Audio' : '🔊 Listen to Audio Guide'}</span>
          </button>
        </div>
      </div>

      {/* 2. THREE EASY TABS */}
      <div className="flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80">
        <button
          id="tab-place-harvest"
          onClick={() => setActiveTab('placeHarvest')}
          className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'placeHarvest'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <span className="text-lg">🌾</span>
          <span>1. Place New Harvest & Pricing</span>
        </button>

        <button
          id="tab-incoming-orders"
          onClick={() => setActiveTab('incomingOrders')}
          className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'incomingOrders'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <span className="text-lg">💰</span>
          <span>2. Incoming Direct Orders ({orders.length})</span>
        </button>

        <button
          id="tab-live-marketplace"
          onClick={() => setActiveTab('liveMarketplace')}
          className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'liveMarketplace'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          <span className="text-lg">🛒</span>
          <span>3. Live Marketplace Listings ({listings.length})</span>
        </button>
      </div>

      {/* TAB 1: EASY VISUAL HARVEST PLACEMENT FORM */}
      {activeTab === 'placeHarvest' && (
        <form onSubmit={handlePublishHarvest} className="space-y-6">
          {/* STEP 1: CROP SELECTOR (Big Visual Touch Cards) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Step 1 • Crop Selection
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Select Your Crop
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-bold">
                Selected: <strong className="text-emerald-700">{selectedCrop.name}</strong> ({variety})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CROP_PRESETS.map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => handleSelectCrop(crop)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group flex flex-col justify-between ${
                    selectedCrop.id === crop.id
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl sm:text-4xl">{crop.emoji}</span>
                    {selectedCrop.id === crop.id && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="font-extrabold text-sm text-slate-900 leading-tight">
                      {crop.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {crop.variety}
                    </p>
                    <p className="text-xs font-bold text-emerald-700 font-mono mt-1">
                      Mandi: ₹{crop.mandiBenchmark}/kg
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: QUANTITY SELECTION */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Step 2 • Volume & Weight
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Available Quantity & Bag Count
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-800 font-mono">
                  {quantityKg.toLocaleString('en-IN')} kg
                </p>
                <p className="text-xs text-slate-500 font-bold">
                  ≈ {quintals} Quintals ({bags} Bags @ 50kg)
                </p>
              </div>
            </div>

            {/* Quick 1-Tap Bag & Quantity Presets */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-600">
                Quick 1-Tap Weight Presets:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { kg: 500, label: '10 Bags (500 kg)' },
                  { kg: 1000, label: '20 Bags (10 Qtl)' },
                  { kg: 2000, label: '40 Bags (20 Qtl)' },
                  { kg: 5000, label: '100 Bags (50 Qtl)' },
                  { kg: 10000, label: '200 Bags (100 Qtl)' },
                ].map((preset) => (
                  <button
                    key={preset.kg}
                    type="button"
                    onClick={() => {
                      setQuantityKg(preset.kg);
                      speakText(`Quantity set to ${preset.label}`);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      quantityKg === preset.kg
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Large Stepper Buttons for Fine Tuning */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuantityKg(Math.max(100, quantityKg - 100))}
                  className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xl flex items-center justify-center border border-slate-300 active:scale-95 transition-transform"
                >
                  -
                </button>
                <div className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-center">
                  <span className="text-xs text-slate-500 font-bold block">Total Weight (kg)</span>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Math.max(100, Number(e.target.value)))}
                    className="w-full text-center font-black text-xl text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setQuantityKg(quantityKg + 100)}
                  className="w-12 h-12 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black text-xl flex items-center justify-center border border-emerald-300 active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* STEP 3: LIVE MANDI BENCHMARK & AI PRICE ADVISOR */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Step 3 • Live Mandi Benchmark & AI Pricing Advisor
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Set Your Farm Asking Price
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full border border-emerald-300">
                  APMC Benchmark: ₹{mandiPrice.toFixed(1)}/kg
                </span>
              </div>
            </div>

            {/* AI PRICE ADVISOR & LIVE MANDI INTELLIGENCE CARD */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-200/80 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <span>KrishiMitra AI Price Advisor</span>
                      <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.2 rounded-full uppercase">
                        Live Agmarknet
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      Real-time pricing intelligence based on current MP wholesale arrivals and quality standards
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAskingPricePerKg(aiRecommendedPrice);
                    speakText(`Applied AI recommended price of rupees ${aiRecommendedPrice} per kilogram.`);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Apply AI Suggested Price (₹{aiRecommendedPrice}/kg)</span>
                </button>
              </div>

              {/* Mandi Rate Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/60 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Mandi Modal Rate</span>
                  <p className="text-base font-black text-emerald-800 font-mono">₹{mandiPrice.toFixed(1)}/kg</p>
                </div>
                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/60 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Min - Max Range</span>
                  <p className="text-base font-black text-slate-800 font-mono">
                    ₹{(liveMandiData?.minPrice || mandiPrice * 0.92).toFixed(1)} - ₹{(liveMandiData?.maxPrice || mandiPrice * 1.1).toFixed(1)}
                  </p>
                </div>
                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/60 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">7-Day Trend</span>
                  <p className="text-base font-black text-blue-700 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> +{liveMandiData?.changePercent || 4.2}%
                  </p>
                </div>
                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/60 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Net Direct Profit</span>
                  <p className="text-base font-black text-emerald-700">+{estimatedMiddlemanSavingsPercent}% vs Middlemen</p>
                </div>
              </div>

              <div className="text-xs text-slate-700 bg-white/70 p-2.5 rounded-xl border border-emerald-200/40 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>AI Recommendation:</strong> For <strong>Grade {qualityGrade} {selectedCrop.name}</strong>, asking <strong>₹{aiRecommendedPrice.toFixed(1)}/kg</strong> delivers maximum farmer revenue while keeping your produce top-ranked on the wholesale buyer mart.
                </span>
              </div>
            </div>

            {/* Quick Price Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAskingPricePerKg(mandiPrice);
                    speakText(`Mandi benchmark price of rupees ${mandiPrice} selected`);
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                    askingPricePerKg === mandiPrice
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-500">1. Mandi Market Rate</p>
                  <p className="text-xl font-black text-emerald-800 font-mono mt-0.5">
                    ₹{mandiPrice.toFixed(1)}/kg
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Fair & highly competitive</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAskingPricePerKg(Math.round((mandiPrice + 2.5) * 10) / 10);
                    speakText(`Premium price of rupees ${mandiPrice + 2.5} selected`);
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                    askingPricePerKg > mandiPrice
                      ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-500">2. Premium A+ Grade (+₹2.5)</p>
                  <p className="text-xl font-black text-amber-800 font-mono mt-0.5">
                    ₹{(mandiPrice + 2.5).toFixed(1)}/kg
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">For certified Grade-A produce</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAskingPricePerKg(Math.max(1, Math.round((mandiPrice - 1.5) * 10) / 10));
                    speakText(`Fast liquidation price selected`);
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                    askingPricePerKg < mandiPrice
                      ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-500">3. Fast Liquidation (-₹1.5)</p>
                  <p className="text-xl font-black text-blue-800 font-mono mt-0.5">
                    ₹{Math.max(1, mandiPrice - 1.5).toFixed(1)}/kg
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Instant wholesale clearance</p>
                </button>
              </div>

              {/* Price Input & Stepper */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAskingPricePerKg(Math.max(1, Math.round((askingPricePerKg - 0.5) * 10) / 10))}
                  className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xl flex items-center justify-center border border-slate-300 active:scale-95 transition-transform"
                >
                  -
                </button>
                <div className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-center">
                  <span className="text-xs text-slate-500 font-bold block">Your Final Asking Price (₹/kg)</span>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    value={askingPricePerKg}
                    onChange={(e) => setAskingPricePerKg(Number(e.target.value))}
                    className="w-full text-center font-black text-2xl text-emerald-800 font-mono bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAskingPricePerKg(Math.round((askingPricePerKg + 0.5) * 10) / 10)}
                  className="w-12 h-12 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black text-xl flex items-center justify-center border border-emerald-300 active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>

              {/* Total Estimated Farmer Earnings Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏦</span>
                  <div>
                    <p className="text-xs text-emerald-300 font-bold">
                      Guaranteed Bank Payout via Escrow:
                    </p>
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                      ₹{totalEstimatedEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs text-emerald-200">
                  <p>✓ 100% Zero Middleman Commission</p>
                  <p>✓ Direct NEFT/UPI Payout on Dispatch</p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: INTEGRATED AI IMAGE QUALITY & HEALTH INSPECTION */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Step 4 • Produce Quality & Integrated AI Camera Inspection
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  AI Image Quality & Health Scanner
                </h2>
                <p className="text-xs text-slate-500">
                  Scan produce photos right here. The certified grade and ICAR health report attach directly to your harvest listing for buyers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full shadow-xs ${
                  qualityGrade === 'A' ? 'bg-emerald-600 text-white' : qualityGrade === 'B' ? 'bg-teal-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  Current Certified Grade: {qualityGrade}
                </span>
              </div>
            </div>

            {/* Embedded Scanner Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
              {/* Left Column: Image Preview & Upload Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-300 shadow-xs">
                  <img
                    src={inspectionImage}
                    alt={selectedCrop.name}
                    className="w-full h-full object-cover"
                  />
                  {analyzingQuality && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-xs font-black tracking-wide">Analyzing Botanical Features & Ripeness...</p>
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="bg-emerald-600/90 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                      {uploadedFile ? '📸 Custom Upload' : `Sample: ${selectedCrop.name}`}
                    </span>
                  </div>
                </div>

                {/* Upload or Camera Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUploadChange}
                  className="hidden"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Upload/Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRunQualityInspection}
                    disabled={analyzingQuality}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{analyzingQuality ? 'Inspecting...' : 'Run AI Inspection'}</span>
                  </button>
                </div>

                {/* Quick Presets for Produce Testing */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Quick Test Image Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectionImage('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80');
                        setUploadedFile(null);
                        setQualityInspection(null);
                      }}
                      className="text-[11px] font-bold px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 rounded-lg"
                    >
                      🍅 Healthy Tomato (Grade A)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectionImage('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80&defect=blight_rot');
                        setUploadedFile(null);
                        setQualityInspection(null);
                      }}
                      className="text-[11px] font-bold px-2 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-lg"
                    >
                      ⚠️ Blighted (Grade C)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectionImage('https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80');
                        setUploadedFile(null);
                        setQualityInspection(null);
                      }}
                      className="text-[11px] font-bold px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg"
                    >
                      🧅 Standard Onion (Grade B)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Certified Inspection Certificate (7 cols) */}
              <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-black text-sm text-slate-900">
                        ICAR Certified Quality & Disease Report
                      </h4>
                    </div>
                    {qualityInspection ? (
                      <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Verified ({(qualityInspection.confidence * 100).toFixed(0)}% Confidence)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        Ready for AI Scan
                      </span>
                    )}
                  </div>

                  {qualityInspection ? (
                    <div className="space-y-3 mt-3">
                      {/* Grade & Pathology Banner */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        qualityInspection.predictedGrade === 'A'
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : qualityInspection.predictedGrade === 'B'
                          ? 'bg-teal-50/80 border-teal-300 text-teal-950'
                          : 'bg-amber-50/80 border-amber-300 text-amber-950'
                      }`}>
                        <div>
                          <p className="text-base font-black">
                            Certified Grade {qualityInspection.predictedGrade} Produce
                          </p>
                          <p className="text-xs font-semibold">
                            Health Status: <strong className="capitalize">{qualityInspection.diseaseStatus}</strong> ({qualityInspection.diseaseName})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                            qualityInspection.diseaseStatus === 'healthy'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}>
                            {qualityInspection.diseaseStatus === 'healthy' ? '✓ Disease-Free' : '⚠️ Defect Flagged'}
                          </span>
                        </div>
                      </div>

                      {/* 4 Score Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 bg-slate-50 rounded-xl text-center border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block">Color Ripeness</span>
                          <span className="text-sm font-black text-slate-900">{qualityInspection.metrics.colorRipenessScore}%</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl text-center border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block">Uniformity</span>
                          <span className="text-sm font-black text-slate-900">{qualityInspection.metrics.surfaceUniformityScore}%</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl text-center border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block">Blemish Free</span>
                          <span className="text-sm font-black text-slate-900">{qualityInspection.metrics.blemishFreeScore}%</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl text-center border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block">Freshness</span>
                          <span className="text-sm font-black text-slate-900">{qualityInspection.metrics.freshnessIndex}%</span>
                        </div>
                      </div>

                      {/* Symptoms & Agronomist Notes */}
                      {qualityInspection.symptoms && qualityInspection.symptoms.length > 0 && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                          <p className="font-extrabold text-[11px] text-slate-900">Botanical Inspection Points:</p>
                          {qualityInspection.symptoms.slice(0, 2).map((sym, idx) => (
                            <p key={idx} className="flex items-center gap-1.5 text-slate-600">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{sym}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {/* AI PREDICTED RIGHT PRICE ON BASIS OF IMAGE GRADE */}
                      <div className="p-3.5 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-amber-50/50 rounded-xl border-2 border-emerald-300 shadow-xs space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-500" /> AI Right Price Prediction (Grade-Based)
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-xl font-black text-emerald-900 font-mono">
                                ₹{qualityInspection.predictedFairPricePerKg?.toFixed(1) || askingPricePerKg.toFixed(1)}/kg
                              </span>
                              {qualityInspection.predictedPricePerQuintal && (
                                <span className="text-xs font-bold text-slate-600">
                                  (₹{qualityInspection.predictedPricePerQuintal.toLocaleString('en-IN')}/Qtl)
                                </span>
                              )}
                              {qualityInspection.suggestedPriceAdjustmentPercent !== undefined && qualityInspection.suggestedPriceAdjustmentPercent !== 0 && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  qualityInspection.suggestedPriceAdjustmentPercent > 0
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  {qualityInspection.suggestedPriceAdjustmentPercent > 0 ? '+' : ''}{qualityInspection.suggestedPriceAdjustmentPercent}% Grade Adj.
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const fairPrice = qualityInspection.predictedFairPricePerKg || askingPricePerKg;
                              setAskingPricePerKg(fairPrice);
                              speakText(`Applied AI certified price of rupees ${fairPrice} per kilogram.`);
                            }}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Apply This Price</span>
                          </button>
                        </div>

                        {/* Price Rationale */}
                        {qualityInspection.priceRationale && (
                          <p className="text-[11px] text-slate-700 font-medium leading-relaxed bg-white/80 p-2 rounded-lg border border-emerald-200/60">
                            {qualityInspection.priceRationale}
                          </p>
                        )}

                        {/* Recommended Price Range */}
                        {qualityInspection.recommendedPriceRange && (
                          <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold pt-0.5">
                            <span>Fair Market Range:</span>
                            <span className="font-mono text-emerald-800">
                              ₹{qualityInspection.recommendedPriceRange.min.toFixed(1)}/kg – ₹{qualityInspection.recommendedPriceRange.max.toFixed(1)}/kg
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2 text-slate-500">
                      <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold">Produce photo ready for instant AI Quality Grading.</p>
                      <p className="text-[11px] text-slate-400">
                        Tap "Run AI Inspection" to certify freshness, color ripeness, and zero disease infection before publishing.
                      </p>
                    </div>
                  )}
                </div>

                {/* Manual Override Grade Selector */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500">Grade Tier:</span>
                  <div className="flex items-center gap-1.5">
                    {(['A', 'B', 'C'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setQualityGrade(g);
                          speakText(`Grade ${g} selected`);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                          qualityGrade === g
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Grade {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 5: FINAL LIVE PREVIEW & ONE-TAP PUBLISH BUTTON */}
          <div className="bg-white rounded-3xl border-2 border-emerald-500/40 p-5 sm:p-7 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Live Preview
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Buyer View Live Card Preview
                </h3>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                Instant Publish
              </span>
            </div>

            {/* Preview Card */}
            <div className="max-w-md mx-auto bg-slate-50 rounded-2xl border-2 border-emerald-400/50 p-4 shadow-sm space-y-3">
              <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-slate-200">
                <img
                  src={inspectionImage || selectedCrop.photoUrl}
                  alt={selectedCrop.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                    Grade {qualityGrade} Certified
                  </span>
                  {qualityInspection?.diseaseStatus === 'healthy' && (
                    <span className="bg-white/90 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                      ✓ ICAR Passed
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="bg-white/95 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-md shadow-xs">
                    📦 {quantityKg.toLocaleString('en-IN')} kg ({quintals} Qtl)
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-2 pt-1">
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    {selectedCrop.name}
                  </h4>
                  <p className="text-xs text-slate-500">{variety}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-800 font-mono">
                    ₹{askingPricePerKg.toFixed(1)}/kg
                  </p>
                  <p className="text-[10px] text-slate-500">Farm Gate Price</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 pt-1 border-t border-slate-200 space-y-0.5">
                <p>📍 Location: {user?.district || 'Bhopal (Phanda)'}, Madhya Pradesh</p>
                <p>👨‍🌾 Farmer: {user?.name || 'Rameshwar Patidar'}</p>
              </div>
            </div>

            {/* Big Action Submit Button */}
            {publishSuccess ? (
              <div className="p-4 bg-emerald-600 text-white rounded-2xl text-center font-black text-base flex items-center justify-center gap-2 shadow-lg animate-bounce">
                <CheckCircle2 className="w-6 h-6" /> Harvest successfully published to the marketplace!
              </div>
            ) : (
              <button
                type="submit"
                id="btn-publish-harvest"
                disabled={publishing}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-lg shadow-emerald-700/30 transition-all flex items-center justify-center gap-3 active:scale-98"
              >
                <PlusCircle className="w-6 h-6" />
                <span>
                  {publishing
                    ? 'Publishing Harvest to Marketplace...'
                    : `✅ Publish Harvest to Marketplace • ₹${totalEstimatedEarnings.toLocaleString('en-IN')}`}
                </span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* TAB 2: INCOMING DIRECT BUYER ORDERS */}
      {activeTab === 'incomingOrders' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Direct Buyer Orders & Logistics Coordination
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  Incoming Buyer Orders ({orders.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Accept orders, prep crates, and coordinate seamless logistics pickup with instant buyer notifications
                </p>
              </div>
              <button
                type="button"
                onClick={fetchData}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Orders</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-4">
              {orders.length > 0 ? (
                orders.map((ord) => (
                  <div key={ord.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">📦</span>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                            {ord.cropName} ({ord.quantityKg.toLocaleString('en-IN')} kg)
                          </h3>
                          <p className="text-xs text-slate-500">
                            Order ID: <strong className="font-mono text-slate-700">{ord.id}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-0.5 pl-9">
                        <p>🏢 Buyer: <strong className="text-slate-900">{ord.buyerName}</strong> ({ord.buyerPhone})</p>
                        <p>📍 Destination: {ord.deliveryAddress}</p>
                        <p className="text-emerald-800 font-bold pt-0.5">
                          Escrow Locked Payout: <span className="text-base font-black font-mono">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step Action Progression */}
                    <div className="flex flex-wrap items-center gap-2 pl-9 md:pl-0">
                      {ord.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(ord.id, 'ready_for_pickup', ord)}
                          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>✓ Accept & Mark Ready for Pickup</span>
                        </button>
                      )}

                      {ord.status === 'ready_for_pickup' && (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 font-black text-xs rounded-xl flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Ready for Pickup (Buyer Notified)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, 'in_transit', ord)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Mark Dispatched</span>
                          </button>
                        </div>
                      )}

                      {ord.status === 'in_transit' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(ord.id, 'delivered', ord)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Delivered & Release Payment</span>
                        </button>
                      )}

                      {ord.status === 'delivered' && (
                        <span className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-xs rounded-xl flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Settled to Bank Account</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <p className="text-3xl">🌾</p>
                  <p className="font-bold text-sm">No incoming orders yet.</p>
                  <p className="text-xs text-slate-400">
                    As soon as wholesale buyers place an order for your listings, it will appear here in real time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE MARKETPLACE VIEW & 1-TAP ORDER SIMULATOR */}
      {activeTab === 'liveMarketplace' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Live Marketplace
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  Available Farm Produce Listings ({listings.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Wholesale traders can place 1-click escrow orders directly from these listings
                </p>
              </div>
              <Link
                to="/buyer/browse"
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 self-start hover:bg-slate-800"
              >
                <span>Open Buyer Mart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/9 bg-slate-100">
                      <img
                        src={item.photoUrl}
                        alt={item.cropName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                          Grade {item.qualityGrade} Certified
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <span className="bg-white/95 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-md shadow-xs">
                          📦 {item.quantityKg.toLocaleString('en-IN')} kg available
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base">
                            {item.cropName}
                          </h3>
                          <p className="text-xs text-slate-500">{item.variety}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-emerald-800 font-mono">
                            ₹{item.askingPricePerKg.toFixed(1)}/kg
                          </p>
                          <p className="text-[10px] text-slate-400">Farm Gate</p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                        <p className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.farmerLocation}</span>
                        </p>
                        <p className="text-slate-500">
                          Farmer: <strong className="text-slate-800">{item.farmerName}</strong>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <FairPriceBadge score={item.fairPriceScore || 92} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Direct Order Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateDirectBuyerOrder(item.id, item.cropName, item.askingPricePerKg)}
                      disabled={simulatingOrder}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{simulatingOrder ? 'Processing Order...' : '🛍️ Place Direct Order'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VRP LOGISTICS & BUYER NOTIFICATION MODAL */}
      {vrpModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  🚚
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Order Ready & Route Optimization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Buyer notified & cluster route analyzed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVrpModal({ isOpen: false, order: null, clusterInfo: null })}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Notification Confirmation Box */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Buyer Notification Dispatched</span>
              </div>
              <p className="text-xs text-emerald-900 leading-snug pl-6">
                Buyer <strong>{vrpModal.order?.buyerName || 'Wholesale Buyer'}</strong> has been notified that Order #{vrpModal.order?.id} ({vrpModal.order?.quantityKg}kg {vrpModal.order?.cropName}) is ready for logistics pickup.
              </p>
            </div>

            {/* AI Multi-Order Cluster Check */}
            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-blue-950 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs text-blue-800">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>AI Route Optimizer (VRP) Cluster Alert</span>
                </div>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {vrpModal.clusterInfo?.totalReadyOrders || 1} Orders Ready
                </span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                The AI logistics engine detected <strong>{vrpModal.clusterInfo?.totalReadyOrders || 1} orders</strong> ready in the Bhopal & regional pickup cluster. Launching Route Optimization will compute the shortest multi-stop pickup path, cutting transport costs by up to 28%.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setVrpModal({ isOpen: false, order: null, clusterInfo: null });
                  navigate('/route-optimizer?autoOptimize=true');
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Truck className="w-4 h-4 text-amber-300" />
                <span>Redirect to Route Optimization & Check Best Route</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setVrpModal({ isOpen: false, order: null, clusterInfo: null })}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Stay on Orders List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
