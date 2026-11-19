/**
 * @file environmental-service.test.ts
 * @description Unit tests for micro-location resolution, data provenance metadata,
 * and environmental service failure modes.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveLocation,
  fetchEnvironmentalSnapshot,
} from '../src/lib/environmental-service.ts';

describe('Environmental Service: Micro-Location Resolution', () => {
  it('resolves known Delhi NCR hotspots to calibrated coordinates', () => {
    const anandVihar = resolveLocation('Anand Vihar, New Delhi');
    assert.equal(anandVihar.name, 'Anand Vihar');
    assert.equal(anandVihar.region, 'East Delhi');
    assert.equal(anandVihar.latitude, 28.6502);
    assert.equal(anandVihar.longitude, 77.3150);
    assert.equal(anandVihar.isDelhiNcr, true);

    const punjabiBagh = resolveLocation('punjabi bagh');
    assert.equal(punjabiBagh.name, 'Punjabi Bagh');
    assert.equal(punjabiBagh.region, 'West Delhi');

    const noida = resolveLocation('Noida Sector 62');
    assert.equal(noida.name, 'Noida Sector 62');
    assert.equal(noida.isDelhiNcr, true);

    const gurgaon = resolveLocation('Gurgaon Cyber City');
    assert.equal(gurgaon.name, 'Gurugram');
    assert.equal(gurgaon.isDelhiNcr, true);
  });

  it('resolves non-Delhi metros correctly', () => {
    const mumbai = resolveLocation('Mumbai');
    assert.equal(mumbai.name, 'Mumbai');
    assert.equal(mumbai.isDelhiNcr, false);

    const bangalore = resolveLocation('Bangalore');
    assert.equal(bangalore.name, 'Bengaluru');
    assert.equal(bangalore.isDelhiNcr, false);
  });

  it('defaults unfamiliar Indian locations to Central Delhi coordinates safely', () => {
    const custom = resolveLocation('Unknown Sector 999');
    assert.equal(custom.latitude, 28.6139);
    assert.equal(custom.longitude, 77.2090);
    assert.equal(custom.isDelhiNcr, true);
  });
});

describe('Environmental Service: Provenance & Error Resilience', () => {
  it('returns explicit unavailable state when external API cannot be reached or times out', async () => {
    // Calling with a 1ms timeout guarantees abort to test graceful degradation
    const snapshot = await fetchEnvironmentalSnapshot('Anand Vihar', 1);

    assert.equal(snapshot.status, 'unavailable');
    assert.equal(snapshot.metadata.dataType, 'model_forecast');
    assert.equal(snapshot.metadata.isDirectCpcbStation, false);
    assert.equal(snapshot.cpcbResult.isSufficientData, false);
    assert.equal(snapshot.cpcbResult.aqi, null);
    assert.ok(snapshot.errorMessage !== undefined);
  });
});
