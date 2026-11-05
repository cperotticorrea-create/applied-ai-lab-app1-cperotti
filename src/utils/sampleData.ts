import { SalesOrder } from '../types';

export const SAMPLE_CSV_CONTENT = `quarter,region,channel,product,units,discount_pct,revenue
Q1,North America,Enterprise Direct,CloudCore Platform,1850,0.12,370000
Q1,North America,Online Portal,Apex Analytics,3200,0.08,240000
Q1,North America,Channel Partners,Security Shield,1400,0.15,140000
Q1,Europe,Enterprise Direct,CloudCore Platform,1400,0.10,280000
Q1,Europe,Online Portal,Apex Analytics,2800,0.05,210000
Q1,Europe,Retail Systems,DataSphere AI,800,0.18,96000
Q1,Asia-Pacific,Online Portal,Apex Analytics,2100,0.10,157500
Q1,Asia-Pacific,Channel Partners,Security Shield,1100,0.15,110000
Q1,Latin America,Enterprise Direct,CloudCore Platform,750,0.15,150000
Q1,Latin America,Online Portal,Apex Analytics,400,0.05,30000
Q2,North America,Enterprise Direct,CloudCore Platform,2100,0.12,420000
Q2,North America,Online Portal,Apex Analytics,3600,0.08,270000
Q2,North America,Channel Partners,Security Shield,1300,0.15,130000
Q2,Europe,Enterprise Direct,CloudCore Platform,1600,0.10,320000
Q2,Europe,Online Portal,Apex Analytics,2950,0.06,221250
Q2,Europe,Retail Systems,DataSphere AI,820,0.18,98750
Q2,Asia-Pacific,Enterprise Direct,CloudCore Platform,900,0.15,180000
Q2,Asia-Pacific,Online Portal,Apex Analytics,1200,0.14,90000
Q2,Asia-Pacific,Channel Partners,Security Shield,500,0.15,50000
Q2,Latin America,Enterprise Direct,CloudCore Platform,700,0.15,140000
Q2,Latin America,Online Portal,Apex Analytics,667,0.05,50000
Q3,North America,Enterprise Direct,CloudCore Platform,2150,0.12,430000
Q3,North America,Online Portal,Apex Analytics,3800,0.08,285000
Q3,North America,Channel Partners,Security Shield,1600,0.15,160000
Q3,Europe,Enterprise Direct,CloudCore Platform,1500,0.10,300000
Q3,Europe,Online Portal,Apex Analytics,2800,0.06,210000
Q3,Europe,Retail Systems,DataSphere AI,833,0.18,100000
Q3,Asia-Pacific,Enterprise Direct,CloudCore Platform,2100,0.08,420000
Q3,Asia-Pacific,Online Portal,Apex Analytics,1500,0.08,112500
Q3,Asia-Pacific,Channel Partners,Security Shield,525,0.09,52500
Q3,Latin America,Enterprise Direct,CloudCore Platform,850,0.15,170000
Q3,Latin America,Online Portal,Apex Analytics,867,0.05,65000
Q4,North America,Enterprise Direct,CloudCore Platform,2400,0.12,480000
Q4,North America,Online Portal,Apex Analytics,4200,0.08,315000
Q4,North America,Channel Partners,Security Shield,1800,0.15,180000
Q4,Europe,Enterprise Direct,CloudCore Platform,1700,0.10,340000
Q4,Europe,Online Portal,Apex Analytics,3100,0.06,232500
Q4,Europe,Retail Systems,DataSphere AI,900,0.18,108000
Q4,Asia-Pacific,Enterprise Direct,CloudCore Platform,2300,0.08,460000
Q4,Asia-Pacific,Online Portal,Apex Analytics,1700,0.08,127500
Q4,Asia-Pacific,Channel Partners,Security Shield,600,0.09,60000
Q4,Latin America,Enterprise Direct,CloudCore Platform,950,0.15,190000
Q4,Latin America,Online Portal,Apex Analytics,950,0.05,71250`;

export function getSampleOrders(): SalesOrder[] {
  const lines = SAMPLE_CSV_CONTENT.trim().split('\n');
  const headers = lines[0].split(',');
  const orders: SalesOrder[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 7) {
      orders.push({
        id: `sample-${i}`,
        quarter: parts[0].trim(),
        region: parts[1].trim(),
        channel: parts[2].trim(),
        product: parts[3].trim(),
        units: parseFloat(parts[4]) || 0,
        discount_pct: parseFloat(parts[5]) || 0,
        revenue: parseFloat(parts[6]) || 0,
      });
    }
  }

  return orders;
}
