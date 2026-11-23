/**
 * @file api-generate-plan.test.ts
 * @description Integration tests for plan generation, deterministic CPCB fallback pipeline,
 * PII sanitization, schema validation boundaries, and timeout handling.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDeterministicFallbackPlan,
  generateAirQualityPlan,
  sanitizeInput,
} from '../src/lib/gemini.ts';
import { UserProfileSchema, AiResponseSchema } from '../src/lib/schemas.ts';
import type { UserProfile, EnvironmentalSnapshot } from '../src/lib/types.ts';

describe('Privacy & Input Sanitization (sanitizeInput)', () => {
  it('strips email addresses with standardized redaction token', () => {
    const raw = 'Please email my report to user.name+tag@sub.domain.org or contact@gmail.com';
    const cleaned = sanitizeInput(raw);
    assert.equal(cleaned.includes('@'), false);
    assert.ok(cleaned.includes('[REDACTED EMAIL]'));
  });

  it('strips telephone numbers with various national and international formats', () => {
    const raw1 = 'Call me at +91 9876543210 or 98765-43210 immediately';
    const cleaned1 = sanitizeInput(raw1);
    assert.ok(cleaned1.includes('[REDACTED PHONE]'));
    assert.equal(cleaned1.includes('9876543210'), false);

    const raw2 = 'Landline: (011) 23456789';
    const cleaned2 = sanitizeInput(raw2);
    assert.ok(cleaned2.includes('[REDACTED PHONE]'));
  });

  it('strips specific street-level residential addresses while preserving general localities', () => {
    const raw = 'I live at 42 Park Street, Anand Vihar, New Delhi';
    const cleaned = sanitizeInput(raw);
    assert.ok(cleaned.includes('[REDACTED ADDRESS]'));
    assert.ok(cleaned.includes('Anand Vihar, New Delhi'));
  });

  it('preserves clean micro-location names without false positives', () => {
    assert.equal(sanitizeInput('Anand Vihar, New Delhi'), 'Anand Vihar, New Delhi');
    assert.equal(sanitizeInput('Bandra West, Mumbai'), 'Bandra West, Mumbai');
    assert.equal(sanitizeInput('Indiranagar, Bengaluru'), 'Indiranagar, Bengaluru');
    assert.equal(sanitizeInput('Cyber City, Gurugram'), 'Cyber City, Gurugram');
  });

  it('handles empty and whitespace strings safely', () => {
    assert.equal(sanitizeInput(''), '');
    assert.equal(sanitizeInput('   '), '');
  });
});

describe('User Profile Validation & Boundary Failures', () => {
  const validProfile: UserProfile = {
    city: 'Anand Vihar, New Delhi',
    healthVulnerabilities: ['asthma', 'bronchitis'],
    activityLevel: 'lightly_active',
    hasChildren: true,
    hasElderly: false,
    commuteMode: 'public_transport',
    additionalContext: 'Living near interstate bus terminal',
  };

  it('passes validation with complete valid profile', () => {
    const result = UserProfileSchema.safeParse(validProfile);
    assert.equal(result.success, true);
  });

  it('rejects profiles with missing or empty city', () => {
    const emptyCity = { ...validProfile, city: '' };
    const res1 = UserProfileSchema.safeParse(emptyCity);
    assert.equal(res1.success, false);

    const missingCity = { ...validProfile };
    delete (missingCity as Record<string, unknown>).city;
    const res2 = UserProfileSchema.safeParse(missingCity);
    assert.equal(res2.success, false);
  });

  it('rejects invalid activityLevel enums', () => {
    const invalidActivity = { ...validProfile, activityLevel: 'hyper_active' };
    const res = UserProfileSchema.safeParse(invalidActivity);
    assert.equal(res.success, false);
  });

  it('rejects invalid commuteMode enums', () => {
    const invalidCommute = { ...validProfile, commuteMode: 'teleportation' };
    const res = UserProfileSchema.safeParse(invalidCommute);
    assert.equal(res.success, false);
  });

  it('rejects non-array or invalid health conditions', () => {
    const nonArray = { ...validProfile, healthVulnerabilities: 'asthma' };
    const res1 = UserProfileSchema.safeParse(nonArray);
    assert.equal(res1.success, false);

    const invalidValue = { ...validProfile, healthVulnerabilities: ['unknown_illness'] };
    const res2 = UserProfileSchema.safeParse(invalidValue);
    assert.equal(res2.success, false);
  });
});

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

    assert.equal(plan.aqiValue, 377);
    assert.equal(plan.aqiCategory, 'very_poor');

    const validation = AiResponseSchema.safeParse(plan);
    assert.equal(validation.success, true);
    assert.ok(plan.lowEmissionRoutines.length >= 6);
    assert.ok(plan.indoorHacks.length >= 5);
    assert.equal(plan.impactMetrics.length, 4);
    assert.ok(plan.emergencyTips.length >= 4);
    assert.ok(plan.grapRegulation !== undefined);
    assert.equal(plan.grapRegulation?.stage, 'STAGE_2');
    assert.ok(plan.emergencyDirectory !== undefined);
    assert.ok(Array.isArray(plan.emergencyDirectory?.regionalHospitals));
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

  it('handles aborted signal gracefully by returning deterministic fallback plan immediately', async () => {
    const controller = new AbortController();
    controller.abort(); // already aborted

    const plan = await generateAirQualityPlan(sampleProfile, controller.signal);
    assert.ok(plan);
    assert.ok(plan.aqiValue > 0);
    assert.ok(plan.lowEmissionRoutines.length > 0);
    assert.equal(AiResponseSchema.safeParse(plan).success, true);
  });
});
