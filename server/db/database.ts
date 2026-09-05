import fs from 'fs';
import path from 'path';
import {
  User,
  Listing,
  MandiPriceRecord,
  QualityPrediction,
  Order,
  OptimizedRoute,
  Payment,
  AppNotification
} from '../../src/types';
import bcrypt from 'bcryptjs';

const DATA_FILE = path.join(process.cwd(), 'server_data.json');

export interface DBState {
  users: User[];
  listings: Listing[];
  mandiPrices: MandiPriceRecord[];
  qualityPredictions: QualityPrediction[];
  orders: Order[];
  routes: OptimizedRoute[];
  payments: Payment[];
  notifications: AppNotification[];
}

// Initial Seed Data Generator (Bhopal & Central Madhya Pradesh Centric)
function generateSeedData(): DBState {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('farmer123', salt);

  const users: User[] = [
    {
      id: 'user-farmer-1',
      name: 'Rameshwar Patidar',
      role: 'farmer',
      phone: '+91 98260 12345',
      email: 'ramesh.farmer@agriconnect.in',
      passwordHash,
      locationLat: 23.2350,
      locationLng: 77.2950,
      state: 'Madhya Pradesh',
      district: 'Bhopal (Phanda)',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'user-farmer-2',
      name: 'Suresh Verma',
      role: 'farmer',
      phone: '+91 94250 98765',
      email: 'suresh.farmer@agriconnect.in',
      passwordHash,
      locationLat: 23.6300,
      locationLng: 77.4300,
      state: 'Madhya Pradesh',
      district: 'Bhopal (Berasia)',
      createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    },
    {
      id: 'user-farmer-3',
      name: 'Shivraj Singh Meena',
      role: 'farmer',
      phone: '+91 98930 54321',
      email: 'shivraj.farmer@agriconnect.in',
      passwordHash,
      locationLat: 23.2000,
      locationLng: 77.0850,
      state: 'Madhya Pradesh',
      district: 'Sehore (Bhopal Belt)',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'user-farmer-4',
      name: 'Anand Sharma',
      role: 'farmer',
      phone: '+91 98265 11223',
      email: 'anand.farmer@agriconnect.in',
      passwordHash,
      locationLat: 23.3200,
      locationLng: 77.5100,
      state: 'Madhya Pradesh',
      district: 'Bhopal (Sukhi Sewaniya)',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'user-buyer-1',
      name: 'Bhopal Fresh Wholesale Mart (Priya Sharma)',
      role: 'buyer',
      phone: '+91 98261 44556',
      email: 'priya.buyer@freshbazaar.in',
      passwordHash,
      locationLat: 23.2985,
      locationLng: 77.3920,
      state: 'Madhya Pradesh',
      district: 'Bhopal (Karond APMC)',
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    },
    {
      id: 'user-buyer-2',
      name: 'MP Agro Fresh Supermarket (Vikram Malhotra)',
      role: 'buyer',
      phone: '+91 98100 77889',
      email: 'vikram.buyer@agromart.in',
      passwordHash,
      locationLat: 23.2332,
      locationLng: 77.4343,
      state: 'Madhya Pradesh',
      district: 'Bhopal (MP Nagar Zone 2)',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  const qualityPredictions: QualityPrediction[] = [
    {
      id: 'qp-seed-1',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      cropHint: 'Tomato',
      predictedGrade: 'A',
      confidence: 0.95,
      diseaseStatus: 'healthy',
      diseaseName: 'Certified Prime & Disease-Free (ICAR Grade A Spec)',
      diseaseSeverityPercent: 0,
      pathogenType: 'None (Healthy)',
      symptoms: [
        'High uniformity in deep red color spectrum (96% color index)',
        'Zero deep blemishes, necrotic lesions, or bacterial spot',
        'Firm pericarp structure and intact fresh green calyx',
      ],
      treatmentRecommendation: 'Optimal harvest health. Maintain standard 10°C cold chain transport to Karond APMC Mandi.',
      defectNotes: [
        'Grade A table export standard with zero field rot',
        'Firm epidermal tension indicating prime shelf life (10-14 days)',
        'Qualifies for +12.5% fair price premium over modal Bhopal mandi rates',
      ],
      suggestedPriceAdjustmentPercent: 12.5,
      mandiModalPrice: 28.5,
      predictedFairPricePerKg: 32.0,
      predictedPricePerQuintal: 3200,
      priceRationale: 'Certified Grade A: +12.5% quality premium over modal rate (₹28.5/kg) driven by blemish-free score (96%) and prime freshness (94%). Fair price is ₹32.0/kg (₹3,200/Qtl).',
      recommendedPriceRange: {
        min: 30.0,
        max: 33.5,
      },
      metrics: {
        colorRipenessScore: 95,
        surfaceUniformityScore: 92,
        blemishFreeScore: 96,
        freshnessIndex: 94,
      },
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'qp-seed-2',
      imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
      cropHint: 'Onion',
      predictedGrade: 'B',
      confidence: 0.90,
      diseaseStatus: 'healthy',
      diseaseName: 'Healthy with Minor Natural Curing Marks (Standard Grade B)',
      diseaseSeverityPercent: 0,
      pathogenType: 'None (Healthy)',
      symptoms: [
        'Dry protective outer tunic intact; zero fungal neck rot',
        'Minor superficial skin peeling (<4% surface area)',
        'Firm internal bulb core with crisp pungent scales',
      ],
      treatmentRecommendation: 'Produce is healthy and safe. Store in well-ventilated dry conditions before Karond mandi auction.',
      defectNotes: [
        'Standard commercial Grade B market viability with slight pigment variation',
        'Bulb sizing uniform between 45mm - 60mm diameter',
        'Zero internal rot; 100% edible and market ready',
      ],
      suggestedPriceAdjustmentPercent: 0.0,
      mandiModalPrice: 24.0,
      predictedFairPricePerKg: 24.0,
      predictedPricePerQuintal: 2400,
      priceRationale: 'Standard Grade B: Safe, healthy commercial onion with slight natural curing variation. Valued at fair APMC modal benchmark ₹24.0/kg (₹2,400/Qtl).',
      recommendedPriceRange: {
        min: 23.0,
        max: 25.0,
      },
      metrics: {
        colorRipenessScore: 84,
        surfaceUniformityScore: 82,
        blemishFreeScore: 85,
        freshnessIndex: 86,
      },
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'qp-seed-3',
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
      cropHint: 'Potato',
      predictedGrade: 'A',
      confidence: 0.94,
      diseaseStatus: 'healthy',
      diseaseName: 'Certified Clean Malwa Jyoti Potato (Grade A)',
      diseaseSeverityPercent: 0,
      pathogenType: 'None (Healthy)',
      symptoms: [
        'Clear golden skin with zero greening (solanine zero)',
        'Zero common scab, late blight, or wireworm boreholes',
        'Tuber hardness test optimum, no internal hollow heart',
      ],
      treatmentRecommendation: 'Store in dry, dark ventilated shed at 12-14°C before packaging in 50kg mesh bags.',
      defectNotes: [
        'Prime Malwa belt Jyoti variety with high dry-matter content',
        'Uniform oval geometry suitable for both table consumption and retail',
        'Qualifies for +8% premium in Bhopal wholesale markets',
      ],
      suggestedPriceAdjustmentPercent: 8.0,
      mandiModalPrice: 18.0,
      predictedFairPricePerKg: 19.5,
      predictedPricePerQuintal: 1950,
      priceRationale: 'Certified Grade A Malwa Jyoti: +8% premium over baseline (₹18.0/kg) supported by 95% blemish-free rating. Recommended price is ₹19.5/kg (₹1,950/Qtl).',
      recommendedPriceRange: {
        min: 18.5,
        max: 20.5,
      },
      metrics: {
        colorRipenessScore: 91,
        surfaceUniformityScore: 94,
        blemishFreeScore: 95,
        freshnessIndex: 93,
      },
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'qp-seed-4',
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
      cropHint: 'Wheat',
      predictedGrade: 'A',
      confidence: 0.96,
      diseaseStatus: 'healthy',
      diseaseName: 'Certified Sharbati Gold (Prime Export Grade A)',
      diseaseSeverityPercent: 0,
      pathogenType: 'None (Healthy)',
      symptoms: [
        'Amber translucent grains with 98% vitreous grain count',
        'Zero Karnal bunt, rust spores, or weevil perforation',
        '100% sound grain test weight (>80 kg/hL test weight)',
      ],
      treatmentRecommendation: 'Moisture is below 10.5%. Pack in hermetic multi-layer woven bags for long-duration quality retention.',
      defectNotes: [
        'Famous Sehore/Phanda Sharbati C.306 strain with natural sheen',
        'Gluten strength and sedimentation index exceed grade A benchmarks',
        'Qualifies for +15% premium over standard milling wheat',
      ],
      suggestedPriceAdjustmentPercent: 15.0,
      mandiModalPrice: 28.0,
      predictedFairPricePerKg: 32.5,
      predictedPricePerQuintal: 3250,
      priceRationale: 'Certified Sharbati Grade A: +15% premium over standard wheat (₹28.0/kg) due to 98% vitreous grain luster and high protein content. Fair price is ₹32.5/kg (₹3,250/Qtl).',
      recommendedPriceRange: {
        min: 31.0,
        max: 34.0,
      },
      metrics: {
        colorRipenessScore: 98,
        surfaceUniformityScore: 96,
        blemishFreeScore: 97,
        freshnessIndex: 95,
      },
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'qp-seed-5',
      imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
      cropHint: 'Soybean',
      predictedGrade: 'A',
      confidence: 0.94,
      diseaseStatus: 'healthy',
      diseaseName: 'Certified Clean Yellow Soybean (Grade A Oilseed)',
      diseaseSeverityPercent: 0,
      pathogenType: 'None (Healthy)',
      symptoms: [
        'Clean yellow hilum, zero anthracnose or purple seed stain',
        'Foreign matter <0.5%, well sun-dried under 10% moisture',
        'Plump uniform seeds with intact outer seed coat',
      ],
      treatmentRecommendation: 'Optimal dry storage condition. Ready for immediate crushing or processing.',
      defectNotes: [
        'JS-9560 variety with guaranteed 18.8% oil recovery test',
        'High seed vigor and zero mold contamination',
        'Qualifies for +6% premium over baseline mandi modal prices',
      ],
      suggestedPriceAdjustmentPercent: 6.0,
      mandiModalPrice: 45.0,
      predictedFairPricePerKg: 48.0,
      predictedPricePerQuintal: 4800,
      priceRationale: 'Certified Grade A Oilseed: High oil recovery and zero mold justify ₹48.0/kg (₹4,800/Qtl) vs mandi base ₹45.0/kg.',
      recommendedPriceRange: {
        min: 46.5,
        max: 49.5,
      },
      metrics: {
        colorRipenessScore: 93,
        surfaceUniformityScore: 94,
        blemishFreeScore: 95,
        freshnessIndex: 92,
      },
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'qp-seed-6',
      imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
      cropHint: 'Green Chilli',
      predictedGrade: 'A',
      confidence: 0.95,
      diseaseStatus: 'healthy',
      diseaseName: 'Certified Lustrous Green Chilli (Grade A Export Spec)',
      diseaseSeverityPercent: 0,
      pathogenType: 'None (Healthy)',
      symptoms: [
        'Emerald green lustrous pod with firm turgid pericarp',
        'Zero anthracnose lesions, sunscald, or blossom end rot',
        'Stem intact and freshly harvested within last 24 hours',
      ],
      treatmentRecommendation: 'Maintain ventilated crate packing at 10-12°C for interstate transit.',
      defectNotes: [
        'Export standard length (8-10cm) with high capsaicin pungency',
        'Firm skin with 7+ days retail shelf life',
        'Qualifies for +10% quality premium in urban wholesale hubs',
      ],
      suggestedPriceAdjustmentPercent: 10.0,
      mandiModalPrice: 34.0,
      predictedFairPricePerKg: 38.0,
      predictedPricePerQuintal: 3800,
      priceRationale: 'Certified Grade A G4 Chilli: +10% premium for spotless emerald pods and intact calyx. Fair price ₹38.0/kg.',
      recommendedPriceRange: {
        min: 36.0,
        max: 40.0,
      },
      metrics: {
        colorRipenessScore: 96,
        surfaceUniformityScore: 93,
        blemishFreeScore: 97,
        freshnessIndex: 98,
      },
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  const listings: Listing[] = [
    {
      id: 'list-1',
      farmerId: 'user-farmer-1',
      farmerName: 'Rameshwar Patidar',
      farmerPhone: '+91 98260 12345',
      farmerLocation: 'Phanda Khurd, Bhopal, Madhya Pradesh',
      locationLat: 23.2350,
      locationLng: 77.2950,
      cropName: 'Wheat',
      variety: 'Sharbati C.306 (Golden Lustre Grade A)',
      quantityKg: 10000,
      qualityGrade: 'A',
      qualityPredictionId: 'qp-seed-4',
      askingPricePerKg: 32.5,
      harvestDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      status: 'active',
      description: 'Authentic Sehore/Bhopal belt Sharbati wheat, famous for golden lustre, high protein (13.2%), and sweet chapati taste. Machine cleaned and stored in hermetic bags.',
      photoUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'list-2',
      farmerId: 'user-farmer-2',
      farmerName: 'Suresh Verma',
      farmerPhone: '+91 94250 98765',
      farmerLocation: 'Berasia Mandi Belt, Bhopal, Madhya Pradesh',
      locationLat: 23.6300,
      locationLng: 77.4300,
      cropName: 'Tomato',
      variety: 'Abhinav Hybrid (Table Grade)',
      quantityKg: 3500,
      qualityGrade: 'A',
      qualityPredictionId: 'qp-seed-1',
      askingPricePerKg: 21.0,
      harvestDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      status: 'active',
      description: 'Freshly plucked ripe red table tomatoes from our Berasia drip-irrigated farm. Graded A by AI scanner, crate-packed and ready for direct pickup or Karond dispatch.',
      photoUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'list-3',
      farmerId: 'user-farmer-1',
      farmerName: 'Rameshwar Patidar',
      farmerPhone: '+91 98260 12345',
      farmerLocation: 'Kolar Road / Phanda, Bhopal, Madhya Pradesh',
      locationLat: 23.2100,
      locationLng: 77.3800,
      cropName: 'Potato',
      variety: 'Malwa Jyoti (A Grade)',
      quantityKg: 8500,
      qualityGrade: 'A',
      qualityPredictionId: 'qp-seed-3',
      askingPricePerKg: 15.5,
      harvestDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      status: 'active',
      description: 'Grade A fresh harvest Jyoti potatoes from Bhopal periphery. Zero sugar accumulation, firm texture, high dry-matter content, packed in 50kg jute bags.',
      photoUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'list-4',
      farmerId: 'user-farmer-4',
      farmerName: 'Anand Sharma',
      farmerPhone: '+91 98265 11223',
      farmerLocation: 'Sukhi Sewaniya, Bhopal, Madhya Pradesh',
      locationLat: 23.3200,
      locationLng: 77.5100,
      cropName: 'Soybean',
      variety: 'JS-9560 Yellow Soybean',
      quantityKg: 6000,
      qualityGrade: 'A',
      askingPricePerKg: 48.0,
      harvestDate: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
      status: 'active',
      description: 'Clean yellow soybean with high oil content (18.8%) from Sukhi Sewaniya. Sun-dried with moisture <10%, ideal for oil mills and feed processors.',
      photoUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'list-5',
      farmerId: 'user-farmer-3',
      farmerName: 'Shivraj Singh Meena',
      farmerPhone: '+91 98930 54321',
      farmerLocation: 'Karond Mandi Link, Bhopal, Madhya Pradesh',
      locationLat: 23.2950,
      locationLng: 77.3950,
      cropName: 'Onion',
      variety: 'Red Garwa (Long Shelf Life)',
      quantityKg: 5500,
      qualityGrade: 'B',
      qualityPredictionId: 'qp-seed-2',
      askingPricePerKg: 18.5,
      harvestDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      status: 'active',
      description: 'Sun-cured red onions from Shajapur/Bhopal border. Thick skin, low moisture loss, excellent for retail storage and interstate dispatch.',
      photoUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'list-6',
      farmerId: 'user-farmer-4',
      farmerName: 'Anand Sharma',
      farmerPhone: '+91 98265 11223',
      farmerLocation: 'Raisen Road, Sukhi Sewaniya, Bhopal, MP',
      locationLat: 23.3300,
      locationLng: 77.5300,
      cropName: 'Rice',
      variety: 'PUSA Basmati 1121 Paddy',
      quantityKg: 7500,
      qualityGrade: 'A',
      askingPricePerKg: 58.0,
      harvestDate: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
      status: 'active',
      description: 'Premium Raisen/Bhopal belt Basmati 1121 paddy with exceptional grain elongation and aroma. Cleaned and moisture-tested.',
      photoUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'list-7',
      farmerId: 'user-farmer-2',
      farmerName: 'Suresh Verma',
      farmerPhone: '+91 94250 98765',
      farmerLocation: 'Berasia Road, Bhopal, Madhya Pradesh',
      locationLat: 23.6100,
      locationLng: 77.4100,
      cropName: 'Mustard',
      variety: 'Pusa Bold Yellow',
      quantityKg: 4500,
      qualityGrade: 'A',
      askingPricePerKg: 55.0,
      harvestDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      status: 'active',
      description: 'Pusa Bold oilseed mustard with high pungency and 41.5% oil yield. Machine winnowed in 50kg bags.',
      photoUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'list-8',
      farmerId: 'user-farmer-1',
      farmerName: 'Rameshwar Patidar',
      farmerPhone: '+91 98260 12345',
      farmerLocation: 'Hoshangabad Road / Phanda, Bhopal, MP',
      locationLat: 23.1800,
      locationLng: 77.4600,
      cropName: 'Green Chilli',
      variety: 'G4 Spicy Green Chilli',
      quantityKg: 1500,
      qualityGrade: 'A',
      askingPricePerKg: 38.0,
      harvestDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      status: 'active',
      description: 'Crisp, dark green spicy G4 chillies. Zero pesticide residue, hand-plucked in ventilated 20kg crates.',
      photoUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  // 400+ Realistic Mandi Price records heavily Bhopal & MP Centric spanning the last 35 days
  const mandiPrices: MandiPriceRecord[] = [];
  const cropsConfig = [
    {
      crop: 'Wheat',
      variety: 'Sharbati C.306',
      basePrice: 32.0,
      volatility: 0.05,
      trend: 0.002,
      markets: [
        { market: 'Karond Mandi (Bhopal)', district: 'Bhopal', state: 'Madhya Pradesh', offset: 0.5 },
        { market: 'Berasia Mandi', district: 'Bhopal', state: 'Madhya Pradesh', offset: -0.5 },
        { market: 'Sehore APMC (Sharbati Hub)', district: 'Sehore', state: 'Madhya Pradesh', offset: 1.0 },
        { market: 'Vidisha APMC', district: 'Vidisha', state: 'Madhya Pradesh', offset: 0.2 },
        { market: 'Hoshangabad (Narmadapuram)', district: 'Narmadapuram', state: 'Madhya Pradesh', offset: -0.2 },
        { market: 'Indore (Choithram APMC)', district: 'Indore', state: 'Madhya Pradesh', offset: 0.8 },
        { market: 'Azadpur', district: 'New Delhi', state: 'Delhi', offset: 3.5 },
      ],
    },
    {
      crop: 'Tomato',
      variety: 'Hybrid / Abhinav',
      basePrice: 21.0,
      volatility: 0.16,
      trend: 0.003,
      markets: [
        { market: 'Karond Mandi (Bhopal)', district: 'Bhopal', state: 'Madhya Pradesh', offset: 0.0 },
        { market: 'Berasia Mandi', district: 'Bhopal', state: 'Madhya Pradesh', offset: -1.0 },
        { market: 'Raisen APMC', district: 'Raisen', state: 'Madhya Pradesh', offset: -0.8 },
        { market: 'Sehore APMC', district: 'Sehore', state: 'Madhya Pradesh', offset: -0.5 },
        { market: 'Indore (Choithram APMC)', district: 'Indore', state: 'Madhya Pradesh', offset: 0.5 },
        { market: 'Pimpalgaon', district: 'Nashik', state: 'Maharashtra', offset: 1.5 },
        { market: 'Azadpur', district: 'New Delhi', state: 'Delhi', offset: 4.0 },
      ],
    },
    {
      crop: 'Onion',
      variety: 'Red Garwa',
      basePrice: 19.0,
      volatility: 0.12,
      trend: -0.001,
      markets: [
        { market: 'Karond Mandi (Bhopal)', district: 'Bhopal', state: 'Madhya Pradesh', offset: 0.0 },
        { market: 'Berasia Mandi', district: 'Bhopal', state: 'Madhya Pradesh', offset: -0.6 },
        { market: 'Shajapur APMC', district: 'Shajapur', state: 'Madhya Pradesh', offset: -1.2 },
        { market: 'Ujjain APMC', district: 'Ujjain', state: 'Madhya Pradesh', offset: -0.5 },
        { market: 'Indore (Choithram APMC)', district: 'Indore', state: 'Madhya Pradesh', offset: 0.4 },
        { market: 'Lasalgaon', district: 'Nashik', state: 'Maharashtra', offset: -1.5 },
        { market: 'Azadpur', district: 'New Delhi', state: 'Delhi', offset: 3.5 },
      ],
    },
    {
      crop: 'Potato',
      variety: 'Malwa Jyoti',
      basePrice: 15.5,
      volatility: 0.08,
      trend: 0.001,
      markets: [
        { market: 'Karond Mandi (Bhopal)', district: 'Bhopal', state: 'Madhya Pradesh', offset: 0.0 },
        { market: 'Berasia Mandi', district: 'Bhopal', state: 'Madhya Pradesh', offset: -0.7 },
        { market: 'Indore (Choithram APMC)', district: 'Indore', state: 'Madhya Pradesh', offset: 0.2 },
        { market: 'Dewas APMC', district: 'Dewas', state: 'Madhya Pradesh', offset: -0.4 },
        { market: 'Agra APMC', district: 'Agra', state: 'Uttar Pradesh', offset: -1.5 },
        { market: 'Azadpur', district: 'New Delhi', state: 'Delhi', offset: 2.8 },
      ],
    },
    {
      crop: 'Soybean',
      variety: 'Yellow JS-9560',
      basePrice: 48.5,
      volatility: 0.07,
      trend: 0.002,
      markets: [
        { market: 'Karond Mandi (Bhopal)', district: 'Bhopal', state: 'Madhya Pradesh', offset: 0.0 },
        { market: 'Berasia Mandi', district: 'Bhopal', state: 'Madhya Pradesh', offset: -0.4 },
        { market: 'Sehore APMC', district: 'Sehore', state: 'Madhya Pradesh', offset: 0.2 },
        { market: 'Vidisha APMC', district: 'Vidisha', state: 'Madhya Pradesh', offset: 0.1 },
        { market: 'Indore (Choithram APMC)', district: 'Indore', state: 'Madhya Pradesh', offset: 0.6 },
        { market: 'Ujjain APMC', district: 'Ujjain', state: 'Madhya Pradesh', offset: 0.3 },
        { market: 'Kota APMC', district: 'Kota', state: 'Rajasthan', offset: 0.5 },
      ],
    },
    {
      crop: 'Mustard',
      variety: 'Pusa Bold',
      basePrice: 54.0,
      volatility: 0.06,
      trend: 0.0015,
      markets: [
        { market: 'Karond Mandi (Bhopal)', district: 'Bhopal', state: 'Madhya Pradesh', offset: 0.0 },
        { market: 'Berasia Mandi', district: 'Bhopal', state: 'Madhya Pradesh', offset: -0.5 },
        { market: 'Vidisha APMC', district: 'Vidisha', state: 'Madhya Pradesh', offset: 0.3 },
        { market: 'Rajgarh / Biaora', district: 'Rajgarh', state: 'Madhya Pradesh', offset: -0.8 },
        { market: 'Morena APMC (Mustard Belt)', district: 'Morena', state: 'Madhya Pradesh', offset: 0.8 },
        { market: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', offset: 1.2 },
      ],
    },
    {
      crop: 'Rice',
      variety: '1121 Basmati',
      basePrice: 60.0,
      volatility: 0.06,
      trend: 0.002,
      markets: [
        { market: 'Karond Mandi (Bhopal)', district: 'Bhopal', state: 'Madhya Pradesh', offset: 0.5 },
        { market: 'Raisen APMC (Paddy Belt)', district: 'Raisen', state: 'Madhya Pradesh', offset: -1.0 },
        { market: 'Hoshangabad (Narmadapuram)', district: 'Narmadapuram', state: 'Madhya Pradesh', offset: -0.8 },
        { market: 'Taraori', district: 'Karnal', state: 'Haryana', offset: 4.0 },
        { market: 'Delhi (Narela)', district: 'Delhi', state: 'Delhi', offset: 4.5 },
      ],
    },
    {
      crop: 'Green Chilli',
      variety: 'G4 Spicy',
      basePrice: 39.0,
      volatility: 0.14,
      trend: 0.004,
      markets: [
        { market: 'Karond Mandi (Bhopal)', district: 'Bhopal', state: 'Madhya Pradesh', offset: 0.0 },
        { market: 'Berasia Mandi', district: 'Bhopal', state: 'Madhya Pradesh', offset: -1.5 },
        { market: 'Khargone / Nimad APMC', district: 'Khargone', state: 'Madhya Pradesh', offset: -2.5 },
        { market: 'Indore (Choithram APMC)', district: 'Indore', state: 'Madhya Pradesh', offset: 0.8 },
        { market: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', offset: -3.0 },
        { market: 'Azadpur', district: 'New Delhi', state: 'Delhi', offset: 5.0 },
      ],
    },
  ];

  let recordIdCounter = 1;
  const now = new Date();

  // Generate 35 days of history for each crop & market
  for (let dayOffset = 34; dayOffset >= 0; dayOffset--) {
    const recordDate = new Date(now.getTime() - dayOffset * 86400000);
    const dateString = recordDate.toISOString().split('T')[0];

    for (const cropConfig of cropsConfig) {
      for (const m of cropConfig.markets) {
        const dayIdx = 34 - dayOffset;
        const trendFactor = 1 + cropConfig.trend * dayIdx;
        const seasonalFactor = Math.sin((dayIdx / 30) * Math.PI * 2) * (cropConfig.volatility * 0.5);
        const noise = (Math.sin(dayIdx * 3.7 + m.market.length) * 0.5) * cropConfig.volatility;
        
        let modal = (cropConfig.basePrice + m.offset) * trendFactor * (1 + seasonalFactor + noise);
        modal = Math.max(5, Math.round(modal * 10) / 10);
        const spread = Math.round((modal * 0.08) * 10) / 10;
        const minPrice = Math.max(3, Math.round((modal - spread) * 10) / 10);
        const maxPrice = Math.round((modal + spread) * 10) / 10;

        const source = dayOffset === 0 ? 'agmarknet' : (dayOffset % 3 === 0 ? 'enam' : 'seed_fallback');

        mandiPrices.push({
          id: `mandi-${recordIdCounter++}`,
          cropName: cropConfig.crop,
          variety: cropConfig.variety,
          market: m.market,
          district: m.district,
          state: m.state,
          minPrice,
          maxPrice,
          modalPrice: modal,
          date: dateString,
          source,
          syncedAt: new Date(recordDate.getTime() + 14 * 3600000).toISOString(),
        });
      }
    }
  }

  const orders: Order[] = [
    {
      id: 'ord-101',
      listingId: 'list-2',
      buyerId: 'user-buyer-1',
      buyerName: 'Bhopal Fresh Wholesale Mart',
      buyerPhone: '+91 98261 44556',
      farmerId: 'user-farmer-2',
      farmerName: 'Suresh Verma',
      cropName: 'Tomato',
      quantityKg: 1200,
      agreedPricePerKg: 21.0,
      totalAmount: 25200,
      fairPriceScore: 95,
      fairPriceBreakdown: {
        askingPrice: 21.0,
        mandiModalPrice: 23.5,
        qualityGrade: 'A',
        qualityBonus: 10,
        priceRatio: 89.4,
        intermediarySavingsPerKg: 4.5,
      },
      pickupLat: 23.6300,
      pickupLng: 77.4300,
      pickupAddress: 'Berasia Highway Farm Gate, Bhopal, Madhya Pradesh',
      deliveryLat: 23.2985,
      deliveryLng: 77.3920,
      deliveryAddress: 'Karond APMC Market Yard Shed 4, Bhopal, Madhya Pradesh',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
      id: 'ord-102',
      listingId: 'list-1',
      buyerId: 'user-buyer-2',
      buyerName: 'MP Agro Fresh Supermarket',
      buyerPhone: '+91 98100 77889',
      farmerId: 'user-farmer-1',
      farmerName: 'Rameshwar Patidar',
      cropName: 'Wheat',
      quantityKg: 2000,
      agreedPricePerKg: 32.5,
      totalAmount: 65000,
      fairPriceScore: 93,
      fairPriceBreakdown: {
        askingPrice: 32.5,
        mandiModalPrice: 35.0,
        qualityGrade: 'A',
        qualityBonus: 12,
        priceRatio: 92.8,
        intermediarySavingsPerKg: 5.2,
      },
      pickupLat: 23.2350,
      pickupLng: 77.2950,
      pickupAddress: 'Phanda Khurd Sharbati Wheat Store, Bhopal, Madhya Pradesh',
      deliveryLat: 23.2332,
      deliveryLng: 77.4343,
      deliveryAddress: 'MP Nagar Zone 2 Agro Hub, Bhopal, Madhya Pradesh',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    },
    {
      id: 'ord-103',
      listingId: 'list-8',
      buyerId: 'user-buyer-1',
      buyerName: 'Bhopal Fresh Wholesale Mart',
      buyerPhone: '+91 98261 44556',
      farmerId: 'user-farmer-1',
      farmerName: 'Rameshwar Patidar',
      cropName: 'Green Chilli',
      quantityKg: 600,
      agreedPricePerKg: 38.0,
      totalAmount: 22800,
      fairPriceScore: 96,
      fairPriceBreakdown: {
        askingPrice: 38.0,
        mandiModalPrice: 42.0,
        qualityGrade: 'A',
        qualityBonus: 10,
        priceRatio: 90.4,
        intermediarySavingsPerKg: 6.8,
      },
      pickupLat: 23.1800,
      pickupLng: 77.4600,
      pickupAddress: 'Hoshangabad Road Farm Gate, Bhopal, Madhya Pradesh',
      deliveryLat: 23.2985,
      deliveryLng: 77.3920,
      deliveryAddress: 'Karond APMC Market Yard Shed 4, Bhopal, Madhya Pradesh',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ];

  const payments: Payment[] = [
    {
      id: 'pay-101',
      orderId: 'ord-101',
      buyerId: 'user-buyer-1',
      farmerId: 'user-farmer-2',
      amount: 25200,
      status: 'held',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
      id: 'pay-102',
      orderId: 'ord-102',
      buyerId: 'user-buyer-2',
      farmerId: 'user-farmer-1',
      amount: 65000,
      status: 'held',
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    },
    {
      id: 'pay-103',
      orderId: 'ord-103',
      buyerId: 'user-buyer-1',
      farmerId: 'user-farmer-1',
      amount: 22800,
      status: 'held',
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif-1',
      userId: 'user-buyer-1',
      title: '📦 Order Ready for Pickup',
      message: 'Farmer Rameshwar Patidar has graded and packed Order #ord-seed-1 (1,200 kg Tomato). Ready for dispatch to Karond APMC.',
      type: 'order_ready',
      orderId: 'ord-seed-1',
      read: false,
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
  ];

  return {
    users,
    listings,
    mandiPrices,
    qualityPredictions,
    orders,
    routes: [],
    payments,
    notifications,
  };
}

class Database {
  private state: DBState;

  constructor() {
    this.state = this.load();
  }

  private load(): DBState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.notifications) parsed.notifications = [];
        return parsed;
      }
    } catch (err) {
      console.warn('Could not load existing data file, seeding new database state:', err);
    }
    const initial = generateSeedData();
    this.save(initial);
    return initial;
  }

  private save(state: DBState) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public getState(): DBState {
    return this.state;
  }

  // Users
  public getUsers(): User[] {
    return this.state.users;
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): User {
    this.state.users.push(user);
    this.save(this.state);
    return user;
  }

  // Listings
  public getListings(): Listing[] {
    return this.state.listings;
  }

  public getListingById(id: string): Listing | undefined {
    return this.state.listings.find(l => l.id === id);
  }

  public addListing(listing: Listing): Listing {
    this.state.listings.unshift(listing);
    this.save(this.state);
    return listing;
  }

  public updateListing(id: string, updates: Partial<Listing>): Listing | undefined {
    const idx = this.state.listings.findIndex(l => l.id === id);
    if (idx === -1) return undefined;
    this.state.listings[idx] = { ...this.state.listings[idx], ...updates };
    this.save(this.state);
    return this.state.listings[idx];
  }

  // Mandi Prices
  public getMandiPrices(filters?: { crop?: string; state?: string; market?: string }): MandiPriceRecord[] {
    return this.state.mandiPrices.filter(item => {
      if (filters?.crop && item.cropName.toLowerCase() !== filters.crop.toLowerCase()) return false;
      if (filters?.state && item.state.toLowerCase() !== filters.state.toLowerCase()) return false;
      if (filters?.market && !item.market.toLowerCase().includes(filters.market.toLowerCase())) return false;
      return true;
    });
  }

  public addMandiPrices(records: MandiPriceRecord[]): number {
    let added = 0;
    for (const rec of records) {
      const exists = this.state.mandiPrices.findIndex(
        m => m.cropName.toLowerCase() === rec.cropName.toLowerCase() &&
             m.market.toLowerCase() === rec.market.toLowerCase() &&
             m.date === rec.date
      );
      if (exists >= 0) {
        this.state.mandiPrices[exists] = rec;
      } else {
        this.state.mandiPrices.push(rec);
        added++;
      }
    }
    this.save(this.state);
    return added;
  }

  // Quality Predictions
  public getQualityPredictions(): QualityPrediction[] {
    return this.state.qualityPredictions || [];
  }

  public addQualityPrediction(qp: QualityPrediction): QualityPrediction {
    this.state.qualityPredictions.unshift(qp);
    this.save(this.state);
    return qp;
  }

  public getQualityPredictionById(id: string): QualityPrediction | undefined {
    return this.state.qualityPredictions.find(q => q.id === id);
  }

  // Orders
  public getOrders(): Order[] {
    return this.state.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.state.orders.find(o => o.id === id);
  }

  public addOrder(order: Order): Order {
    this.state.orders.unshift(order);
    this.save(this.state);
    return order;
  }

  public updateOrderStatus(id: string, status: Order['status']): Order | undefined {
    const idx = this.state.orders.findIndex(o => o.id === id);
    if (idx === -1) return undefined;
    this.state.orders[idx].status = status;
    this.save(this.state);
    return this.state.orders[idx];
  }

  // Routes
  public getRoutes(): OptimizedRoute[] {
    return this.state.routes;
  }

  public getRouteById(id: string): OptimizedRoute | undefined {
    return this.state.routes.find(r => r.id === id);
  }

  public addRoute(route: OptimizedRoute): OptimizedRoute {
    this.state.routes.unshift(route);
    this.save(this.state);
    return route;
  }

  // Payments
  public getPayments(): Payment[] {
    return this.state.payments;
  }

  public getPaymentByOrderId(orderId: string): Payment | undefined {
    return this.state.payments.find(p => p.orderId === orderId);
  }

  public addPayment(payment: Payment): Payment {
    this.state.payments.unshift(payment);
    this.save(this.state);
    return payment;
  }

  public updatePaymentStatus(orderId: string, status: Payment['status']): Payment | undefined {
    const idx = this.state.payments.findIndex(p => p.orderId === orderId);
    if (idx === -1) return undefined;
    this.state.payments[idx].status = status;
    if (status === 'released') {
      this.state.payments[idx].releasedAt = new Date().toISOString();
    }
    this.save(this.state);
    return this.state.payments[idx];
  }

  // Notifications
  public getNotifications(userId?: string): AppNotification[] {
    if (!this.state.notifications) this.state.notifications = [];
    if (!userId) return this.state.notifications;
    return this.state.notifications.filter(n => n.userId === userId);
  }

  public addNotification(notification: AppNotification): AppNotification {
    if (!this.state.notifications) this.state.notifications = [];
    this.state.notifications.unshift(notification);
    this.save(this.state);
    return notification;
  }

  public markNotificationRead(id: string): boolean {
    if (!this.state.notifications) this.state.notifications = [];
    const notif = this.state.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.save(this.state);
      return true;
    }
    return false;
  }
}

export const db = new Database();
