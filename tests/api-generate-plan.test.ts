/**
 * @file api-generate-plan.test.ts
 * @description Integration test for plan generation and deterministic CPCB fallback pipeline.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateDeterministicFallbackPlan } from '../src/lib/gemini.ts';
import { UserProfileSchema, AiResponseSchema } from '../src/lib/schemas.ts';
import type { UserProfile, EnvironmentalSnapshot } from '../src/lib/types.ts';

describe('Plan Generation & CPCB Data Pipeline Integration', () => {
  const sampleProfile: UserProfile = {
    city: 'Anand Vihar, New Delhi',
    healthVulnerabilities: ['asthma', 'bronchitis'],
    activityLevel: 'lightly_active',
    hasChildren: true,
    hasElderly: false,
    commuteMode: 'public_transport',
    additionalContext: 'Living near bus terminal',
  };

  it('validates user profile schema correctly', () => {
    const parseResult = UserProfileSchema.safeParse(sampleProfile);
    assert.equal(parseResult.success, true);
  });

  it('generates fully compliant, schema-valid fallback plan grounded in CPCB AQI', () => {
    const mockSnapshot: EnvironmentalSnapshot = {
      status: 'available',
      location: {
        name: 'Anand Vihar',
        region: 'East Delhi',
        latitude: 28.6502,
        longitude: 77.3150,
        isDelhiNcr: true,
      },
      metadata: {
        provider: 'Open-Meteo European Copernicus / CAMS Model',
        model: 'CAMS Global Atmospheric Aerosol',
        dataType: 'model_forecast',
        stationOrCoordinates: 'Anand Vihar (28.6502°N, 77.3150°E)',
        latitude: 28.6502,
        longitude: 77.3150,
        fetchedAt: new Date().toISOString(),
        dataTimestamp: new Date().toISOString(),
        freshnessMinutes: 5,
        isDirectCpcbStation: false,
        disclaimer: 'Modeled atmospheric forecast',
      },
      currentPollutants: {
        pm25: 220,
        pm10: 360,
        no2: 85,
        so2: 25,
        coMgM3: 3.2,
        o3: 40,
      },
      cpcbResult: {
        aqi: 377,
        aqiCategory: 'very_poor',
        prominentPollutant: 'pm25',
        subIndices: {
          pm25: {
            pollutant: 'pm25',
            concentration: 220,
            subIndex: 377,
            category: 'very_poor',
            status: 'valid',
          },
        },
        isSufficientData: true,
        validPollutantsCount: 6,
        hasParticulateRequirement: true,
        calculatedAt: new Date().toISOString(),
      },
      meteorology: {
        temperatureC: 18,
        relativeHumidityPercent: 70,
        windSpeedKmh: 4,
        windDirectionDegrees: 280,
        boundaryLayerHeightM: 180,
      },
      hourlyForecast: [],
    };

    const plan = generateDeterministicFallbackPlan(sampleProfile, mockSnapshot);

    // Assert that the plan's AQI is anchored directly to the CPCB calculation
    assert.equal(plan.aqiValue, 377);
    assert.equal(plan.aqiCategory, 'very_poor');

    // Assert that the plan satisfies the strict AiResponseSchema
    const validation = AiResponseSchema.safeParse(plan);
    assert.equal(validation.success, true);
    assert.ok(plan.lowEmissionRoutines.length >= 6);
    assert.ok(plan.indoorHacks.length >= 5);
    assert.equal(plan.impactMetrics.length, 4);
    assert.ok(plan.emergencyTips.length >= 4);
    assert.ok(plan.grapRegulation !== undefined);
    assert.equal((plan.grapRegulation as { stage: string }).stage, 'STAGE_2');
    assert.ok(plan.emergencyDirectory !== undefined);
    assert.ok(Array.isArray((plan.emergencyDirectory as { regionalHospitals: unknown[] }).regionalHospitals));
  });

  it('generates schema-compliant bilingual Hindi plan when requested', () => {
    const hindiProfile: UserProfile = {
      ...sampleProfile,
      language: 'hi',
    };

    const plan = generateDeterministicFallbackPlan(hindiProfile);
    const validation = AiResponseSchema.safeParse(plan);
    assert.equal(validation.success, true);
    assert.ok(plan.summaryHeadline.includes('शीतकालीन स्मॉग'));
    assert.ok(plan.emergencyTips[0]?.includes('N95'));
  });
});
