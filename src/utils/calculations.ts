import {
  CalculatedAnalysis,
  DriverBreakdown,
  RegionDrivers,
  RegionQuarterMatrix,
  SalesOrder,
} from '../types';
import { normalizeQuarterName, normalizeRegionName } from './csvParser';

export function calculateRegionalAnalysis(orders: SalesOrder[]): CalculatedAnalysis {
  if (!orders || orders.length === 0) {
    return {
      quarters: [],
      regions: [],
      matrix: [],
      quarterTotals: {},
      grandTotalRevenue: 0,
      hasQ2AndQ3: false,
      q2Key: '',
      q3Key: '',
      mostChangedRegion: null,
      mostChangedByPercentage: null,
      driversForMostChanged: null,
    };
  }

  // Extract unique quarters and regions (with case normalization so "West" and "west" are unified)
  const rawQuarters = Array.from(new Set(orders.map((o) => normalizeQuarterName(o.quarter))));
  const rawRegions = Array.from(new Set(orders.map((o) => normalizeRegionName(o.region))));

  // Helper to sort quarters chronologically (Q1, Q2, Q3, Q4, or year-quarter)
  const quarterOrderWeight = (q: string): number => {
    const qLower = q.toLowerCase();
    const match = qLower.match(/q([1-4])/);
    if (match) {
      const yearMatch = qLower.match(/\b(20\d\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) * 10 : 20200;
      return year + parseInt(match[1], 10);
    }
    return 99999;
  };

  const quarters = [...rawQuarters].sort((a, b) => quarterOrderWeight(a) - quarterOrderWeight(b));
  const regions = [...rawRegions].sort((a, b) => a.localeCompare(b));

  // Identify Q2 and Q3
  const q2Key = quarters.find((q) => /q2\b/i.test(q)) || quarters.find((q) => q.toLowerCase().includes('q2')) || (quarters.length >= 2 ? quarters[1] : '');
  const q3Key = quarters.find((q) => /q3\b/i.test(q)) || quarters.find((q) => q.toLowerCase().includes('q3')) || (quarters.length >= 3 ? quarters[2] : '');
  const hasQ2AndQ3 = Boolean(q2Key && q3Key && q2Key !== q3Key);

  // Group revenues by Region and Quarter
  const regionMap = new Map<string, { [quarter: string]: number }>();
  const quarterTotals: Record<string, number> = {};
  quarters.forEach((q) => {
    quarterTotals[q] = 0;
  });

  regions.forEach((r) => {
    const qMap: Record<string, number> = {};
    quarters.forEach((q) => {
      qMap[q] = 0;
    });
    regionMap.set(r, qMap);
  });

  let grandTotalRevenue = 0;

  orders.forEach((order) => {
    const r = normalizeRegionName(order.region);
    const q = normalizeQuarterName(order.quarter);
    const rev = order.revenue || 0;

    const row = regionMap.get(r);
    if (row && row[q] !== undefined) {
      row[q] += rev;
    }
    if (quarterTotals[q] !== undefined) {
      quarterTotals[q] += rev;
    }
    grandTotalRevenue += rev;
  });

  // Build matrix
  const matrix: RegionQuarterMatrix[] = regions.map((region) => {
    const quarterRevenues = regionMap.get(region) || {};
    let totalRevenue = 0;
    Object.values(quarterRevenues).forEach((v) => {
      totalRevenue += v;
    });

    const q2Revenue = hasQ2AndQ3 ? quarterRevenues[q2Key] || 0 : 0;
    const q3Revenue = hasQ2AndQ3 ? quarterRevenues[q3Key] || 0 : 0;
    const revenueChange = q3Revenue - q2Revenue;
    const absoluteRevenueChange = Math.abs(revenueChange);
    const percentageChange = q2Revenue > 0 ? (revenueChange / q2Revenue) * 100 : 0;

    return {
      region,
      quarterRevenues,
      totalRevenue,
      q2Revenue,
      q3Revenue,
      revenueChange,
      absoluteRevenueChange,
      percentageChange,
    };
  });

  // Determine which region changed most from Q2 to Q3
  let mostChangedRegion: RegionQuarterMatrix | null = null;
  let mostChangedByPercentage: RegionQuarterMatrix | null = null;

  if (hasQ2AndQ3 && matrix.length > 0) {
    // Largest absolute dollar change
    mostChangedRegion = [...matrix].sort(
      (a, b) => b.absoluteRevenueChange - a.absoluteRevenueChange
    )[0];

    // Largest percentage change (where q2 > 0)
    const validPct = matrix.filter((m) => m.q2Revenue > 0);
    if (validPct.length > 0) {
      mostChangedByPercentage = [...validPct].sort(
        (a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange)
      )[0];
    }
  }

  // Calculate drivers for the most changed region
  let driversForMostChanged: RegionDrivers | null = null;

  if (mostChangedRegion && hasQ2AndQ3) {
    driversForMostChanged = calculateDriversForRegion(
      orders,
      mostChangedRegion.region,
      q2Key,
      q3Key
    );
  }

  return {
    quarters,
    regions,
    matrix,
    quarterTotals,
    grandTotalRevenue,
    hasQ2AndQ3,
    q2Key,
    q3Key,
    mostChangedRegion,
    mostChangedByPercentage,
    driversForMostChanged,
  };
}

export function calculateDriversForRegion(
  orders: SalesOrder[],
  targetRegion: string,
  q2Key: string,
  q3Key: string
): RegionDrivers {
  const normTarget = normalizeRegionName(targetRegion).toLowerCase();
  const regionOrders = orders.filter(
    (o) => normalizeRegionName(o.region).toLowerCase() === normTarget
  );

  const q2Orders = regionOrders.filter((o) => normalizeQuarterName(o.quarter) === q2Key);
  const q3Orders = regionOrders.filter((o) => normalizeQuarterName(o.quarter) === q3Key);

  // Units
  const q2Units = q2Orders.reduce((sum, o) => sum + (o.units || 0), 0);
  const q3Units = q3Orders.reduce((sum, o) => sum + (o.units || 0), 0);
  const unitsChange = q3Units - q2Units;
  const unitsPercentageChange = q2Units > 0 ? (unitsChange / q2Units) * 100 : 0;

  // Average discount pct (weighted by revenue or simple average if 0 revenue)
  const calcAvgDiscount = (list: SalesOrder[]): number => {
    if (list.length === 0) return 0;
    const totalRev = list.reduce((sum, o) => sum + o.revenue, 0);
    if (totalRev > 0) {
      const weighted = list.reduce((sum, o) => sum + (o.discount_pct * 100) * o.revenue, 0);
      return weighted / totalRev;
    }
    const simple = list.reduce((sum, o) => sum + (o.discount_pct * 100), 0);
    return simple / list.length;
  };

  const q2AvgDiscount = calcAvgDiscount(q2Orders);
  const q3AvgDiscount = calcAvgDiscount(q3Orders);
  const discountChangePoints = q3AvgDiscount - q2AvgDiscount;

  // Product breakdown
  const allProducts = Array.from(new Set(regionOrders.map((o) => o.product.trim())));
  const productBreakdown: DriverBreakdown[] = allProducts.map((prod) => {
    const q2Rev = q2Orders
      .filter((o) => o.product.trim() === prod)
      .reduce((sum, o) => sum + o.revenue, 0);
    const q3Rev = q3Orders
      .filter((o) => o.product.trim() === prod)
      .reduce((sum, o) => sum + o.revenue, 0);
    const revenueChange = q3Rev - q2Rev;
    const percentageChange = q2Rev > 0 ? (revenueChange / q2Rev) * 100 : 0;
    return {
      name: prod,
      q2Revenue: q2Rev,
      q3Revenue: q3Rev,
      revenueChange,
      percentageChange,
    };
  }).sort((a, b) => Math.abs(b.revenueChange) - Math.abs(a.revenueChange));

  // Channel breakdown
  const allChannels = Array.from(new Set(regionOrders.map((o) => o.channel.trim())));
  const channelBreakdown: DriverBreakdown[] = allChannels.map((chan) => {
    const q2Rev = q2Orders
      .filter((o) => o.channel.trim() === chan)
      .reduce((sum, o) => sum + o.revenue, 0);
    const q3Rev = q3Orders
      .filter((o) => o.channel.trim() === chan)
      .reduce((sum, o) => sum + o.revenue, 0);
    const revenueChange = q3Rev - q2Rev;
    const percentageChange = q2Rev > 0 ? (revenueChange / q2Rev) * 100 : 0;
    return {
      name: chan,
      q2Revenue: q2Rev,
      q3Revenue: q3Rev,
      revenueChange,
      percentageChange,
    };
  }).sort((a, b) => Math.abs(b.revenueChange) - Math.abs(a.revenueChange));

  const topProduct = productBreakdown.length > 0 ? productBreakdown[0] : undefined;
  const topChannel = channelBreakdown.length > 0 ? channelBreakdown[0] : undefined;

  return {
    region: targetRegion,
    q2Units,
    q3Units,
    unitsChange,
    unitsPercentageChange,
    q2AvgDiscount,
    q3AvgDiscount,
    discountChangePoints,
    topProductDriver: topProduct
      ? {
          product: topProduct.name,
          revenueChange: topProduct.revenueChange,
          q2Revenue: topProduct.q2Revenue,
          q3Revenue: topProduct.q3Revenue,
        }
      : undefined,
    topChannelDriver: topChannel
      ? {
          channel: topChannel.name,
          revenueChange: topChannel.revenueChange,
          q2Revenue: topChannel.q2Revenue,
          q3Revenue: topChannel.q3Revenue,
        }
      : undefined,
    productBreakdown,
    channelBreakdown,
  };
}
