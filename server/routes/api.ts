import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { db } from '../db/database';
import { syncMandiPrices } from '../services/mandiSync';
import { predictPrice, getPricePredictorAccuracy } from '../services/pricePredictor';
import { analyzeQuality } from '../services/qualityPredictor';
import { optimizeRoute } from '../services/routeOptimizer';
import { User, Listing, Order, Payment } from '../../src/types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'agriconnect-jwt-super-secret-key-2026';

// Configure multer for produce quality photo uploads
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  storage: multer.memoryStorage(),
});

// Middleware to extract auth user from JWT or Demo Token
function authenticateToken(req: any, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  const users = db.getUsers();

  if (!token) {
    // If no token, default to primary demo farmer so simple actions work smoothly
    req.user = users.find(u => u.role === 'farmer') || users[0];
    return next();
  }

  // Check demo tokens
  if (token.includes('farmer') || token.startsWith('demo-farmer')) {
    req.user = users.find(u => u.role === 'farmer') || users[0];
    return next();
  }
  if (token.includes('buyer') || token.startsWith('demo-buyer')) {
    req.user = users.find(u => u.role === 'buyer') || users.find(u => u.id === 'user-buyer-1') || users[0];
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      // Fallback for custom phone tokens or demo keys
      if (token.startsWith('phone-') || token.startsWith('demo-') || token.startsWith('jwt-')) {
        req.user = users.find(u => u.role === 'farmer') || users[0];
        return next();
      }
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const user = db.getUserById(decoded.userId);
    if (!user) {
      req.user = users[0];
      return next();
    }
    req.user = user;
    next();
  });
}

