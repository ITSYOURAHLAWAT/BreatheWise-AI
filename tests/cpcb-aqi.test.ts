/**
 * @file cpcb-aqi.test.ts
 * @description Comprehensive unit tests for official CPCB AQI calculation engine.
 * Run using Node's native test runner (`node --experimental-strip-types --test tests/cpcb-aqi.test.ts`).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePollutantSubIndex,
  calculateCpcbAqi,
} from '../src/lib/cpcb-aqi.ts';

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
    assert.equal(calculatePollutantSubIndex('pm10', 50).subIndex, 50);
    assert.equal(calculatePollutantSubIndex('pm10', 51).subIndex, 51);
    assert.equal(calculatePollutantSubIndex('pm10', 100).subIndex, 100);
    assert.equal(calculatePollutantSubIndex('pm10', 250).subIndex, 200);
    assert.equal(calculatePollutantSubIndex('pm10', 350).subIndex, 300);
    assert.equal(calculatePollutantSubIndex('pm10', 430).subIndex, 400);
    assert.equal(calculatePollutantSubIndex('pm10', 500).subIndex, 500);
  });

  it('calculates Carbon Monoxide (CO in mg/m3) correctly', () => {
    assert.equal(calculatePollutantSubIndex('co', 1.0).subIndex, 50);
    assert.equal(calculatePollutantSubIndex('co', 2.0).subIndex, 100);
    assert.equal(calculatePollutantSubIndex('co', 10.0).subIndex, 200);
    assert.equal(calculatePollutantSubIndex('co', 17.0).subIndex, 300);
    assert.equal(calculatePollutantSubIndex('co', 34.0).subIndex, 400);
    assert.equal(calculatePollutantSubIndex('co', 50.0).subIndex, 500);
  });

  it('handles negative, NaN, and invalid numeric concentrations safely', () => {
    const neg = calculatePollutantSubIndex('pm25', -15);
    assert.equal(neg.status, 'invalid');
    assert.equal(neg.subIndex, 0);

    const nanRes = calculatePollutantSubIndex('pm25', NaN);
    assert.equal(nanRes.status, 'invalid');

    const infRes = calculatePollutantSubIndex('pm25', Infinity);
    assert.equal(infRes.status, 'invalid');
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
    // Delhi Winter Smog scenario:
    // PM2.5 = 185 ug/m3 -> subIndex: ~350 (Very Poor)
    // PM10 = 290 ug/m3  -> subIndex: ~240 (Poor)
    // NO2 = 95 ug/m3    -> subIndex: ~115 (Moderate)
    // SO2 = 30 ug/m3    -> subIndex: ~38  (Good)
    // CO = 2.5 mg/m3    -> subIndex: ~106 (Moderate)
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
      pm25: 25,   // Good (~42)
      pm10: 40,   // Good (~40)
      no2: 240,   // Poor (201-300)
    });

    assert.equal(result.isSufficientData, true);
    assert.equal(result.prominentPollutant, 'no2');
    assert.equal(result.aqiCategory, 'poor');
  });
});
