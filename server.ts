import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

function formatUSD(val: number): string {
  const hasDecimals = Math.abs(val % 1) > 0.005;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatPct(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

// Fallback generator if Gemini API key is missing or offline
function generateDeterministicThreeSentences(data: any): string {
  const { mostChangedRegion, regionDrivers } = data;
  const reg = mostChangedRegion.region;
  const q2Rev = formatUSD(mostChangedRegion.q2Revenue);
  const q3Rev = formatUSD(mostChangedRegion.q3Revenue);
  const absDiff = formatUSD(Math.abs(mostChangedRegion.revenueChange));
  const pctDiff = formatPct(mostChangedRegion.percentageChange);
  const direction = mostChangedRegion.revenueChange >= 0 ? 'growth' : 'contraction';
  const dirWord = mostChangedRegion.revenueChange >= 0 ? 'increased' : 'declined';

  // Sentence 1: Region, Q2, Q3, delta & %
  const sentence1 = `${reg} experienced the greatest revenue change between Q2 and Q3, shifting from ${q2Rev} to ${q3Rev}, representing a ${absDiff} (${pctDiff}) ${direction}.`;

  // Sentence 2: Units and top product driver
  let sentence2 = '';
  if (regionDrivers?.topProductDriver) {
    const topProd = regionDrivers.topProductDriver;
    const prodDiff = formatUSD(Math.abs(topProd.revenueChange));
    const prodDir = topProd.revenueChange >= 0 ? 'gained' : 'declined by';
    sentence2 = `This shift was primarily driven by regional unit volume changing from ${regionDrivers.q2Units.toLocaleString()} to ${regionDrivers.q3Units.toLocaleString()} units, led by ${topProd.product} which ${prodDir} ${prodDiff} in quarterly revenue.`;
  } else {
    sentence2 = `This shift was primarily driven by total units sold moving from ${regionDrivers.q2Units.toLocaleString()} in Q2 to ${regionDrivers.q3Units.toLocaleString()} in Q3.`;
  }

  // Sentence 3: Channel and discount
  let sentence3 = '';
  if (regionDrivers?.topChannelDriver) {
    const topChan = regionDrivers.topChannelDriver;
    const chanDiff = formatUSD(Math.abs(topChan.revenueChange));
    const chanDir = topChan.revenueChange >= 0 ? 'expanding by' : 'contracting by';
    sentence3 = `Concurrently, the ${topChan.channel} channel accounted for the largest channel movement by ${chanDir} ${chanDiff}, alongside an average discount rate shift from ${regionDrivers.q2AvgDiscount.toFixed(1)}% to ${regionDrivers.q3AvgDiscount.toFixed(1)}%.`;
  } else {
    sentence3 = `Furthermore, the regional average discount rate moved from ${regionDrivers.q2AvgDiscount.toFixed(1)}% in Q2 to ${regionDrivers.q3AvgDiscount.toFixed(1)}% in Q3.`;
  }

  return `${sentence1} ${sentence2} ${sentence3}`;
}

app.post('/api/generate-summary', async (req, res) => {
  try {
    const { mostChangedRegion, allRegions, regionDrivers } = req.body;

    if (!mostChangedRegion || !regionDrivers) {
      return res.status(400).json({ error: 'Missing calculation data for regional summary' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Generating fallback 3-sentence summary using verified calculations.');
      const fallbackText = generateDeterministicThreeSentences({ mostChangedRegion, regionDrivers });
      return res.json({
        summary: fallbackText,
        source: 'deterministic-fallback',
        isCalculated: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contextPayload = {
      mostChangedRegion: {
        region: mostChangedRegion.region,
        q2Revenue: formatUSD(mostChangedRegion.q2Revenue),
        q3Revenue: formatUSD(mostChangedRegion.q3Revenue),
        rawRevenueChange: formatUSD(mostChangedRegion.revenueChange),
        absoluteRevenueChange: formatUSD(Math.abs(mostChangedRegion.revenueChange)),
        percentageChange: formatPct(mostChangedRegion.percentageChange),
        direction: mostChangedRegion.revenueChange >= 0 ? 'increase' : 'decrease',
      },
      comparativeRegionsQ2toQ3: allRegions.map((r: any) => ({
        region: r.region,
        q2Revenue: formatUSD(r.q2Revenue),
        q3Revenue: formatUSD(r.q3Revenue),
        revenueChange: formatUSD(r.revenueChange),
        percentageChange: formatPct(r.percentageChange),
      })),
      driversForMostChangedRegion: {
        q2Units: regionDrivers.q2Units.toLocaleString(),
        q3Units: regionDrivers.q3Units.toLocaleString(),
        unitsChange: (regionDrivers.q3Units - regionDrivers.q2Units).toLocaleString(),
        q2AvgDiscountPct: `${regionDrivers.q2AvgDiscount.toFixed(1)}%`,
        q3AvgDiscountPct: `${regionDrivers.q3AvgDiscount.toFixed(1)}%`,
        discountPctPointChange: `${(regionDrivers.q3AvgDiscount - regionDrivers.q2AvgDiscount > 0 ? '+' : '')}${(regionDrivers.q3AvgDiscount - regionDrivers.q2AvgDiscount).toFixed(1)}%`,
        productBreakdown: regionDrivers.productBreakdown?.map((p: any) => ({
          product: p.product,
          q2Revenue: formatUSD(p.q2Revenue),
          q3Revenue: formatUSD(p.q3Revenue),
          revenueChange: formatUSD(p.revenueChange),
        })),
        channelBreakdown: regionDrivers.channelBreakdown?.map((c: any) => ({
          channel: c.channel,
          q2Revenue: formatUSD(c.q2Revenue),
          q3Revenue: formatUSD(c.q3Revenue),
          revenueChange: formatUSD(c.revenueChange),
        })),
      },
    };

    const prompt = `You are an elite corporate revenue intelligence analyst.
Write an executive summary of which region changed the most in revenue from Q2 to Q3, and why.

CRITICAL RULES:
1. You MUST write EXACTLY THREE SENTENCES. Not two, not four, exactly three.
2. You MUST strictly use ONLY the exact calculated numbers provided in the input below. DO NOT invent, assume, estimate, round differently, or hallucinate any numbers or external market events.
3. Sentence structure:
   - Sentence 1: Identify the region that changed the most from Q2 to Q3, citing its exact Q2 revenue, Q3 revenue, absolute dollar change, and percentage change.
   - Sentence 2: Explain the primary driver behind this shift using the calculated units sold change and the leading product revenue changes provided.
   - Sentence 3: Explain the secondary driver using the calculated channel shifts or average discount rate changes provided.

INPUT CALCULATIONS:
${JSON.stringify(contextPayload, null, 2)}
`;

    let response: any = null;
    let lastError: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an executive sales intelligence analyst. You write exactly three clear, professional sentences using only provided calculated numbers.',
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        // Wait 500ms before retrying
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (!response?.text && lastError) {
      throw lastError;
    }

    const summaryText = response?.text?.trim() || generateDeterministicThreeSentences({ mostChangedRegion, regionDrivers });

    res.json({
      summary: summaryText,
      source: 'gemini-3.8-flash',
      isCalculated: true,
    });
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    // Provide graceful fallback with verified calculations so UI is seamless
    const fallbackText = generateDeterministicThreeSentences(req.body);
    res.json({
      summary: fallbackText,
      source: 'deterministic-fallback',
      isCalculated: true,
      warning: 'Fallback generated due to service error: ' + (error?.message || 'Unknown error'),
    });
  }
});

// Setup dev server with Vite or production static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Sales Pulse server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
