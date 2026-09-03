import { db } from '../db/database';
import { OptimizedRoute, RouteStop } from '../../src/types';

export interface RouteRequestStop {
  orderId: string;
  lat: number;
  lng: number;
  farmerName?: string;
  cropName?: string;
  quantityKg?: number;
  address?: string;
}

export interface RouteOptimizeParams {
  depot: {
    lat: number;
    lng: number;
    name?: string;
  };
  stops: RouteRequestStop[];
  vehicleCount?: number;
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function optimizeRoute(params: RouteOptimizeParams): Promise<OptimizedRoute> {
  const { depot, stops, vehicleCount = 1 } = params;

  if (!stops || stops.length === 0) {
    throw new Error('At least one stop is required for route optimization.');
  }

  const allPoints = [
    { lat: depot.lat, lng: depot.lng, label: 'Depot' },
    ...stops.map((s, idx) => ({ lat: s.lat, lng: s.lng, label: `Stop ${idx + 1}` })),
  ];

  const n = allPoints.length;
  // Initialize distance and duration matrices
  let distMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  let durMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  let osrmSucceeded = false;
  try {
    // Construct coordinate string: lon,lat;lon,lat;...
    const coordsParam = allPoints.map(p => `${p.lng},${p.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/table/v1/driving/${coordsParam}?annotations=distance,duration`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.distances && data.durations) {
        distMatrix = data.distances.map((row: number[]) => row.map(d => (d || 0) / 1000)); // meters to km
        durMatrix = data.durations.map((row: number[]) => row.map(d => (d || 0) / 60)); // seconds to minutes
        osrmSucceeded = true;
      }
    }
  } catch (err) {
    console.warn('OSRM distance matrix unavailable, falling back to Road-Wind Haversine calculation:', err);
  }

  // Fallback distance calculation using Haversine with 1.35x road circuity factor
  if (!osrmSucceeded) {
    const ROAD_FACTOR = 1.35;
    const AVG_SPEED_KMH = 45; // average rural/highway commercial speed

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          distMatrix[i][j] = 0;
          durMatrix[i][j] = 0;
        } else {
          const directDist = haversineDistanceKm(
            allPoints[i].lat,
            allPoints[i].lng,
            allPoints[j].lat,
            allPoints[j].lng
          );
          const roadDist = Math.max(0.5, directDist * ROAD_FACTOR);
          distMatrix[i][j] = roadDist;
          durMatrix[i][j] = (roadDist / AVG_SPEED_KMH) * 60; // minutes
        }
      }
    }
  }

  // Solve Traveling Salesperson / Vehicle Routing Problem using Nearest Neighbor + 2-Opt Heuristic
  // Depot index is 0
  const stopIndices = Array.from({ length: stops.length }, (_, i) => i + 1);

  // 1. Greedy Nearest Neighbor
  let unvisited = new Set(stopIndices);
  let current = 0;
  const tour: number[] = [0];

  while (unvisited.size > 0) {
    let nearest = -1;
    let minDist = Infinity;
    for (const candidate of unvisited) {
      if (distMatrix[current][candidate] < minDist) {
        minDist = distMatrix[current][candidate];
        nearest = candidate;
      }
    }
    if (nearest !== -1) {
      tour.push(nearest);
      unvisited.delete(nearest);
      current = nearest;
    }
  }
  // Return to depot
  tour.push(0);

  // 2. 2-Opt Optimization for tour untangling
  let improved = true;
  let iterations = 0;
  while (improved && iterations < 50) {
    improved = false;
    iterations++;
    for (let i = 1; i < tour.length - 2; i++) {
      for (let j = i + 1; j < tour.length - 1; j++) {
        const dCurrent = distMatrix[tour[i - 1]][tour[i]] + distMatrix[tour[j]][tour[j + 1]];
        const dSwapped = distMatrix[tour[i - 1]][tour[j]] + distMatrix[tour[i]][tour[j + 1]];
        if (dSwapped < dCurrent - 0.01) {
          // Reverse segment between i and j
          const segment = tour.slice(i, j + 1).reverse();
          tour.splice(i, j - i + 1, ...segment);
          improved = true;
        }
      }
    }
  }

  // Calculate naive separate round-trip distance (Depot -> Stop_i -> Depot for each i)
  let naiveTotalDistance = 0;
  for (const sIdx of stopIndices) {
    naiveTotalDistance += (distMatrix[0][sIdx] + distMatrix[sIdx][0]);
  }

  // Build the sequenced stops manifest
  const routeStops: RouteStop[] = [];
  let cumulativeDistance = 0;
  let cumulativeTimeMin = 0;
  const routeId = `route-${Date.now()}`;

  // Geometry points for polyline
  const geometry: [number, number][] = [[depot.lat, depot.lng]];

  // Tour has 0, s1, s2, ..., 0
  for (let step = 1; step < tour.length - 1; step++) {
    const prevIdx = tour[step - 1];
    const currIdx = tour[step];
    const stopData = stops[currIdx - 1];

    const segmentDist = distMatrix[prevIdx][currIdx];
    const segmentTime = durMatrix[prevIdx][currIdx];

    cumulativeDistance += segmentDist;
    cumulativeTimeMin += segmentTime + 15; // 15 mins pickup loading buffer

    routeStops.push({
      id: `stop-${routeId}-${step}`,
      routeId,
      orderId: stopData.orderId,
      sequenceNumber: step,
      etaMinutes: Math.round(cumulativeTimeMin),
      distanceFromPreviousKm: Math.round(segmentDist * 10) / 10,
      stopLat: stopData.lat,
      stopLng: stopData.lng,
      farmerName: stopData.farmerName || `Farmer Stop ${step}`,
      cropName: stopData.cropName || 'Produce',
      quantityKg: stopData.quantityKg || 500,
      address: stopData.address || `Farm Gate Waypoint #${step}`,
    });

    geometry.push([stopData.lat, stopData.lng]);
  }

  // Final leg back to depot
  const lastStopIdx = tour[tour.length - 2];
  const returnDist = distMatrix[lastStopIdx][0];
  const returnTime = durMatrix[lastStopIdx][0];
  cumulativeDistance += returnDist;
  cumulativeTimeMin += returnTime;
  geometry.push([depot.lat, depot.lng]);

  const totalDistanceKm = Math.round(cumulativeDistance * 10) / 10;
  const totalDurationMin = Math.round(cumulativeTimeMin);
  const distanceSavedKm = Math.max(0, Math.round((naiveTotalDistance - totalDistanceKm) * 10) / 10);
  
  // Diesel truck emission ~0.27 kg CO2 per km
  const carbonSavedKg = Math.round(distanceSavedKm * 0.27 * 10) / 10;
  const totalProduceKg = stops.reduce((sum, s) => sum + (s.quantityKg || 0), 0);

  const optimizedRoute: OptimizedRoute = {
    id: routeId,
    depotLat: depot.lat,
    depotLng: depot.lng,
    depotName: depot.name || 'Central Agricultural Aggregation Hub',
    totalDistanceKm,
    totalDurationMin,
    vehicleCount,
    stopsCount: stops.length,
    totalProduceKg,
    distanceSavedKm,
    carbonSavedKg,
    geometry,
    stops: routeStops,
    createdAt: new Date().toISOString(),
  };

  db.addRoute(optimizedRoute);
  return optimizedRoute;
}
