export interface SalesOrder {
  id: string;
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number;
  revenue: number;
}

export interface RegionQuarterMatrix {
  region: string;
  quarterRevenues: Record<string, number>;
  totalRevenue: number;
  q2Revenue: number;
  q3Revenue: number;
  revenueChange: number; // Q3 - Q2
  percentageChange: number; // ((Q3 - Q2) / Q2) * 100
  absoluteRevenueChange: number; // |Q3 - Q2|
}

export interface DriverBreakdown {
  name: string;
  q2Revenue: number;
  q3Revenue: number;
  revenueChange: number;
  percentageChange: number;
}

export interface RegionDrivers {
  region: string;
  q2Units: number;
  q3Units: number;
  unitsChange: number;
  unitsPercentageChange: number;
  q2AvgDiscount: number;
  q3AvgDiscount: number;
  discountChangePoints: number;
  topProductDriver?: {
    product: string;
    revenueChange: number;
    q2Revenue: number;
    q3Revenue: number;
  };
  topChannelDriver?: {
    channel: string;
    revenueChange: number;
    q2Revenue: number;
    q3Revenue: number;
  };
  productBreakdown: DriverBreakdown[];
  channelBreakdown: DriverBreakdown[];
}

export interface CalculatedAnalysis {
  quarters: string[];
  regions: string[];
  matrix: RegionQuarterMatrix[];
  quarterTotals: Record<string, number>;
  grandTotalRevenue: number;
  hasQ2AndQ3: boolean;
  q2Key: string;
  q3Key: string;
  mostChangedRegion: RegionQuarterMatrix | null;
  mostChangedByPercentage: RegionQuarterMatrix | null;
  driversForMostChanged: RegionDrivers | null;
}

export interface AiSummaryResponse {
  summary: string;
  source: string;
  isCalculated: boolean;
  warning?: string;
}
