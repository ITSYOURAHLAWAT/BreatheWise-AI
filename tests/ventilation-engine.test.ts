/**
 * @file ventilation-engine.test.ts
 * @description Unit tests for the Scientific Safe Ventilation & Atmospheric Dispersion Engine.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateVentilationHour,
  analyze24HourVentilation,
} from '../src/lib/ventilation-engine.ts';
import type { HourlyEnvironmentalPoint } from '../src/lib/environmental-service.ts';

describe('Safe Ventilation Engine: Hourly Evaluations', () => {
  it('classifies severe Delhi winter smog as unsafe with zero ventilation permitted', () => {
    const severePoint: HourlyEnvironmentalPoint = {
      timeIso: '2026-11-20T06:00',
      displayTime: '6:00 AM',
      cpcbAqi: 425,
      cpcbCategory: 'severe',
      pm25: 280,
      pm10: 450,
      temperatureC: 12,
      boundaryLayerHeightM: 120, // Extreme shallow boundary layer
      windSpeedKmh: 1.5, // Calm wind
    };

    const result = evaluateVentilationHour(severePoint);

    assert.equal(result.status, 'unsafe');
    assert.equal(result.dispersionIndex, 'stagnant');
    assert.equal(result.confidence, 'high');
    assert.ok(result.score < 25);
    assert.match(result.primaryReason, /Extreme ambient particulate/);
    assert.match(result.indoorCo2Action, /Keep all windows firmly sealed/);
  });

  it('classifies clean ambient air under active dispersion as safe', () => {
    const cleanPoint: HourlyEnvironmentalPoint = {
      timeIso: '2026-11-20T14:00',
      displayTime: '2:00 PM',
      cpcbAqi: 45,
      cpcbCategory: 'good',
      pm25: 22,
      pm10: 40,
      temperatureC: 22,
      boundaryLayerHeightM: 1100, // Strong convective mixing
      windSpeedKmh: 12, // Active advection
    };

    const result = evaluateVentilationHour(cleanPoint);

    assert.equal(result.status, 'safe');
    assert.equal(result.dispersionIndex, 'favorable');
    assert.ok(result.score > 80);
    assert.match(result.primaryReason, /Clean ambient air/);
    assert.match(result.indoorCo2Action, /Open windows freely/);
  });

  it('classifies moderate afternoon air as caution with brief timed flush protocol', () => {
    const cautionPoint: HourlyEnvironmentalPoint = {
      timeIso: '2026-11-20T14:30',
      displayTime: '2:30 PM',
      cpcbAqi: 185,
      cpcbCategory: 'moderate',
      pm25: 85,
      pm10: 170,
      temperatureC: 24,
      boundaryLayerHeightM: 900,
      windSpeedKmh: 8,
    };

    const result = evaluateVentilationHour(cautionPoint);

    assert.equal(result.status, 'caution');
    assert.equal(result.dispersionIndex, 'favorable');
    assert.match(result.indoorCo2Action, /Brief 10–15 minute cross-ventilation permissible/);
  });

  it('handles missing or zero telemetry with explicit insufficient_data status', () => {
    const missingPoint: HourlyEnvironmentalPoint = {
      timeIso: '2026-11-20T12:00',
      displayTime: '12:00 PM',
      cpcbAqi: null,
      cpcbCategory: null,
      pm25: 0,
      pm10: 0,
      temperatureC: 20,
      boundaryLayerHeightM: null,
      windSpeedKmh: 0,
    };

    const result = evaluateVentilationHour(missingPoint);

    assert.equal(result.status, 'insufficient_data');
    assert.equal(result.confidence, 'low');
    assert.match(result.primaryReason, /Incomplete particulate telemetry/);
  });
});

describe('Safe Ventilation Engine: 24-Hour Contiguous Interval Analysis', () => {
  it('correctly aggregates 24 hours into contiguous intervals and determines sealed status during winter smog', () => {
    // Construct 24 hours mimicking typical Delhi winter pattern:
    // Morning (0:00 - 11:00): Unsafe (AQI 380 - 440)
    // Afternoon (12:00 - 15:00): Caution (AQI 190 - 240, BLH 850m)
    // Evening & Night (16:00 - 23:00): Unsafe (AQI 350 - 420)
    const mock24Hours: HourlyEnvironmentalPoint[] = [];

    for (let h = 0; h < 24; h++) {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      const isAfternoon = h >= 12 && h <= 15;
      mock24Hours.push({
        timeIso: `2026-11-20T${timeStr}`,
        displayTime: `${h === 0 ? 12 : h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`,
        cpcbAqi: isAfternoon ? 210 : 390,
        cpcbCategory: isAfternoon ? 'poor' : 'very_poor',
        pm25: isAfternoon ? 95 : 240,
        pm10: isAfternoon ? 190 : 380,
        temperatureC: isAfternoon ? 23 : 13,
        boundaryLayerHeightM: isAfternoon ? 850 : 180,
        windSpeedKmh: isAfternoon ? 8 : 2,
      });
    }

    const analysis = analyze24HourVentilation(mock24Hours);

    // Contiguous blocks should be 3: morning unsafe, afternoon caution, evening unsafe
    assert.equal(analysis.contiguousIntervals.length, 3);
    assert.equal(analysis.contiguousIntervals[0]?.status, 'unsafe');
    assert.equal(analysis.contiguousIntervals[1]?.status, 'caution');
    assert.equal(analysis.contiguousIntervals[2]?.status, 'unsafe');

    // Overall status is 'caution_only'
    assert.equal(analysis.overallStatus, 'caution_only');
    assert.equal(analysis.isSafeToVentilate, false); // Caution is not completely unreservedly safe
    assert.equal(analysis.primaryWindow.status, 'caution');
    assert.match(analysis.primaryWindow.timeWindow, /12:00 PM – 3:00 PM/);

    // CO2 guidance should recognize caution protocol
    assert.equal(analysis.indoorCo2Guidance.alertLevel, 'moderate');
    assert.match(analysis.indoorCo2Guidance.action, /timed 10–15 minute cross-room flush/);
  });

  it('handles empty input safely with insufficient_data response', () => {
    const analysis = analyze24HourVentilation([]);

    assert.equal(analysis.overallStatus, 'insufficient_data');
    assert.equal(analysis.isSafeToVentilate, false);
    assert.equal(analysis.primaryWindow.timeWindow, 'Data Unavailable');
    assert.equal(analysis.indoorCo2Guidance.alertLevel, 'moderate');
  });
});