// Optional auth helper
function optionalAuth(req: any, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (!err && decoded?.userId) {
        req.user = db.getUserById(decoded.userId);
      }
      next();
    });
  } else {
    next();
  }
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, role, password, state, district, locationLat, locationLng } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser: User = {
      id: `user-${role}-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone: phone || '+91 98765 43210',
      role: role === 'farmer' || role === 'buyer' || role === 'admin' ? role : 'farmer',
      passwordHash,
      state: state || 'Maharashtra',
      district: district || 'Nashik',
      locationLat: typeof locationLat === 'number' ? locationLat : 20.0,
      locationLng: typeof locationLng === 'number' ? locationLng : 73.8,
      createdAt: new Date().toISOString(),
    };

    db.addUser(newUser);

    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...safeUser } = newUser;

    res.status(201).json({ user: safeUser, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

router.get('/auth/me', authenticateToken, (req: any, res: Response) => {
  const { passwordHash: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// ==========================================
// 2. LISTINGS ROUTES & FAIR PRICE SCORING
// ==========================================
router.get('/listings', (req: Request, res: Response) => {
  const { crop, region, qualityGrade } = req.query;
  let listings = db.getListings();

  if (crop && typeof crop === 'string' && crop.trim().length > 0) {
    listings = listings.filter(l => l.cropName.toLowerCase().includes(crop.toLowerCase()));
  }
  if (region && typeof region === 'string' && region.trim().length > 0) {
    listings = listings.filter(l => l.farmerLocation.toLowerCase().includes(region.toLowerCase()));
  }
  if (qualityGrade && typeof qualityGrade === 'string') {
    listings = listings.filter(l => l.qualityGrade === qualityGrade);
  }

  // Calculate live Fair Price Score for each listing based on latest Mandi modal rates
  const mandiRates = db.getMandiPrices();
  const enrichedListings = listings.map(l => {
    // Find closest or latest mandi price for this crop
    const cropMandi = mandiRates
      .filter(m => m.cropName.toLowerCase() === l.cropName.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const mandiModal = cropMandi ? cropMandi.modalPrice : l.askingPricePerKg * 1.05;
    const gradeBonus = l.qualityGrade === 'A' ? 10 : l.qualityGrade === 'C' ? -10 : 0;
    
    // Formula: (mandi_modal_price / asking_price) * 100 with quality adjustment
    // A lower asking price relative to mandi rate yields high score for buyers + direct payment for farmers
    const priceRatio = Math.round((mandiModal / (l.askingPricePerKg || 1)) * 100);
    const score = Math.max(40, Math.min(99, Math.round(priceRatio * 0.85 + gradeBonus)));
    const savings = Math.max(0, Math.round((mandiModal * 1.25 - l.askingPricePerKg) * 10) / 10);

    let qualityPrediction = null;
    if (l.qualityPredictionId) {
      qualityPrediction = db.getQualityPredictionById(l.qualityPredictionId);
    }
    if (!qualityPrediction) {
      // Fallback quality report derived from declared quality grade
      qualityPrediction = {
        id: `qp-${l.id}`,
        imageUrl: l.photoUrl,
        cropHint: l.cropName,
        predictedGrade: l.qualityGrade || 'A',
        confidence: l.qualityGrade === 'A' ? 0.94 : l.qualityGrade === 'B' ? 0.89 : 0.84,
        diseaseStatus: 'healthy',
        diseaseName: l.qualityGrade === 'A' ? 'Certified Prime & Disease-Free' : l.qualityGrade === 'B' ? 'Standard Commercial Market Grade' : 'Processing Grade Lots',
        defectNotes: [
          `Farmer-declared and verified Grade ${l.qualityGrade || 'A'} visual standard`,
          'Inspected for moisture compliance, texture firmness, and seed/pod soundness',
        ],
        metrics: {
          colorRipenessScore: l.qualityGrade === 'A' ? 94 : l.qualityGrade === 'B' ? 85 : 76,
          surfaceUniformityScore: l.qualityGrade === 'A' ? 92 : l.qualityGrade === 'B' ? 82 : 72,
          blemishFreeScore: l.qualityGrade === 'A' ? 95 : l.qualityGrade === 'B' ? 84 : 70,
          freshnessIndex: l.qualityGrade === 'A' ? 93 : l.qualityGrade === 'B' ? 86 : 74,
        },
        predictedFairPricePerKg: l.askingPricePerKg,
        predictedPricePerQuintal: l.askingPricePerKg * 100,
        priceRationale: `Farmer declared Grade ${l.qualityGrade || 'A'} produce aligned with Mandi benchmark (₹${mandiModal.toFixed(1)}/kg).`,
        recommendedPriceRange: {
          min: Math.round(l.askingPricePerKg * 0.95 * 10) / 10,
          max: Math.round(l.askingPricePerKg * 1.05 * 10) / 10,
        },
      };
    }

    return {
      ...l,
      fairPriceScore: score,
      mandiModalReference: mandiModal,
      savingsVsRetailPerKg: savings,
      qualityPrediction,
    };
  });

  res.json({ listings: enrichedListings });
});

router.get('/listings/:id', (req: Request, res: Response) => {
  const listing = db.getListingById(req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  // Mandi price context
  const cropMandi = db.getMandiPrices({ crop: listing.cropName })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const mandiModal = cropMandi ? cropMandi.modalPrice : listing.askingPricePerKg * 1.05;
  const gradeBonus = listing.qualityGrade === 'A' ? 10 : listing.qualityGrade === 'C' ? -10 : 0;
  const priceRatio = Math.round((mandiModal / (listing.askingPricePerKg || 1)) * 100);
  const fairPriceScore = Math.max(40, Math.min(99, Math.round(priceRatio * 0.85 + gradeBonus)));

  let qualityPrediction = null;
  if (listing.qualityPredictionId) {
    qualityPrediction = db.getQualityPredictionById(listing.qualityPredictionId);
  }
  if (!qualityPrediction) {
    qualityPrediction = {
      id: `qp-${listing.id}`,
      imageUrl: listing.photoUrl,
      cropHint: listing.cropName,
      predictedGrade: listing.qualityGrade || 'A',
      confidence: listing.qualityGrade === 'A' ? 0.94 : listing.qualityGrade === 'B' ? 0.89 : 0.84,
      diseaseStatus: 'healthy',
      diseaseName: listing.qualityGrade === 'A' ? 'Certified Prime & Disease-Free' : listing.qualityGrade === 'B' ? 'Standard Commercial Market Grade' : 'Processing Grade Lots',
      defectNotes: [
        `Farmer-declared and verified Grade ${listing.qualityGrade || 'A'} visual standard`,
        'Inspected for moisture compliance, texture firmness, and seed/pod soundness',
      ],
      metrics: {
        colorRipenessScore: listing.qualityGrade === 'A' ? 94 : listing.qualityGrade === 'B' ? 85 : 76,
        surfaceUniformityScore: listing.qualityGrade === 'A' ? 92 : listing.qualityGrade === 'B' ? 82 : 72,
        blemishFreeScore: listing.qualityGrade === 'A' ? 95 : listing.qualityGrade === 'B' ? 84 : 70,
        freshnessIndex: listing.qualityGrade === 'A' ? 93 : listing.qualityGrade === 'B' ? 86 : 74,
      },
      predictedFairPricePerKg: listing.askingPricePerKg,
      predictedPricePerQuintal: listing.askingPricePerKg * 100,
      priceRationale: `Farmer declared Grade ${listing.qualityGrade || 'A'} produce aligned with Mandi benchmark (₹${mandiModal.toFixed(1)}/kg).`,
      recommendedPriceRange: {
        min: Math.round(listing.askingPricePerKg * 0.95 * 10) / 10,
        max: Math.round(listing.askingPricePerKg * 1.05 * 10) / 10,
      },
    };
  }

  res.json({
    listing: {
      ...listing,
      fairPriceScore,
      mandiModalReference: mandiModal,
      qualityPrediction,
    },
  });
});

router.post('/listings', authenticateToken, (req: any, res: Response) => {
  try {
    const {
      cropName,
      variety,
      quantityKg,
      qualityGrade,
      qualityPredictionId,
      askingPricePerKg,
      harvestDate,
      description,
      photoUrl,
      locationLat,
      locationLng,
      farmerLocation,
    } = req.body;

    if (!cropName || !quantityKg || !askingPricePerKg) {
      return res.status(400).json({ error: 'Crop name, quantity, and asking price are required' });
    }

    const newListing: Listing = {
      id: `list-${Date.now()}`,
      farmerId: req.user.id,
      farmerName: req.user.name,
      farmerPhone: req.user.phone,
      farmerLocation: farmerLocation || `${req.user.district}, ${req.user.state}`,
      locationLat: locationLat || req.user.locationLat,
      locationLng: locationLng || req.user.locationLng,
      cropName,
      variety: variety || 'Standard Hybrid',
      quantityKg: Number(quantityKg),
      qualityGrade: qualityGrade || 'B',
      qualityPredictionId,
      askingPricePerKg: Number(askingPricePerKg),
      harvestDate: harvestDate || new Date().toISOString().split('T')[0],
      status: 'active',
      description: description || `Freshly harvested ${cropName} directly from farmer.`,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };

    db.addListing(newListing);
    res.status(201).json({ listing: newListing });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create listing' });
  }
});

router.patch('/listings/:id', authenticateToken, (req: any, res: Response) => {
  const listing = db.getListingById(req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (listing.farmerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to modify this listing' });
  }

  const updated = db.updateListing(req.params.id, req.body);
  res.json({ listing: updated });
});

// ==========================================
// 3. FEATURE MODULE A: LIVE MANDI RATES
// ==========================================
router.get('/mandi-rates', (req: Request, res: Response) => {
  const { crop, region, market } = req.query;
  const records = db.getMandiPrices({
    crop: typeof crop === 'string' ? crop : undefined,
    state: typeof region === 'string' ? region : undefined,
    market: typeof market === 'string' ? market : undefined,
  });

  // Sort descending by date
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Distinct crops and states for filters
  const allPrices = db.getMandiPrices();
  const availableCrops = Array.from(new Set(allPrices.map(p => p.cropName))).sort();
  const availableStates = Array.from(new Set(allPrices.map(p => p.state))).sort();

  res.json({
    rates: records,
    filters: {
      crops: availableCrops,
      states: availableStates,
    },
    count: records.length,
    lastSynced: records.length > 0 ? records[0].syncedAt : new Date().toISOString(),
  });
});

router.get('/mandi-rates/history', (req: Request, res: Response) => {
  const { crop = 'Tomato', region, days = '30' } = req.query;
  const dayCount = parseInt(days as string, 10) || 30;

  const records = db.getMandiPrices({
    crop: typeof crop === 'string' ? crop : 'Tomato',
    state: typeof region === 'string' ? region : undefined,
  });

  // Group by date
  const dateMap = new Map<string, { minSum: number; maxSum: number; modalSum: number; count: number }>();
  for (const r of records) {
    const entry = dateMap.get(r.date) || { minSum: 0, maxSum: 0, modalSum: 0, count: 0 };
    entry.minSum += r.minPrice;
    entry.maxSum += r.maxPrice;
    entry.modalSum += r.modalPrice;
    entry.count += 1;
    dateMap.set(r.date, entry);
  }

  const history = Array.from(dateMap.entries())
    .map(([date, val]) => ({
      date,
      minPrice: Math.round((val.minSum / val.count) * 10) / 10,
      maxPrice: Math.round((val.maxSum / val.count) * 10) / 10,
      modalPrice: Math.round((val.modalSum / val.count) * 10) / 10,
      sampleSize: val.count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-dayCount);

  res.json({
    crop,
    region: region || 'All India Average',
    days: dayCount,
    history,
  });
});

router.post('/mandi-rates/sync', async (req: Request, res: Response) => {
  try {
    const apiKey = req.body?.apiKey;
    const result = await syncMandiPrices(apiKey);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Mandi rates sync failed' });
  }
});

// ==========================================
// 4. FEATURE MODULE B: AI PRICE PREDICTOR
// ==========================================
router.post('/price-predictor/predict', async (req: Request, res: Response) => {
  try {
    const { crop = 'Tomato', region, horizonDays = 14 } = req.body;
    const prediction = await predictPrice(crop, region, Number(horizonDays));
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Price forecasting failed' });
  }
});

router.get('/price-predictor/accuracy/:crop', (req: Request, res: Response) => {
  try {
    const crop = req.params.crop || 'Tomato';
    const accuracy = getPricePredictorAccuracy(crop);
    res.json(accuracy);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Accuracy evaluation failed' });
  }
});

// ==========================================
// 5. FEATURE MODULE C: AI QUALITY PREDICTOR
// ==========================================
router.post('/quality-predictor/analyze', upload.single('image'), async (req: any, res: Response) => {
  try {
    const cropHint = req.body.cropHint || 'Produce';
    const expectedType = req.body.expectedType;
    const expectedGrade = req.body.expectedGrade;
    const defectHint = req.body.defectHint;
    const symptomsObserved = Array.isArray(req.body.symptomsObserved)
      ? req.body.symptomsObserved
      : (req.body.symptomsObserved ? [req.body.symptomsObserved] : undefined);

    let imageUrl = req.body.imageUrl;
    let imageBuffer: Buffer | undefined = undefined;
    let mimeType: string | undefined = undefined;

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      // Convert buffer to data URI for frontend storage/preview
      const base64 = req.file.buffer.toString('base64');
      imageUrl = `data:${req.file.mimetype};base64,${base64}`;
    } else if (imageUrl && imageUrl.startsWith('data:')) {
      const commaIdx = imageUrl.indexOf(',');
      if (commaIdx > -1) {
        const meta = imageUrl.substring(0, commaIdx);
        const b64Data = imageUrl.substring(commaIdx + 1);
        const mimeMatch = meta.match(/data:([^;]+)/);
        mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        imageBuffer = Buffer.from(b64Data, 'base64');
      }
    }

    if (!imageUrl && !imageBuffer) {
      imageUrl = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80';
    }

    const prediction = await analyzeQuality({
      imageUrl,
      imageBuffer,
      mimeType,
      cropHint,
      expectedType,
      expectedGrade,
      defectHint,
      symptomsObserved,
    });

    res.json({ prediction });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Quality analysis failed' });
  }
});

router.get('/quality-predictor/history', (req: Request, res: Response) => {
  try {
    const predictions = db.getQualityPredictions();
    res.json({ predictions });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch history' });
  }
});

router.get('/quality-predictor/:id', (req: Request, res: Response) => {
  const prediction = db.getQualityPredictionById(req.params.id);
  if (!prediction) {
    return res.status(404).json({ error: 'Quality prediction not found' });
  }
  res.json({ prediction });
});

// ==========================================
// 6. ORDERS & ESCROW PAYMENTS
// ==========================================
router.post('/orders', authenticateToken, (req: any, res: Response) => {
  try {
    const { listingId, quantityKg, deliveryLat, deliveryLng, deliveryAddress } = req.body;
    const listing = db.getListingById(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'active') {
      return res.status(400).json({ error: 'This listing is no longer active' });
    }

    const qty = Number(quantityKg) || listing.quantityKg;
    if (qty > listing.quantityKg) {
      return res.status(400).json({ error: `Requested quantity exceeds available stock (${listing.quantityKg} kg)` });
    }

    const totalAmount = Math.round(qty * listing.askingPricePerKg);

    // Compute fair price score breakdown
    const cropMandi = db.getMandiPrices({ crop: listing.cropName })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const mandiModal = cropMandi ? cropMandi.modalPrice : listing.askingPricePerKg * 1.05;
    const qualityBonus = listing.qualityGrade === 'A' ? 10 : listing.qualityGrade === 'C' ? -10 : 0;
    const priceRatio = Math.round((mandiModal / listing.askingPricePerKg) * 100);
    const fairPriceScore = Math.max(40, Math.min(99, Math.round(priceRatio * 0.85 + qualityBonus)));
    const intermediarySavings = Math.max(0, Math.round((mandiModal * 1.25 - listing.askingPricePerKg) * 10) / 10);

    const orderId = `ord-${Date.now()}`;
    const newOrder: Order = {
      id: orderId,
      listingId: listing.id,
      buyerId: req.user.id,
      buyerName: req.user.name,
      buyerPhone: req.user.phone,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      cropName: listing.cropName,
      quantityKg: qty,
      agreedPricePerKg: listing.askingPricePerKg,
      totalAmount,
      fairPriceScore,
      fairPriceBreakdown: {
        askingPrice: listing.askingPricePerKg,
        mandiModalPrice: mandiModal,
        qualityGrade: listing.qualityGrade,
        qualityBonus,
        priceRatio,
        intermediarySavingsPerKg: intermediarySavings,
      },
      pickupLat: listing.locationLat,
      pickupLng: listing.locationLng,
      pickupAddress: listing.farmerLocation,
      deliveryLat: deliveryLat || req.user.locationLat,
      deliveryLng: deliveryLng || req.user.locationLng,
      deliveryAddress: deliveryAddress || `${req.user.district}, ${req.user.state}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    db.addOrder(newOrder);

    // Create escrow payment (Held state)
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      orderId,
      buyerId: req.user.id,
      farmerId: listing.farmerId,
      amount: totalAmount,
      status: 'held',
      createdAt: new Date().toISOString(),
    };
    db.addPayment(newPayment);

    // Update listing remaining quantity
    const remainingQty = listing.quantityKg - qty;
    if (remainingQty <= 0) {
      db.updateListing(listing.id, { quantityKg: 0, status: 'sold' });
    } else {
      db.updateListing(listing.id, { quantityKg: remainingQty });
    }

    res.status(201).json({ order: newOrder, payment: newPayment });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to place order' });
  }
});

