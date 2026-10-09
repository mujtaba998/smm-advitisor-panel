import { GoogleGenAI, Type } from '@google/genai';
import { db } from './db.ts';
import type { AIRecommendationRequest, AIRecommendationResponse } from '../types/index.ts';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export async function getSmartServiceRecommendation(
  req: AIRecommendationRequest
): Promise<AIRecommendationResponse> {
  const activeServices = db.getServices(false).filter((s) => s.status === 'active');
  const platformServices = activeServices.filter((s) =>
    s.platform.toLowerCase().includes(req.platform.toLowerCase()) ||
    s.category.toLowerCase().includes(req.platform.toLowerCase())
  );

  const candidatePool = platformServices.length > 0 ? platformServices : activeServices;

  // Summarize available services for Gemini prompt with PKR pricing
  const servicesContext = candidatePool.map((s) => ({
    id: s.service,
    name: s.name,
    category: s.category,
    platform: s.platform,
    ratePer1kPkr: s.rate, // in PKR
    min: s.min,
    max: s.max,
    refill: s.refill,
    qualityBadge: s.qualityBadge,
    description: s.description,
  }));

  const prompt = `
You are the "SMM Smart Advisor AI", an elite social media growth strategist and SMM panel algorithm specialist for Pakistan & global users.
Analyze the user's specific growth goal and select the absolute BEST matching service ID from the available catalog. All prices are in Pakistani Rupees (PKR / Rs).

User Requirements:
- Target Platform: ${req.platform}
- Target Goal: ${req.goal} (e.g. Fast engagement, High retention, Organic reach, Reseller profit, Viral push)
- Target Budget: ${req.targetBudget ? 'Rs ' + req.targetBudget + ' PKR' : 'Not specified'}
- Quantity Needed: ${req.quantityNeeded || 'Not specified'}
- Additional Notes: ${req.additionalNotes || 'None'}

Catalog of Available Active Services (All rates in PKR / Rs per 1,000 units):
${JSON.stringify(servicesContext, null, 2)}

Instructions:
1. Pick the ONE most optimal service ID from the catalog that best satisfies the user's goal with optimal quality, safety, and price efficiency.
2. Provide a compelling, professional explanation justifying why this service is superior for their goal.
3. List 3 key tactical advantages / pros.
4. Provide estimated delivery speed and retention quality.
5. Provide 1 actionable strategic tip for maximum organic algorithmic leverage.
`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are SMM Smart Advisor AI. Currency is Pakistani Rupees (PKR / Rs). Always return your recommendation strictly as JSON matching the requested schema. Never invent an ID not present in the catalog.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedServiceId: {
              type: Type.INTEGER,
              description: 'The exact numeric service ID from the provided catalog.',
            },
            serviceName: {
              type: Type.STRING,
              description: 'The exact name of the recommended service.',
            },
            platform: {
              type: Type.STRING,
              description: 'The platform name.',
            },
            pricePerK: {
              type: Type.NUMBER,
              description: 'The rate in PKR per 1000 units from the service.',
            },
            min: {
              type: Type.INTEGER,
              description: 'Min order limit.',
            },
            max: {
              type: Type.INTEGER,
              description: 'Max order limit.',
            },
            reason: {
              type: Type.STRING,
              description: 'Detailed explanation of why this service is the best choice for the goal.',
            },
            expectedSpeed: {
              type: Type.STRING,
              description: 'Expected delivery speed, e.g. 5,000 - 20,000 / day.',
            },
            retentionQuality: {
              type: Type.STRING,
              description: 'Retention rate and drop protection status.',
            },
            pros: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Three key pros or advantages.',
            },
            strategicTip: {
              type: Type.STRING,
              description: 'Strategic tip for highest conversion and algorithmic safety.',
            },
          },
          required: [
            'recommendedServiceId',
            'serviceName',
            'platform',
            'pricePerK',
            'min',
            'max',
            'reason',
            'expectedSpeed',
            'retentionQuality',
            'pros',
            'strategicTip',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    // Verify recommended service exists in db
    const verifiedService = candidatePool.find((s) => s.service === parsed.recommendedServiceId);
    if (verifiedService) {
      parsed.serviceName = verifiedService.name;
      parsed.pricePerK = verifiedService.rate;
      parsed.min = verifiedService.min;
      parsed.max = verifiedService.max;
      parsed.platform = verifiedService.platform;
    } else if (candidatePool.length > 0) {
      const fallback = candidatePool[0];
      parsed.recommendedServiceId = fallback.service;
      parsed.serviceName = fallback.name;
      parsed.pricePerK = fallback.rate;
      parsed.min = fallback.min;
      parsed.max = fallback.max;
      parsed.platform = fallback.platform;
    }

    return parsed as AIRecommendationResponse;
  } catch (err: any) {
    console.error('Gemini Smart Advisor Error:', err);

    // Fallback heuristic recommendation in PKR
    const topMatch = candidatePool[0] || activeServices[0];
    return {
      recommendedServiceId: topMatch.service,
      serviceName: topMatch.name,
      platform: topMatch.platform,
      pricePerK: topMatch.rate,
      min: topMatch.min,
      max: topMatch.max,
      reason: `Selected as the top-performing service for ${req.platform} optimized for ${req.goal}. It features direct algorithmic engagement signals and high retention delivery in Pakistan & worldwide.`,
      expectedSpeed: 'Fast (10,000 - 50,000 / Day)',
      retentionQuality: topMatch.refill ? 'Refill Protected / Non-Drop' : 'Standard Organic Retention',
      pros: [
        'Guaranteed fast start within 0-60 minutes',
        'Natural delivery pacing safe for account trust score',
        'Directly improves explore & search ranking',
      ],
      strategicTip:
        'For optimal reach, post during peak audience activity (7 PM - 11 PM PKT) and submit your order immediately to stimulate algorithmic momentum in the first 2 hours.',
    };
  }
}
