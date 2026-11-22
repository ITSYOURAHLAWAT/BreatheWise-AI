/**
 * @file environmental-service.test.ts
 * @description Unit tests for micro-location resolution, regional aliases,
 * data provenance metadata, caching, and error resilience.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveLocation,
  fetchEnvironmentalSnapshot,
} from '../src/lib/environmental-service.ts';

describe('Environmental Service: Micro-Location Resolution & Aliases', () => {
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
    assert.equal(punjabiBagh.isDelhiNcr, true);

    const rkPuram = resolveLocation('RK Puram');
    assert.equal(rkPuram.name, 'RK Puram');
    assert.equal(rkPuram.region, 'South Delhi');

    const jahangirpuri = resolveLocation('Jahangirpuri');
    assert.equal(jahangirpuri.name, 'Jahangirpuri');
    assert.equal(jahangirpuri.region, 'North Delhi');
  });

  it('resolves common regional aliases and colloquial names correctly', () => {
    const ncr = resolveLocation('NCR');
    assert.equal(ncr.name, 'Delhi');
    assert.equal(ncr.isDelhiNcr, true);

    const newDelhi = resolveLocation('new delhi');
    assert.equal(newDelhi.name, 'Delhi');
    assert.equal(newDelhi.isDelhiNcr, true);

    const gurgaon = resolveLocation('gurgaon cyber hub');
    assert.equal(gurgaon.name, 'Gurugram');
    assert.equal(gurgaon.isDelhiNcr, true);

    const noida = resolveLocation('Noida Sector 62');
    assert.equal(noida.name, 'Noida Sector 62');
    assert.equal(noida.isDelhiNcr, true);

    const bangalore = resolveLocation('bangalore tech park');
    assert.equal(bangalore.name, 'Bengaluru');
    assert.equal(bangalore.isDelhiNcr, false);
  });

  it('handles irregular capitalization and whitespace padding', () => {
    const padded = resolveLocation('   ANAND VIHAR, NEW DELHI   ');
    assert.equal(padded.name, 'Anand Vihar');
    assert.equal(padded.isDelhiNcr, true);

    const mixedCase = resolveLocation('rOhInI, dElHi');
    assert.equal(mixedCase.name, 'Rohini');
    assert.equal(mixedCase.region, 'North West Delhi');
  });

  it('resolves non-Delhi metros correctly', () => {
    const mumbai = resolveLocation('Mumbai');
    assert.equal(mumbai.name, 'Mumbai');
    assert.equal(mumbai.isDelhiNcr, false);

    const kolkata = resolveLocation('Kolkata');
    assert.equal(kolkata.name, 'Kolkata');
    assert.equal(kolkata.isDelhiNcr, false);

    const chennai = resolveLocation('Chennai');
    assert.equal(chennai.name, 'Chennai');
    assert.equal(chennai.isDelhiNcr, false);
  });

  it('defaults unfamiliar Indian locations to Central Delhi coordinates safely', () => {
    const custom = resolveLocation('Unknown Sector 999');
    assert.equal(custom.latitude, 28.6139);
    assert.equal(custom.longitude, 77.2090);
    assert.equal(custom.isDelhiNcr, true);

    const empty = resolveLocation('');
    assert.equal(empty.latitude, 28.6139);
    assert.equal(empty.longitude, 77.2090);
  });
});

describe('Environmental Service: Provenance, Caching & Error Resilience', () => {
  it('returns explicit unavailable state when external API cannot be reached or times out', async () => {
    // Calling with a 1ms timeout guarantees abort to test graceful degradation
    const snapshot = await fetchEnvironmentalSnapshot('Anand Vihar', 1);

    assert.equal(snapshot.status, 'unavailable');
    assert.equal(snapshot.metadata.dataType, 'model_forecast');
    assert.equal(snapshot.metadata.isDirectCpcbStation, false);
    assert.equal(snapshot.cpcbResult.isSufficientData, false);
    assert.equal(snapshot.cpcbResult.aqi, null);
    assert.ok(snapshot.errorMessage !== undefined);
    assert.equal(snapshot.currentPollutants.pm25, 0);
  });

  it('maintains strict provenance metadata prohibiting false CPCB station claims', async () => {
    const snapshot = await fetchEnvironmentalSnapshot('Rohini', 1);
    assert.equal(snapshot.metadata.isDirectCpcbStation, false);
    assert.match(snapshot.metadata.disclaimer, /No simulated data is fabricated/i);
  });
});
