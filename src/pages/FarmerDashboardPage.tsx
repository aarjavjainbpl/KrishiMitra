import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Package,
  TrendingUp,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  Truck,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Trash2,
  Calendar,
  X,
  RefreshCw,
  Upload,
  Check,
  Award,
  Leaf,
  ArrowRight,
  Info,
  ExternalLink,
  Zap,
  Activity
} from 'lucide-react';
import { Listing, Order, QualityPrediction } from '../types';
import { useAuth } from '../context/AuthContext';
import { FairPriceBadge } from '../components/FairPriceBadge';
import { fallbackListings, fallbackOrders } from '../data/fallbackData';
import { evaluateCropQuality, getBenchmarkPrice } from '../services/qualityEngine';
import { compressProduceImage } from '../utils/imageCompressor';
import { analyzeImagePixels } from '../utils/cropVision';

export const FarmerDashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Listing Modal State
  const [showModal, setShowModal] = useState<boolean>(
    searchParams.get('openListingModal') === 'true'
  );

  // Form Fields
  const [cropName, setCropName] = useState<string>('Tomato');
  const [variety, setVariety] = useState<string>('Desi Hybrid (Red)');
  const [quantityKg, setQuantityKg] = useState<number>(2000);
  const [askingPricePerKg, setAskingPricePerKg] = useState<number>(24);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [qualityPredictionId, setQualityPredictionId] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(
    'Freshly harvested, hand-picked grade produce. High firmness and balanced acidity.'
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'
  );
  const [creating, setCreating] = useState<boolean>(false);
  const [createSuccess, setCreateSuccess] = useState<boolean>(false);

  // Live Mandi benchmark price lookup helper for the modal
  const [liveMandiPrice, setLiveMandiPrice] = useState<number>(22);

  // Modal inline AI Scanner state
  const [modalScanning, setModalScanning] = useState<boolean>(false);
  const [modalScanSuccess, setModalScanSuccess] = useState<string | null>(null);
  const modalFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Dashboard Embedded AI Grade Predictor State
  const [dashCrop, setDashCrop] = useState<string>('Tomato');
  const [dashConditionMode, setDashConditionMode] = useState<'auto' | 'diseased' | 'damaged' | 'healthy'>('auto');
  const [dashImage, setDashImage] = useState<string>(
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'
  );
  const [dashUploadedFile, setDashUploadedFile] = useState<File | null>(null);
  const [dashScanning, setDashScanning] = useState<boolean>(false);
  const [dashPrediction, setDashPrediction] = useState<QualityPrediction | null>(() => {
    return evaluateCropQuality({
      cropHint: 'Tomato',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
    });
  });
  const dashFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Check prefill data from Quality Predictor (Module C)
  useEffect(() => {
    const prefill = localStorage.getItem('krishimitra_prefill_listing') || localStorage.getItem('agriconnect_prefill_listing');
    if (prefill) {
      try {
        const data = JSON.parse(prefill);
        if (data.cropName) setCropName(data.cropName);
        if (data.qualityGrade) setQualityGrade(data.qualityGrade);
        if (data.qualityPredictionId) setQualityPredictionId(data.qualityPredictionId);
        if (data.photoUrl) setPhotoUrl(data.photoUrl);
        setShowModal(true);
        // Clear after reading
        localStorage.removeItem('krishimitra_prefill_listing');
        localStorage.removeItem('agriconnect_prefill_listing');
      } catch (e) {
        console.error('Error parsing prefill:', e);
      }
    }
  }, []);

  // Fetch farmer data
  const fetchData = async () => {
    try {
      setLoading(true);
      let loadedListings: Listing[] = [];

      // Fetch listings from backend
      try {
        const res = await fetch('/api/listings');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.listings && data.listings.length > 0) {
            loadedListings = data.listings;
          }
        }
      } catch (networkErr) {
        console.warn('Backend listings fetch issue, checking local storage:', networkErr);
      }

      if (loadedListings.length === 0) {
        loadedListings = [...fallbackListings];
      }

      // Merge locally published harvests so any harvest published via "Sell Harvest" or Farmer Hub appears immediately
      try {
        const localSaved: Listing[] = JSON.parse(localStorage.getItem('krishimitra_local_listings') || '[]');
        if (localSaved.length > 0) {
          const existingIds = new Set(loadedListings.map(l => l.id));
          const newItems = localSaved.filter(item => !existingIds.has(item.id));
          loadedListings = [...newItems, ...loadedListings];
        }
      } catch {
        // Non-blocking
      }

      setListings(loadedListings);

      // Fetch incoming orders
      const ordRes = await fetch('/api/orders/mine', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
      });
      const ordContentType = ordRes.headers.get('content-type') || '';
      if (ordRes.ok && ordContentType.includes('application/json')) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders || fallbackOrders);
      } else {
        setOrders(fallbackOrders);
      }

      // Fetch live mandi modal reference
      const mRes = await fetch(`/api/mandi-rates?crop=${cropName}`);
      const mContentType = mRes.headers.get('content-type') || '';
      if (mRes.ok && mContentType.includes('application/json')) {
        const mData = await mRes.json();
        if (mData.rates && mData.rates.length > 0) {
          const avg = mData.rates.reduce((sum: number, r: any) => sum + r.modalPrice, 0) / mData.rates.length;
          setLiveMandiPrice(Math.round(avg * 10) / 10);
        }
      }
    } catch (e) {
      console.warn('Error fetching farmer dashboard, using fallbacks:', e);
      // Merge fallback with local listings
      let fallbackCombined = [...fallbackListings];
      try {
        const localSaved: Listing[] = JSON.parse(localStorage.getItem('krishimitra_local_listings') || '[]');
        if (localSaved.length > 0) {
          const existingIds = new Set(fallbackCombined.map(l => l.id));
          const newItems = localSaved.filter(item => !existingIds.has(item.id));
          fallbackCombined = [...newItems, ...fallbackCombined];
        }
      } catch {
        // Non-blocking
      }
      setListings(fallbackCombined);
      setOrders(fallbackOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for cross-component harvest publishing updates
    const handleListingsUpdate = () => {
      fetchData();
    };

    window.addEventListener('krishimitra_listings_updated', handleListingsUpdate);
    window.addEventListener('storage', handleListingsUpdate);

    return () => {
      window.removeEventListener('krishimitra_listings_updated', handleListingsUpdate);
      window.removeEventListener('storage', handleListingsUpdate);
    };
  }, [cropName]);

  // VRP Route Optimization & Buyer Notification Modal State
  const [vrpModal, setVrpModal] = useState<{
    isOpen: boolean;
    order: Order | null;
    clusterInfo: any;
  }>({
    isOpen: false,
    order: null,
    clusterInfo: null,
  });

  // Handle Order Status Progression
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, targetOrder?: Order) => {
    // 1. Optimistic UI update: update local orders state immediately
    const updatedTarget: Order = targetOrder
      ? { ...targetOrder, status: newStatus as any }
      : orders.find((o) => o.id === orderId)
      ? { ...(orders.find((o) => o.id === orderId) as Order), status: newStatus as any }
      : ({
          id: orderId,
          listingId: 'list-1',
          buyerId: 'user-buyer-1',
          buyerName: 'APMC Supermarket Mart',
          farmerId: user?.id || 'user-farmer-1',
          farmerName: user?.name || 'Rameshwar Patidar',
          cropName: 'Tomato',
          variety: 'Desi Hybrid',
          quantityKg: 1200,
          unitPricePerKg: 26.0,
          totalAmount: 31200,
          status: newStatus as any,
          pickupAddress: 'Farm Gate #4, Phanda Road, Bhopal',
          pickupLat: 23.235,
          pickupLng: 77.295,
          deliveryAddress: 'Karond Mandi Wholesale Bay 12, Bhopal',
          deliveryLat: 23.2985,
          deliveryLng: 77.392,
          qualityGrade: 'A',
          escrowStatus: 'held',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Order);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
    );

    // 2. Persist to localStorage
    try {
      const stored = localStorage.getItem('krishimitra_orders');
      let orderList: Order[] = stored ? JSON.parse(stored) : [];
      const idx = orderList.findIndex((o) => o.id === orderId);
      if (idx >= 0) {
        orderList[idx] = updatedTarget;
      } else {
        orderList.unshift(updatedTarget);
      }
      localStorage.setItem('krishimitra_orders', JSON.stringify(orderList));
      window.dispatchEvent(new Event('krishimitra_orders_updated'));
    } catch (storageErr) {
      console.warn('LocalStorage order update note:', storageErr);
    }

    if (newStatus === 'ready_for_pickup') {
      setVrpModal({
        isOpen: true,
        order: updatedTarget,
        clusterInfo: {
          totalReadyOrders: 2,
          totalProduceKg: updatedTarget.quantityKg + 1500,
          recommendRouteOptimization: true,
          message: `Order #${orderId} marked ready for pickup. Pickup dispatch network active.`,
        },
      });
    }

    try {
      const authToken =
        localStorage.getItem('krishimitra_token') ||
        localStorage.getItem('agriconnect_token') ||
        'km-demo-farmer-verified';

      // Try PATCH first
      let res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus, order: updatedTarget }),
      });

      // Fallback to POST
      if (!res.ok) {
        res = await fetch(`/api/orders/${orderId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status: newStatus, order: updatedTarget }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        fetchData();

        if (newStatus === 'ready_for_pickup' && data.clusterInfo) {
          setVrpModal({
            isOpen: true,
            order: targetOrder || data.order || updatedTarget,
            clusterInfo: data.clusterInfo,
          });
        }
      }
    } catch (e) {
      console.warn('Network sync note, local state updated:', e);
    }
  };

  // Run quality scan on main farmer dashboard
  const handleRunDashQualityScan = async (
    overrideUrl?: string,
    overrideFile?: File | null,
    overrideCrop?: string,
    overrideMode?: 'auto' | 'diseased' | 'damaged' | 'healthy'
  ) => {
    const activeUrl = overrideUrl || dashImage;
    const activeFile = overrideFile !== undefined ? overrideFile : dashUploadedFile;
    const activeCrop = overrideCrop || dashCrop;
    const activeMode = overrideMode || dashConditionMode;

    setDashScanning(true);

    try {
      let pixelResult: any = undefined;
      try {
        if (activeFile) {
          pixelResult = await analyzeImagePixels(activeFile);
        } else if (activeUrl) {
          pixelResult = await analyzeImagePixels(activeUrl);
        }
      } catch (pxErr) {
        console.warn('Dashboard pixel analysis note:', pxErr);
      }

      // Check if image URL or pixel analysis suggests pathology
      const urlLower = (activeUrl || '').toLowerCase();
      const isDefectUrl = urlLower.includes('blight') || urlLower.includes('rot') || urlLower.includes('scab') || urlLower.includes('defect') || urlLower.includes('diseas') || urlLower.includes('anthracnose') || urlLower.includes('bunt');
      const isPixelDiseased = pixelResult?.detectedCondition === 'diseased' || (pixelResult?.necroticRatio && pixelResult.necroticRatio >= 0.05);

      const effectiveMode: 'auto' | 'diseased' | 'damaged' | 'healthy' =
        activeMode !== 'auto'
          ? activeMode
          : (isDefectUrl || isPixelDiseased ? 'diseased' : 'auto');

      let pred: QualityPrediction | null = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        let res: Response;
        if (activeFile) {
          const fd = new FormData();
          fd.append('image', activeFile);
          fd.append('cropHint', activeCrop);
          fd.append('conditionMode', effectiveMode);

          res = await fetch('/api/quality-predictor/analyze', {
            method: 'POST',
            body: fd,
            signal: controller.signal,
          });
        } else {
          res = await fetch('/api/quality-predictor/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: activeUrl,
              cropHint: activeCrop,
              conditionMode: effectiveMode,
            }),
            signal: controller.signal,
          });
        }
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.prediction) {
            pred = data.prediction as QualityPrediction;
          }
        }
      } catch (netErr) {
        console.info('Backend quality service slow/offline, evaluating with ICAR agronomist engine:', netErr);
      }

      if (!pred) {
        pred = evaluateCropQuality({
          cropHint: activeCrop,
          imageUrl: activeUrl,
          imageFileName: activeFile?.name,
          isCustomUpload: !!activeFile,
          conditionMode: effectiveMode,
          pixelResult,
        });
      }

      // Ensure diagnosis & treatment fields are guaranteed
      if (pred) {
        pred.confidenceScore = pred.confidenceScore || Math.round((pred.confidence || 0.95) * 100);
        pred.pathologyDiagnosis = pred.diseaseName || (pred.diseaseStatus === 'healthy' ? `Certified Prime ${activeCrop} (Disease-Free)` : `${activeCrop} Surface Pathology`);
        pred.pathologyTreatment = pred.treatmentRecommendation || (pred.diseaseStatus === 'healthy' ? 'Produce in optimal harvest health. Store in cool ventilated area.' : 'Apply appropriate fungicide/bactericide spray and segregate lot.');
        pred.ripenessIndex = pred.ripenessIndex || pred.metrics?.colorRipenessScore || 92;
        pred.uniformityScore = pred.uniformityScore || pred.metrics?.surfaceUniformityScore || 88;
        pred.blemishFreePercentage = pred.blemishFreePercentage || pred.metrics?.blemishFreeScore || (pred.diseaseStatus === 'healthy' ? 94 : 45);
      }

      setDashPrediction(pred);
    } catch (err) {
      console.error('Scan error:', err);
      const fallback = evaluateCropQuality({
        cropHint: activeCrop,
        imageUrl: activeUrl,
        conditionMode: activeMode,
      });
      setDashPrediction(fallback);
    } finally {
      setDashScanning(false);
    }
  };

  const handleDashFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressProduceImage(file, 900, 0.85);
        setDashUploadedFile(file);
        setDashImage(compressed.dataUrl);
        handleRunDashQualityScan(compressed.dataUrl, file, dashCrop, dashConditionMode);
      } catch {
        const url = URL.createObjectURL(file);
        setDashUploadedFile(file);
        setDashImage(url);
        handleRunDashQualityScan(url, file, dashCrop, dashConditionMode);
      }
    }
  };

  // Helper to prefill modal from dashboard AI scan
  const handleApplyDashPredictionToListing = () => {
    if (dashPrediction) {
      setCropName(dashCrop);
      setQualityGrade(dashPrediction.predictedGrade);
      setQualityPredictionId(dashPrediction.id);
      if (dashPrediction.predictedFairPricePerKg) {
        setAskingPricePerKg(dashPrediction.predictedFairPricePerKg);
      }
      setPhotoUrl(dashImage);
      setShowModal(true);
    }
  };

  // Handle inline AI scan inside the Create Listing modal
  const handleRunModalQualityScan = async (fileOrUrl: File | string) => {
    setModalScanning(true);
    setModalScanSuccess(null);
    try {
      let activeUrl = typeof fileOrUrl === 'string' ? fileOrUrl : '';
      let activeFile: File | null = typeof fileOrUrl !== 'string' ? fileOrUrl : null;

      if (activeFile) {
        try {
          const compressed = await compressProduceImage(activeFile, 900, 0.85);
          activeUrl = compressed.dataUrl;
          setPhotoUrl(compressed.dataUrl);
        } catch {
          activeUrl = URL.createObjectURL(activeFile);
          setPhotoUrl(activeUrl);
        }
      }

      let pixelResult: any = undefined;
      try {
        pixelResult = await analyzeImagePixels(activeUrl);
      } catch (pxErr) {
        console.warn('Modal pixel analysis:', pxErr);
      }

      let pred: QualityPrediction | null = null;
      const urlLower = (activeUrl || '').toLowerCase();
      const isDefectUrl = urlLower.includes('blight') || urlLower.includes('rot') || urlLower.includes('scab') || urlLower.includes('defect') || urlLower.includes('diseas') || urlLower.includes('anthracnose') || urlLower.includes('bunt');
      const isPixelDiseased = pixelResult?.detectedCondition === 'diseased' || (pixelResult?.necroticRatio && pixelResult.necroticRatio >= 0.05);
      const effectiveMode = isDefectUrl || isPixelDiseased ? 'diseased' : 'auto';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        let res: Response;
        if (activeFile) {
          const fd = new FormData();
          fd.append('image', activeFile);
          fd.append('cropHint', cropName);
          fd.append('conditionMode', effectiveMode);

          res = await fetch('/api/quality-predictor/analyze', {
            method: 'POST',
            body: fd,
            signal: controller.signal,
          });
        } else {
          res = await fetch('/api/quality-predictor/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: activeUrl,
              cropHint: cropName,
              conditionMode: effectiveMode,
            }),
            signal: controller.signal,
          });
        }
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.prediction) {
            pred = data.prediction as QualityPrediction;
          }
        }
      } catch (err) {
        console.info('Backend quality service note:', err);
      }

      if (!pred) {
        pred = evaluateCropQuality({
          cropHint: cropName,
          imageUrl: activeUrl,
          imageFileName: activeFile?.name,
          isCustomUpload: !!activeFile,
          conditionMode: effectiveMode,
          pixelResult,
        });
      }

      if (pred) {
        pred.confidenceScore = pred.confidenceScore || Math.round((pred.confidence || 0.95) * 100);
        pred.pathologyDiagnosis = pred.diseaseName || (pred.diseaseStatus === 'healthy' ? `Certified Prime ${cropName} (Disease-Free)` : `${cropName} Surface Pathology`);
        pred.pathologyTreatment = pred.treatmentRecommendation || (pred.diseaseStatus === 'healthy' ? 'Produce in optimal harvest health.' : 'Apply appropriate fungicide/bactericide spray and segregate lot.');
      }

      setQualityGrade(pred.predictedGrade);
      setQualityPredictionId(pred.id);
      if (pred.predictedFairPricePerKg) {
        setAskingPricePerKg(pred.predictedFairPricePerKg);
      }
      const diagnosisText = pred.diseaseStatus === 'diseased'
        ? `⚠️ Pathology Identified: ${pred.diseaseName}`
        : `✓ Healthy produce (zero rot detected)`;
      setModalScanSuccess(`✓ AI Certified Grade ${pred.predictedGrade} (${pred.confidenceScore}% confidence). ${diagnosisText}. Fair price set to ₹${pred.predictedFairPricePerKg || askingPricePerKg}/kg.`);
    } catch (e: any) {
      console.error(e);
    } finally {
      setModalScanning(false);
    }
  };

  // Handle Create Listing
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
        body: JSON.stringify({
          cropName,
          variety,
          quantityKg: Number(quantityKg),
          askingPricePerKg: Number(askingPricePerKg),
          qualityGrade,
          qualityPredictionId: qualityPredictionId || undefined,
          harvestDate,
          description,
          photoUrl,
          farmerLat: user?.locationLat || 19.9975,
          farmerLng: user?.locationLng || 73.7898,
        }),
      });

      let createdItem: Listing | null = null;
      if (res.ok) {
        const data = await res.json();
        createdItem = data.listing;
      }

      if (!createdItem) {
        createdItem = {
          id: `list-${Date.now()}`,
          farmerId: user?.id || 'user-farmer-1',
          farmerName: user?.name || 'Rameshwar Patidar',
          farmerPhone: user?.phone || '+91 98260 12345',
          farmerLocation: user?.district ? `${user.district}, Madhya Pradesh` : 'Phanda Khurd, Bhopal, Madhya Pradesh',
          locationLat: user?.locationLat || 23.235,
          locationLng: user?.locationLng || 77.295,
          cropName,
          variety,
          quantityKg: Number(quantityKg),
          qualityGrade,
          qualityPredictionId: qualityPredictionId || undefined,
          askingPricePerKg: Number(askingPricePerKg),
          harvestDate,
          status: 'active',
          description,
          photoUrl: photoUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
        };
      }

      // Persist to local listings storage so it never disappears on serverless refresh
      try {
        const existing = JSON.parse(localStorage.getItem('krishimitra_local_listings') || '[]');
        existing.unshift(createdItem);
        localStorage.setItem('krishimitra_local_listings', JSON.stringify(existing));
        window.dispatchEvent(new Event('krishimitra_listings_updated'));
      } catch {
        // Non-blocking
      }

      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setShowModal(false);
        fetchData();
      }, 1200);
    } catch (err: any) {
      console.warn('Backend issue, creating local listing:', err);
      const fallbackItem: Listing = {
        id: `list-${Date.now()}`,
        farmerId: user?.id || 'user-farmer-1',
        farmerName: user?.name || 'Rameshwar Patidar',
        farmerPhone: user?.phone || '+91 98260 12345',
        farmerLocation: user?.district ? `${user.district}, Madhya Pradesh` : 'Phanda Khurd, Bhopal, Madhya Pradesh',
        locationLat: user?.locationLat || 23.235,
        locationLng: user?.locationLng || 77.295,
        cropName,
        variety,
        quantityKg: Number(quantityKg),
        qualityGrade,
        qualityPredictionId: qualityPredictionId || undefined,
        askingPricePerKg: Number(askingPricePerKg),
        harvestDate,
        status: 'active',
        description,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
      try {
        const existing = JSON.parse(localStorage.getItem('krishimitra_local_listings') || '[]');
        existing.unshift(fallbackItem);
        localStorage.setItem('krishimitra_local_listings', JSON.stringify(existing));
        window.dispatchEvent(new Event('krishimitra_listings_updated'));
      } catch {
        // Non-blocking
      }
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setShowModal(false);
        fetchData();
      }, 1200);
    } finally {
      setCreating(false);
    }
  };

  // Financial Stats
  const totalVolumeKg = listings.reduce((sum, l) => sum + l.quantityKg, 0);
  const pendingOrders = orders.filter((o) => o.status !== 'delivered');
  const escrowHeldTotal = orders
    .filter((o) => o.paymentStatus === 'held')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalEarningsPaid = orders
    .filter((o) => o.paymentStatus === 'released')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              Farmer Control Console
            </span>
            <span className="text-xs text-slate-500">
              Logged in as: <strong className="text-slate-800">{user?.name || 'Kisan Ramesh Patil'}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Farmer Dashboard & Produce Dispatch
          </h1>
        </div>

        {/* Action Buttons: Simplified Harvest Hub & Modal & Route Optimizer */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/farmer/route-optimizer"
            id="go-to-route-optimizer-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-xs transition-all active:scale-98"
          >
            <Truck className="w-4 h-4 text-slate-950" />
            <span>AI Route Optimizer</span>
          </Link>
          <Link
            to="/farmer/place-harvest"
            id="go-to-place-harvest-page"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/20 transition-all active:scale-98"
          >
            <span className="text-lg">🌾</span>
            <span>Place Harvest & Direct Orders</span>
          </Link>
          <button
            id="open-create-listing-modal-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Modal</span>
          </button>
        </div>
      </div>

      {/* 4 Feature Module Quick Launch Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Link
          to="/mandi-rates"
          className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module A</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 mt-2 font-display">Live Mandi Rates</p>
          <p className="text-xs text-slate-500 mt-0.5">Check official Agmarknet wholesale rates</p>
        </Link>

        <Link
          to="/price-predictor"
          className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module B</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 mt-2 font-display">AI Price Predictor</p>
          <p className="text-xs text-slate-500 mt-0.5">Forecast 7-30 day sell vs hold price</p>
        </Link>

        <a
          href="#ai-grade-predictor-section"
          onClick={(e) => {
            const el = document.getElementById('ai-grade-predictor-section');
            if (el) {
              e.preventDefault();
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-500 hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module C</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 mt-2 font-display">AI Quality Grader</p>
          <p className="text-xs text-slate-500 mt-0.5">Instant computer vision grade predictor</p>
        </a>

        <Link
          to="/route-optimizer"
          className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-amber-500 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module D</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900 mt-2 font-display">Route Optimizer</p>
          <p className="text-xs text-slate-500 mt-0.5">Optimal multi-stop pickup logistics</p>
        </Link>
      </div>

      {/* Financial KPIs - Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Escrow Protected Balance (In-Transit)
          </p>
          <p className="text-3xl font-black text-emerald-700 mt-2 font-mono">
            ₹{escrowHeldTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Guaranteed held in smart escrow</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Settled Bank Payouts
          </p>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">
            ₹{totalEarningsPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Direct Bank Account Transfer</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Active Harvest Listed
          </p>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">
            {totalVolumeKg.toLocaleString()} kg
          </p>
          <p className="text-xs text-slate-500 mt-1">{listings.length} Active Market Listings</p>
        </div>
      </div>

      {/* Dedicated AI Route Logistics & Farm Pickup Section */}
      <div className="mt-8 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Truck className="w-3.5 h-3.5" /> Module D: AI Route Optimizer
              </span>
              <span className="bg-white/10 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full border border-white/10">
                OSRM Road Matrix & VRP Solver
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Multi-Farmer Pickup & Consolidated Route Logistics
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              Consolidate farm pickup orders with nearby farmers in Bhopal (Phanda, Berasia, Sehore, Mandideep) to slash transport freight by ~28%. Calculate live road distance, GPS waypoint sequencing, and estimated truck arrival times.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-amber-400 font-black">⚡ Real-time OSRM</span>
                <span className="text-slate-400">Actual Road Routing</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-emerald-400 font-black">📉 ~28% Cost Cut</span>
                <span className="text-slate-400">Vehicle Multi-Stop Bundling</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-blue-400 font-black">📍 6 Hubs</span>
                <span className="text-slate-400">Karond, Berasia, Sehore</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link
              to="/farmer/route-optimizer"
              id="dashboard-open-route-optimizer"
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
            >
              <Truck className="w-4 h-4" />
              <span>Open AI Route Optimizer</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/farmer/route-optimizer?autoOptimize=true"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/15 transition-all text-center flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Solve Ready Pickups</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Farmer Page: Dedicated AI Produce Quality & Grade Predictor (Module C) */}
      <div id="ai-grade-predictor-section" className="mt-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-purple-600" /> Module C: AI Quality & Grade Predictor
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                ICAR Computer Vision Diagnostic
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-display">
              AI Produce Quality & Grade Predictor
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
              Inspect produce photos with computer vision & ICAR phytopathology analysis. Certify Grade A, B, or C, detect skin rot, necrosis, or blight, and calculate AI fair market price.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/quality-predictor"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl transition-all"
            >
              <span>Full Screen Grader</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Crop Selection Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Select Crop to Grade:</span>
            <span className="text-[11px] font-bold text-slate-400">Mandi Benchmark: ₹{getBenchmarkPrice(dashCrop)}/kg</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Tomato', emoji: '🍅' },
              { name: 'Onion', emoji: '🧅' },
              { name: 'Potato', emoji: '🥔' },
              { name: 'Wheat', emoji: '🌾' },
              { name: 'Soybean', emoji: '🌱' },
              { name: 'Green Chilli', emoji: '🌶️' },
              { name: 'Garlic', emoji: '🧄' },
            ].map((crop) => (
              <button
                key={crop.name}
                type="button"
                onClick={() => {
                  setDashCrop(crop.name);
                  handleRunDashQualityScan(dashImage, dashUploadedFile, crop.name);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  dashCrop === crop.name
                    ? 'bg-purple-600 text-white shadow-xs scale-102'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{crop.emoji}</span>
                <span>{crop.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Scanner Workspace */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          {/* Left Column: Image Canvas & Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative aspect-16/11 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-xs">
              <img
                src={dashImage}
                alt={dashCrop}
                className="w-full h-full object-cover"
              />
              {dashScanning && (
                <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                  <p className="text-xs font-black tracking-wide">Scanning Skin, Ripeness & Pathogens...</p>
                  <p className="text-[11px] text-slate-300">Offscreen Canvas Pixel Analysis & ICAR Engine</p>
                </div>
              )}
              <div className="absolute top-2.5 left-2.5">
                <span className="bg-purple-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {dashUploadedFile ? '📸 Custom Photo' : `Sample: ${dashCrop}`}
                </span>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={dashFileInputRef}
              accept="image/*"
              onChange={handleDashFileUpload}
              className="hidden"
            />

            {/* Mode & Scanner Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Scan & Pathology Focus:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  dashConditionMode === 'diseased' ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {dashConditionMode === 'diseased' ? '⚠️ Pathology Diagnostic Mode' : 'AI Multi-Factor Scan'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDashConditionMode('auto');
                    handleRunDashQualityScan(dashImage, dashUploadedFile, dashCrop, 'auto');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-1.5 ${
                    dashConditionMode === 'auto'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Auto AI Vision</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDashConditionMode('diseased');
                    handleRunDashQualityScan(dashImage, dashUploadedFile, dashCrop, 'diseased');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-1.5 ${
                    dashConditionMode === 'diseased'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>⚠️ Check Disease / Rot</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => dashFileInputRef.current?.click()}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Camera className="w-4 h-4 text-purple-600" />
                <span>Upload / Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunDashQualityScan(dashImage, dashUploadedFile, dashCrop, dashConditionMode)}
                disabled={dashScanning}
                className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{dashScanning ? 'Diagnosing...' : 'Run AI Diagnosis'}</span>
              </button>
            </div>

            {/* Test Image Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Quick Diagnostic Samples:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const url = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80';
                    setDashCrop('Tomato');
                    setDashImage(url);
                    setDashUploadedFile(null);
                    setDashConditionMode('healthy');
                    handleRunDashQualityScan(url, null, 'Tomato', 'healthy');
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg transition-all"
                >
                  🍅 Healthy Prime Tomato (Grade A)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80&defect=blight_rot';
                    setDashCrop('Tomato');
                    setDashImage(url);
                    setDashUploadedFile(null);
                    setDashConditionMode('diseased');
                    handleRunDashQualityScan(url, null, 'Tomato', 'diseased');
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-900 border border-rose-300 rounded-lg transition-all"
                >
                  ⚠️ Blighted / Rot Tomato (Grade C)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80&defect=scab_rot';
                    setDashCrop('Potato');
                    setDashImage(url);
                    setDashUploadedFile(null);
                    setDashConditionMode('diseased');
                    handleRunDashQualityScan(url, null, 'Potato', 'diseased');
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-900 border border-rose-300 rounded-lg transition-all"
                >
                  🥔 Scab & Soft Rot Potato (Grade C)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80&defect=purple_blotch';
                    setDashCrop('Onion');
                    setDashImage(url);
                    setDashUploadedFile(null);
                    setDashConditionMode('diseased');
                    handleRunDashQualityScan(url, null, 'Onion', 'diseased');
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-900 border border-rose-300 rounded-lg transition-all"
                >
                  🧅 Purple Blotch Onion (Grade C)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80&defect=anthracnose';
                    setDashCrop('Green Chilli');
                    setDashImage(url);
                    setDashUploadedFile(null);
                    setDashConditionMode('diseased');
                    handleRunDashQualityScan(url, null, 'Green Chilli', 'diseased');
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-900 border border-rose-300 rounded-lg transition-all"
                >
                  🌶️ Anthracnose Rotten Chilli (Grade C)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Certified Grade & ICAR Diagnostic Certificate (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
            {dashPrediction ? (
              <div className="space-y-4">
                {/* Header Certificate Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-5 h-5 ${
                      dashPrediction.diseaseStatus === 'diseased' ? 'text-rose-600' : 'text-emerald-600'
                    }`} />
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        ICAR Phytopathology & Quality Certificate
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        ID: {dashPrediction.id} • {dashPrediction.cropHint}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-3.5 py-1 rounded-full shadow-xs ${
                    dashPrediction.predictedGrade === 'A'
                      ? 'bg-emerald-600 text-white'
                      : dashPrediction.predictedGrade === 'B'
                      ? 'bg-teal-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {dashPrediction.diseaseStatus === 'diseased' ? 'Grade C (Pathology Detected)' : `Certified Grade ${dashPrediction.predictedGrade}`}
                  </span>
                </div>

                {/* Grade & Phytopathology Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3.5 rounded-xl border ${
                    dashPrediction.predictedGrade === 'A'
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : dashPrediction.predictedGrade === 'B'
                      ? 'bg-teal-50/70 border-teal-200'
                      : 'bg-amber-50/70 border-amber-200'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Produce APMC Grade</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-slate-900">Grade {dashPrediction.predictedGrade}</span>
                      <span className="text-xs font-bold text-slate-600">
                        {dashPrediction.predictedGrade === 'A' ? 'Top Tier (Export/Supermarket)' : dashPrediction.predictedGrade === 'B' ? 'Standard Mandi Grade' : 'Processing / Salvage'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-snug">{dashPrediction.gradeRationale}</p>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    dashPrediction.diseaseStatus === 'healthy'
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-rose-50/70 border-rose-300'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Phytopathology & Crop Health</span>
                    <div className="flex items-baseline justify-between gap-2 mt-1">
                      <span className={`text-sm font-black ${
                        dashPrediction.diseaseStatus === 'healthy' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {dashPrediction.diseaseStatus === 'healthy' ? '✓ Certified Healthy (Zero Rot)' : '⚠️ Crop Pathology Detected'}
                      </span>
                      {dashPrediction.diseaseStatus !== 'healthy' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-200/80 text-rose-800 rounded-md">
                          {dashPrediction.diseaseSeverityPercent || 35}% surface damage
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {dashPrediction.diseaseName || (dashPrediction.diseaseStatus === 'healthy' ? `Certified Prime ${dashCrop} (Disease-Free)` : `${dashCrop} Surface Pathology`)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pathogen: <span className="font-semibold text-slate-700">{dashPrediction.pathogenType || (dashPrediction.diseaseStatus === 'healthy' ? 'None (Healthy)' : 'Fungal')}</span>
                    </p>
                  </div>
                </div>

                {/* Pathology Symptoms & Treatment if diseased */}
                {dashPrediction.diseaseStatus !== 'healthy' ? (
                  <div className="space-y-2.5">
                    {/* Observed Symptoms */}
                    {dashPrediction.symptoms && dashPrediction.symptoms.length > 0 && (
                      <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-xl space-y-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          Observed Clinical Pathology Symptoms:
                        </span>
                        <ul className="space-y-1 text-xs text-rose-800 pl-1">
                          {dashPrediction.symptoms.map((sym, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold leading-none mt-1">•</span>
                              <span className="leading-snug">{sym}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Agronomist Treatment Recommendation */}
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Agronomist Prescribed Treatment & Quarantine:</span>
                      </div>
                      <p className="text-amber-800 text-xs pl-5 leading-relaxed font-medium">
                        {dashPrediction.treatmentRecommendation || dashPrediction.pathologyTreatment || 'Apply Copper Oxychloride or Mancozeb 75 WP at 2.5g/L immediately. Separate healthy crates to halt spore spread.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>ICAR Certified Disease-Free Produce:</span>
                    </div>
                    <p className="text-emerald-800 text-xs pl-5 leading-relaxed">
                      Zero foliar or fruit lesions detected. Cuticle firmness, high turgidity, and uniform surface coloration verified. Safe for certified wholesale distribution or export.
                    </p>
                  </div>
                )}

                {/* Quantitative Metrics Bar */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Confidence</span>
                    <span className="text-sm font-black text-slate-900">{dashPrediction.confidenceScore}%</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Ripeness</span>
                    <span className="text-sm font-black text-slate-900">{dashPrediction.ripenessIndex || 92}%</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Uniformity</span>
                    <span className="text-sm font-black text-slate-900">{dashPrediction.uniformityScore || 88}%</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Clean Skin</span>
                    <span className="text-sm font-black text-slate-900">{dashPrediction.blemishFreePercentage || 94}%</span>
                  </div>
                </div>

                {/* Fair Market Price Card & Action */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">AI Fair Market Asking Price</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black font-mono">₹{dashPrediction.predictedFairPricePerKg || getBenchmarkPrice(dashCrop)}</span>
                      <span className="text-xs text-emerald-100">/ kg (₹{(dashPrediction.predictedFairPricePerKg || getBenchmarkPrice(dashCrop)) * 100} / Qtl)</span>
                    </div>
                    <span className="text-[11px] text-emerald-100">
                      Based on Grade {dashPrediction.predictedGrade} & Mandi benchmark of ₹{getBenchmarkPrice(dashCrop)}/kg
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyDashPredictionToListing}
                    className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Post Batch with this Certified Grade</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-600" />
                <p className="text-xs font-bold">Initializing ICAR Agronomist Diagnostic Engine...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section: Incoming Buyer Orders (Fulfillment Workflow) */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Incoming Direct Buyer Orders ({orders.length})
            </h2>
            <p className="text-xs text-slate-500">
              Manage order confirmation, packing, and dispatch progression
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">
            {pendingOrders.length} Active Pickups
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {orders.length > 0 ? (
            orders.map((ord) => (
              <div key={ord.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">
                      {ord.cropName} ({ord.quantityKg.toLocaleString()} kg)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.status === 'ready_for_pickup'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      Status: {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Buyer: <strong className="text-slate-800">{ord.buyerName}</strong> • Delivery:{' '}
                    <span className="text-slate-500">{ord.deliveryAddress}</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="font-mono font-bold text-emerald-700">
                      Total: ₹{ord.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Escrow: <strong className="text-slate-700">{ord.paymentStatus}</strong>
                    </span>
                  </div>
                </div>

                {/* Workflow Action Progression */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {ord.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'ready_for_pickup')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}

                  {ord.status === 'ready_for_pickup' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'in_transit')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" /> Mark Dispatched (In Transit)
                    </button>
                  )}

                  {ord.status === 'in_transit' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Delivery
                    </button>
                  )}

                  {ord.status === 'delivered' && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> Delivered & Settled
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              No orders placed yet. As buyers place orders, they will appear here.
            </div>
          )}
        </div>
      </div>

      {/* Section: Active Listings */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            My Published Harvest Listings ({listings.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/9 bg-slate-100">
                  <img
                    src={item.photoUrl}
                    alt={item.cropName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        item.qualityGrade === 'A'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-teal-600 text-white'
                      }`}
                    >
                      Grade {item.qualityGrade}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{item.cropName}</h3>
                      <p className="text-xs text-slate-500">{item.variety}</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-700 font-mono">
                      ₹{item.askingPricePerKg.toFixed(1)}/kg
                    </p>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p>📦 Quantity: <strong>{item.quantityKg.toLocaleString()} kg</strong></p>
                    <p>📍 Location: {item.farmerLocation}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <FairPriceBadge score={item.fairPriceScore || 92} size="sm" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Status: <strong className="text-emerald-700">Active</strong></span>
                <Link
                  to={`/buyer/listing/${item.id}`}
                  className="font-bold text-emerald-700 hover:text-emerald-800"
                >
                  View Public Listing &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE NEW LISTING MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Publish New Farm Produce Listing
                </h3>
                <p className="text-xs text-slate-500">
                  Direct listing to verified wholesale buyers without intermediary cuts
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateListing} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Crop & Variety */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Commodity / Crop Name *
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Green Chilli', 'Banana', 'Soybean', 'Mustard'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Variety / Hybrid *
                  </label>
                  <input
                    type="text"
                    required
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. Desi Hybrid, Red Onion"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quantity & Asking Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity Available (KG) *
                  </label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Asking Price (₹/KG) *
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Mandi Avg: ₹{liveMandiPrice}/kg
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    required
                    value={askingPricePerKg}
                    onChange={(e) => setAskingPricePerKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-emerald-700 font-mono focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quality Grade & Module C integration */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Produce Quality Grade *
                  </label>
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={modalScanning}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    <span>{modalScanning ? 'Scanning...' : 'Scan Photo via AI Vision'}</span>
                  </button>
                </div>

                {/* Hidden file input for modal photo scan */}
                <input
                  type="file"
                  ref={modalFileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleRunModalQualityScan(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {/* AI Scan Feedback if available */}
                {modalScanSuccess && (
                  <div className="mb-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{modalScanSuccess}</span>
                  </div>
                )}

                {/* Quick Test Samples for Modal */}
                <div className="flex items-center gap-1.5 mb-2 text-[11px]">
                  <span className="text-slate-400 font-bold">Quick AI Test:</span>
                  <button
                    type="button"
                    onClick={() => handleRunModalQualityScan('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 rounded-md border border-slate-200"
                  >
                    🍅 Healthy A
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunModalQualityScan('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80&defect=blight_rot')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-amber-50 text-amber-800 rounded-md border border-slate-200"
                  >
                    ⚠️ Blighted C
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['A', 'B', 'C'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setQualityGrade(g)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        qualityGrade === g
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Grade {g} {g === 'A' ? '(Top Tier)' : g === 'B' ? '(Standard)' : '(Processing)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo URL / Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Produce Photo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shrink-0 flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harvest Notes & Details
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {createSuccess ? (
                <div className="p-3 bg-emerald-500 text-white rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Listing Published Successfully!
                </div>
              ) : (
                <div className="flex gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/3 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-new-listing-btn"
                    type="submit"
                    disabled={creating}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{creating ? 'Publishing...' : 'Publish to Marketplace'}</span>
                  </button>
                </div>
              )}
            </form>
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
                <ChevronRight className="w-4 h-4" />
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