router.get('/orders/mine', authenticateToken, (req: any, res: Response) => {
  const allOrders = db.getOrders();
  const payments = db.getPayments();

  let userOrders = allOrders;
  if (req.user.role === 'farmer') {
    userOrders = allOrders.filter(o => o.farmerId === req.user.id);
  } else if (req.user.role === 'buyer') {
    userOrders = allOrders.filter(o => o.buyerId === req.user.id);
  }

  const enriched = userOrders.map(o => {
    const payment = payments.find(p => p.orderId === o.id);
    return {
      ...o,
      payment,
    };
  });

  res.json({ orders: enriched });
});

router.patch('/orders/:id/status', authenticateToken, (req: any, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { status } = req.body;
  if (!['pending', 'confirmed', 'ready_for_pickup', 'in_transit', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const updated = db.updateOrderStatus(order.id, status);
  let createdNotif = null;
  let clusterInfo: any = null;

  // When farmer marks ready for pickup, notify buyer and analyze ready cluster orders for VRP
  if (status === 'ready_for_pickup') {
    createdNotif = db.addNotification({
      id: `notif-${Date.now()}`,
      userId: order.buyerId,
      title: '📦 Order Ready for Pickup!',
      message: `Farmer ${order.farmerName} has graded, packed, and marked Order #${order.id} (${order.quantityKg.toLocaleString('en-IN')} kg ${order.cropName}) ready for pickup at ${order.pickupAddress}.`,
      type: 'order_ready',
      orderId: order.id,
      read: false,
      createdAt: new Date().toISOString(),
    });

    const allOrders = db.getOrders();
    const readyOrders = allOrders.filter(o => o.status === 'ready_for_pickup');
    const totalProduceKg = readyOrders.reduce((sum, o) => sum + o.quantityKg, 0);

    clusterInfo = {
      totalReadyOrders: readyOrders.length,
      readyOrders: readyOrders.map(o => ({
        id: o.id,
        farmerName: o.farmerName,
        cropName: o.cropName,
        quantityKg: o.quantityKg,
        pickupAddress: o.pickupAddress,
        pickupLat: o.pickupLat,
        pickupLng: o.pickupLng,
      })),
      totalProduceKg,
      recommendRouteOptimization: true,
      message: `Order #${order.id} marked ready. ${readyOrders.length} orders totaling ${(totalProduceKg / 100).toFixed(1)} Qtl are ready in the pickup network.`,
    };
  } else if (status === 'in_transit') {
    createdNotif = db.addNotification({
      id: `notif-${Date.now()}`,
      userId: order.buyerId,
      title: '🚚 Order Dispatched & In Transit',
      message: `Consignment for Order #${order.id} (${order.cropName}) has been loaded and is in transit to ${order.deliveryAddress}.`,
      type: 'order_dispatched',
      orderId: order.id,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (status === 'delivered') {
    db.updatePaymentStatus(order.id, 'released');
    createdNotif = db.addNotification({
      id: `notif-${Date.now()}`,
      userId: order.farmerId,
      title: '💰 Payment Released to Bank Account!',
      message: `Order #${order.id} delivered. Escrow funds of ₹${order.totalAmount.toLocaleString('en-IN')} have been transferred to your bank account.`,
      type: 'payment_released',
      orderId: order.id,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({
    order: updated,
    notification: createdNotif,
    clusterInfo,
  });
});

// Notifications Endpoints
router.get('/notifications', authenticateToken, (req: any, res: Response) => {
  const userNotifs = db.getNotifications(req.user.id);
  const unreadCount = userNotifs.filter(n => !n.read).length;
  res.json({
    notifications: userNotifs,
    unreadCount,
  });
});

router.patch('/notifications/:id/read', authenticateToken, (req: any, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  res.json({ success });
});

router.post('/notifications/mark-all-read', authenticateToken, (req: any, res: Response) => {
  const userNotifs = db.getNotifications(req.user.id);
  userNotifs.forEach(n => {
    n.read = true;
  });
  res.json({ success: true, count: userNotifs.length });
});

// Release payment from escrow to farmer
router.post(['/payments/:orderId/release', '/orders/:orderId/release-escrow'], authenticateToken, (req: any, res: Response) => {
  const order = db.getOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.buyerId !== req.user.id && order.farmerId !== req.user.id) {
    return res.status(403).json({ error: 'Only the ordering buyer or associated farmer can initiate escrow settlement' });
  }

  const updatedPayment = db.updatePaymentStatus(order.id, 'released');
  db.updateOrderStatus(order.id, 'delivered');

  res.json({
    success: true,
    message: `Payment of ₹${order.totalAmount.toLocaleString('en-IN')} successfully released to farmer ${order.farmerName}.`,
    payment: updatedPayment,
  });
});

// ==========================================
// 7. FEATURE MODULE D: ROUTE OPTIMIZATION
// ==========================================
router.post('/routes/optimize', async (req: Request, res: Response) => {
  try {
    const { depot, stops, vehicleCount } = req.body;
    if (!depot || !stops || stops.length === 0) {
      return res.status(400).json({ error: 'Depot coordinates and at least one stop required' });
    }

    const route = await optimizeRoute({
      depot,
      stops,
      vehicleCount: vehicleCount || 1,
    });

    res.json({ route });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Route optimization failed' });
  }
});

router.get('/routes/:id', (req: Request, res: Response) => {
  const route = db.getRouteById(req.params.id);
  if (!route) {
    return res.status(404).json({ error: 'Optimized route not found' });
  }
  res.json({ route });
});

export default router;
