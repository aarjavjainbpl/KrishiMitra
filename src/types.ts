export type UserRole = 'farmer' | 'buyer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  passwordHash: string;
  locationLat: number;
  locationLng: number;
  state: string;
  district: string;
  createdAt: string;
}

export interface Listing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerLocation: string;
  locationLat: number;
  locationLng: number;
  cropName: string;
  variety: string;
  quantityKg: number;
  qualityGrade: 'A' | 'B' | 'C';
  qualityPredictionId?: string;
  askingPricePerKg: number;
  harvestDate: string;
  status: 'active' | 'reserved' | 'sold';
  description?: string;
  photoUrl: string;
  createdAt: string;
}

export interface MandiPriceRecord {
  id: string;
  cropName: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  minPrice: number; // in ₹/kg or ₹/quintal
  maxPrice: number;
  modalPrice: number;
  date: string;
  source: 'agmarknet' | 'enam' | 'seed_fallback';
  syncedAt: string;
}

export interface PricePredictionPoint {
  date: string;
  predictedPrice: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface PricePredictionResponse {
  crop: string;
  region: string;
  horizonDays: number;
  currentModalPrice: number;
  forecastChangePercent: number;
  recommendation: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  forecastSeries: PricePredictionPoint[];
  historicalSeries: { date: string; price: number }[];
  modelDetails: {
    algorithm: string;
    historicalDataPoints: number;
    seasonalityPattern: string;
  };
}

export interface QualityPrediction {
  id: string;
  imageUrl: string;
  cropHint: string;
  predictedGrade: 'A' | 'B' | 'C';
  confidence: number;
  diseaseStatus: 'healthy' | 'diseased' | 'damaged';
  diseaseName: string;
  diseaseSeverityPercent: number; // 0% for healthy, 1-100% for diseased
  pathogenType: 'None (Healthy)' | 'Fungal' | 'Bacterial' | 'Viral' | 'Pest / Insect' | 'Physiological Deficiency';
  symptoms: string[];
  treatmentRecommendation?: string;
  defectNotes: string[];
  suggestedPriceAdjustmentPercent: number;
  // Image-Graded Right Price Prediction Fields
  mandiModalPrice: number; // Current APMC Mandi Modal benchmark (₹/kg)
  predictedFairPricePerKg: number; // Exact AI-Graded Right Price (₹/kg)
  predictedPricePerQuintal: number; // ₹/Quintal (100 kg)
  priceRationale: string; // Plain-English economic justification
  recommendedPriceRange: {
    min: number;
    max: number;
  };
  metrics: {
    colorRipenessScore: number;
    surfaceUniformityScore: number;
    blemishFreeScore: number;
    freshnessIndex: number;
  };
  createdAt: string;
}

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  farmerId: string;
  farmerName: string;
  cropName: string;
  quantityKg: number;
  agreedPricePerKg: number;
  totalAmount: number;
  fairPriceScore: number;
  fairPriceBreakdown: {
    askingPrice: number;
    mandiModalPrice: number;
    qualityGrade: 'A' | 'B' | 'C';
    qualityBonus: number;
    priceRatio: number;
    intermediarySavingsPerKg: number;
  };
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryAddress: string;
  status: 'pending' | 'confirmed' | 'ready_for_pickup' | 'in_transit' | 'delivered' | 'cancelled';
  paymentStatus?: 'held' | 'released' | 'refunded';
  deliveredAt?: string;
  settlementRemarks?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_ready' | 'order_dispatched' | 'order_delivered' | 'payment_held' | 'payment_released' | 'new_order';
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface RouteStop {
  id: string;
  routeId: string;
  orderId: string;
  sequenceNumber: number;
  etaMinutes: number;
  distanceFromPreviousKm: number;
  stopLat: number;
  stopLng: number;
  farmerName: string;
  cropName: string;
  quantityKg: number;
  address: string;
}

export interface OptimizedRoute {
  id: string;
  depotLat: number;
  depotLng: number;
  depotName: string;
  totalDistanceKm: number;
  totalDurationMin: number;
  vehicleCount: number;
  stopsCount: number;
  totalProduceKg: number;
  distanceSavedKm: number;
  carbonSavedKg: number;
  geometry: [number, number][]; // lat, lng polyline
  stops: RouteStop[];
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  buyerId: string;
  farmerId: string;
  amount: number;
  status: 'held' | 'released' | 'refunded';
  escrowHeldAt?: string;
  releasedAt?: string;
  transactionRef?: string;
  settlementMethod?: string;
  settledByRole?: 'buyer' | 'farmer';
  deliveryRemarks?: string;
  createdAt: string;
}
