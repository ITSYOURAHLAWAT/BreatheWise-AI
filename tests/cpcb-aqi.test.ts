/**
 * @file cpcb-aqi.test.ts
 * @description Comprehensive unit tests for official CPCB AQI calculation engine,
 * all 8 monitored pollutants, breakpoint interpolation, and CPCB health guidance.
 * Run using Node's native test runner (`node --experimental-strip-types --test tests/cpcb-aqi.test.ts`).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePollutantSubIndex,
  calculateCpcbAqi,
  aqiValueToCategory,
  CPCB_BREAKPOINTS,
} from '../src/lib/cpcb-aqi.ts';
import {
  estimatePm25,
  getCpcbHealthImpact,
} from '../src/lib/aqi-utils.ts';
import type { CpcbPollutant } from '../src/lib/types.ts';

describe('CPCB Sub-Index Calculation: Individual Pollutants', () => {
  it('calculates PM2.5 sub-index correctly across all 6 CPCB bands', () => {
    // Good: 0-30 -> 0-50
    const g1 = calculatePollutantSubIndex('pm25', 0);
    assert.equal(g1.subIndex, 0);
    assert.equal(g1.category, 'good');

    const g2 = calculatePollutantSubIndex('pm25', 15);
    assert.equal(g2.subIndex, 25);
    assert.equal(g2.category, 'good');

    const g3 = calculatePollutantSubIndex('pm25', 30);
    assert.equal(g3.subIndex, 50);
    assert.equal(g3.category, 'good');

    // Satisfactory: 31-60 -> 51-100
    const s1 = calculatePollutantSubIndex('pm25', 31);
    assert.equal(s1.subIndex, 51);
    assert.equal(s1.category, 'satisfactory');

    const s2 = calculatePollutantSubIndex('pm25', 60);
    assert.equal(s2.subIndex, 100);
    assert.equal(s2.category, 'satisfactory');

    // Moderate: 61-90 -> 101-200
    const m1 = calculatePollutantSubIndex('pm25', 61);
    assert.equal(m1.subIndex, 101);
    assert.equal(m1.category, 'moderate');

    const m2 = calculatePollutantSubIndex('pm25', 90);
    assert.equal(m2.subIndex, 200);
    assert.equal(m2.category, 'moderate');

    // Poor: 91-120 -> 201-300
    const p1 = calculatePollutantSubIndex('pm25', 91);
    assert.equal(p1.subIndex, 201);
    assert.equal(p1.category, 'poor');

    const p2 = calculatePollutantSubIndex('pm25', 120);
    assert.equal(p2.subIndex, 300);
    assert.equal(p2.category, 'poor');

    // Very Poor: 121-250 -> 301-400
    const vp1 = calculatePollutantSubIndex('pm25', 121);
    assert.equal(vp1.subIndex, 301);
    assert.equal(vp1.category, 'very_poor');

    const vp2 = calculatePollutantSubIndex('pm25', 250);
    assert.equal(vp2.subIndex, 400);
    assert.equal(vp2.category, 'very_poor');

    // Severe: 251-350 -> 401-500
    const sv1 = calculatePollutantSubIndex('pm25', 251);
    assert.equal(sv1.subIndex, 401);
    assert.equal(sv1.category, 'severe');

    const sv2 = calculatePollutantSubIndex('pm25', 350);
    assert.equal(sv2.subIndex, 500);
    assert.equal(sv2.category, 'severe');
  });

  it('calculates PM10 sub-index correctly across boundary conditions', () => {
    assert.equal(calculatePollutantSubIndex('pm10', 0).subIndex, 0);
    assert.equal(calculatePollutantSubIndex('pm10', 50).subIndex, 50);
    assert.equal(calculatePollutantSubIndex('pm10', 51).subIndex, 51);
    assert.equal(calculatePollutantSubIndex('pm10', 100).subIndex, 100);
    assert.equal(calculatePollutantSubIndex('pm10', 250).subIndex, 200);
    assert.equal(calculatePollutantSubIndex('pm10', 350).subIndex, 300);
    assert.equal(calculatePollutantSubIndex('pm10', 430).subIndex, 400);
    assert.equal(calculatePollutantSubIndex('pm10', 500).subIndex, 500);
  });

  it('calculates Carbon Monoxide (CO in mg/m3) correctly', () => {
    assert.equal(calculatePollutantSubIndex('co', 0).subIndex, 0);
    assert.equal(calculatePollutantSubIndex('co', 1.0).subIndex, 50);
    assert.equal(calculatePollutantSubIndex('co', 2.0).subIndex, 100);
    assert.equal(calculatePollutantSubIndex('co', 10.0).subIndex, 200);
    assert.equal(calculatePollutantSubIndex('co', 17.0).subIndex, 300);
    assert.equal(calculatePollutantSubIndex('co', 34.0).subIndex, 400);
    assert.equal(calculatePollutantSubIndex('co', 50.0).subIndex, 500);
  });

  it('calculates Nitrogen Dioxide (NO2) across all 6 breakpoint bands', () => {
    assert.equal(calculatePollutantSubIndex('no2', 40).subIndex, 50);
    assert.equal(calculatePollutantSubIndex('no2', 80).subIndex, 100);
    assert.equal(calculatePollutantSubIndex('no2', 180).subIndex, 200);
    assert.equal(calculatePollutantSubIndex('no2', 280).subIndex, 300);
    assert.equal(calculatePollutantSubIndex('no2', 400).subIndex, 400);
    assert.equal(calculatePollutantSubIndex('no2', 500).subIndex, 500);
  });

  it('calculates Sulphur Dioxide (SO2) across all 6 breakpoint bands', () => {
    assert.equal(calculatePollutantSubIndex('so2', 40).subIndex, 50);
    assert.equal(calculatePollutantSubIndex('so2', 80).subIndex, 100);
    assert.equal(calculatePollutantSubIndex('so2', 380).subIndex, 200);
    assert.equal(calculatePollutantSubIndex('so2', 800).subIndex, 300);
    assert.equal(calculatePollutantSubIndex('so2', 1600).subIndex, 400);
    assert.equal(calculatePollutantSubIndex('so2', 2000).subIndex, 500);
  });

  it('calculates Ozone (O3), Ammonia (NH3), and Lead (Pb) correctly', () => {
    // O3
    assert.equal(calculatePollutantSubIndex('o3', 50).subIndex, 50);
    assert.equal(calculatePollutantSubIndex('o3', 100).subIndex, 100);
    assert.equal(calculatePollutantSubIndex('o3', 168).subIndex, 200);

    // NH3
    assert.equal(calculatePollutantSubIndex('nh3', 200).subIndex, 50);
    assert.equal(calculatePollutantSubIndex('nh3', 400).subIndex, 100);
    assert.equal(calculatePollutantSubIndex('nh3', 800).subIndex, 200);

    // Pb
    assert.equal(calculatePollutantSubIndex('pb', 0.5).subIndex, 50);
    assert.equal(calculatePollutantSubIndex('pb', 1.0).subIndex, 100);
    assert.equal(calculatePollutantSubIndex('pb', 2.0).subIndex, 200);
    assert.equal(calculatePollutantSubIndex('pb', 3.0).subIndex, 300);
    assert.equal(calculatePollutantSubIndex('pb', 3.5).subIndex, 400);
    assert.equal(calculatePollutantSubIndex('pb', 5.0).subIndex, 500);
  });

  it('validates breakpoint table completeness for all 8 CPCB pollutants', () => {
    const expectedPollutants: CpcbPollutant[] = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'nh3', 'pb'];
    for (const pollutant of expectedPollutants) {
      assert.ok(CPCB_BREAKPOINTS[pollutant], `Breakpoint table must include ${pollutant}`);
      assert.equal(CPCB_BREAKPOINTS[pollutant].length, 6, `${pollutant} must have 6 breakpoints`);
    }
  });

  it('handles negative, NaN, and invalid numeric concentrations safely', () => {
    const neg = calculatePollutantSubIndex('pm25', -15);
    assert.equal(neg.status, 'invalid');
    assert.equal(neg.subIndex, 0);

    const nanRes = calculatePollutantSubIndex('pm25', NaN);
    assert.equal(nanRes.status, 'invalid');

    const infRes = calculatePollutantSubIndex('pm25', Infinity);
    assert.equal(infRes.status, 'invalid');

    const negInfRes = calculatePollutantSubIndex('pm25', -Infinity);
    assert.equal(negInfRes.status, 'invalid');
  });

  it('handles extreme concentrations exceeding upper breakpoint (>350 for PM2.5)', () => {
    const extreme = calculatePollutantSubIndex('pm25', 550);
    assert.equal(extreme.status, 'out_of_range');
    assert.equal(extreme.subIndex, 500);
    assert.equal(extreme.category, 'severe');
  });
});

describe('CPCB NAQI Multi-Pollutant Calculation & Data Sufficiency', () => {
  it('rejects calculation if fewer than 3 pollutants are reported', () => {
    const result = calculateCpcbAqi({
      pm25: 85,
      pm10: 160,
    });

    assert.equal(result.isSufficientData, false);
    assert.equal(result.validPollutantsCount, 2);
    assert.equal(result.aqi, null);
    assert.match(result.insufficiencyReason ?? '', /requires at least 3 monitored pollutants/);
  });

  it('rejects calculation if 3 pollutants are present but neither PM10 nor PM2.5 is included', () => {
    const result = calculateCpcbAqi({
      no2: 65,
      so2: 45,
      co: 1.5,
    });

    assert.equal(result.isSufficientData, false);
    assert.equal(result.validPollutantsCount, 3);
    assert.equal(result.hasParticulateRequirement, false);
    assert.equal(result.aqi, null);
    assert.match(result.insufficiencyReason ?? '', /requires either PM10 or PM2.5/);
  });

  it('calculates overall AQI correctly when sufficient valid data is provided', () => {
    const result = calculateCpcbAqi({
      pm25: 185,
      pm10: 290,
      no2: 95,
      so2: 30,
      co: 2.5,
    });

    assert.equal(result.isSufficientData, true);
    assert.equal(result.validPollutantsCount, 5);
    assert.equal(result.hasParticulateRequirement, true);
    assert.ok(result.aqi !== null);
    assert.equal(result.prominentPollutant, 'pm25');
    assert.equal(result.aqiCategory, 'very_poor');
  });

  it('identifies NO2 as prominent pollutant when NO2 sub-index exceeds PM2.5', () => {
    const result = calculateCpcbAqi({
      pm25: 25,
      pm10: 40,
      no2: 240,
    });

    assert.equal(result.isSufficientData, true);
    assert.equal(result.prominentPollutant, 'no2');
    assert.equal(result.aqiCategory, 'poor');
  });

  it('computes correctly with PM10 alone fulfilling the particulate requirement', () => {
    const result = calculateCpcbAqi({
      pm10: 380,
      no2: 60,
      so2: 30,
    });

    assert.equal(result.isSufficientData, true);
    assert.equal(result.hasParticulateRequirement, true);
    assert.equal(result.prominentPollutant, 'pm10');
    assert.equal(result.aqiCategory, 'very_poor');
  });
});

describe('CPCB AQI Category Mapping & Boundary Values', () => {
  it('maps boundary values correctly to official CPCB categories', () => {
    // 0–50: Good
    assert.equal(aqiValueToCategory(0), 'good');
    assert.equal(aqiValueToCategory(25), 'good');
    assert.equal(aqiValueToCategory(50), 'good');

    // 51–100: Satisfactory
    assert.equal(aqiValueToCategory(51), 'satisfactory');
    assert.equal(aqiValueToCategory(75), 'satisfactory');
    assert.equal(aqiValueToCategory(100), 'satisfactory');

    // 101–200: Moderate
    assert.equal(aqiValueToCategory(101), 'moderate');
    assert.equal(aqiValueToCategory(150), 'moderate');
    assert.equal(aqiValueToCategory(200), 'moderate');

    // 201–300: Poor
    assert.equal(aqiValueToCategory(201), 'poor');
    assert.equal(aqiValueToCategory(250), 'poor');
    assert.equal(aqiValueToCategory(300), 'poor');

    // 301–400: Very Poor
    assert.equal(aqiValueToCategory(301), 'very_poor');
    assert.equal(aqiValueToCategory(350), 'very_poor');
    assert.equal(aqiValueToCategory(400), 'very_poor');

    // 401–500: Severe
    assert.equal(aqiValueToCategory(401), 'severe');
    assert.equal(aqiValueToCategory(450), 'severe');
    assert.equal(aqiValueToCategory(500), 'severe');

    // Values > 500 or < 0 return 'Out of range / Exceptional'
    assert.equal(aqiValueToCategory(501), 'Out of range / Exceptional');
    assert.equal(aqiValueToCategory(999), 'Out of range / Exceptional');
    assert.equal(aqiValueToCategory(-1), 'Out of range / Exceptional');
  });

  it('handles negative, NaN, and non-finite numbers safely in aqiValueToCategory', () => {
    assert.equal(aqiValueToCategory(-1), 'Out of range / Exceptional');
    assert.equal(aqiValueToCategory(-100), 'Out of range / Exceptional');
    assert.equal(aqiValueToCategory(NaN), 'severe');
    assert.equal(aqiValueToCategory(Infinity), 'Out of range / Exceptional');
  });
});

describe('CPCB Utility Functions: estimatePm25 & getCpcbHealthImpact', () => {
  it('estimates PM2.5 piecewise concentration from AQI correctly', () => {
    assert.equal(estimatePm25(0), 0);
    assert.equal(estimatePm25(50), 30);
    assert.equal(estimatePm25(100), 60);
    assert.equal(estimatePm25(200), 90);
    assert.equal(estimatePm25(300), 120);
    assert.equal(estimatePm25(400), 250);
    assert.equal(estimatePm25(500), 350);
    assert.equal(estimatePm25(600), 350); // Clamped at 500
  });

  it('returns authoritative CPCB health impact descriptions for each band', () => {
    assert.match(getCpcbHealthImpact('good'), /Minimal impact/i);
    assert.match(getCpcbHealthImpact('satisfactory'), /Minor breathing discomfort to sensitive people/i);
    assert.match(getCpcbHealthImpact('moderate'), /Breathing discomfort to people with lungs/i);
    assert.match(getCpcbHealthImpact('poor'), /Breathing discomfort to most people on prolonged exposure/i);
    assert.match(getCpcbHealthImpact('very_poor'), /Respiratory illness on prolonged exposure/i);
    assert.match(getCpcbHealthImpact('severe'), /Severe impacts on healthy people/i);
    assert.match(getCpcbHealthImpact('unknown_band'), /Extreme air emergency/i);
  });
});
