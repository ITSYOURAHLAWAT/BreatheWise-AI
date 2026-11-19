import test from 'node:test';
import assert from 'node:assert/strict';
import { getEmergencyDirectory } from '../src/lib/emergency-directory.ts';

test('Emergency Medical Directory: Resolution & Triage Standards', async (t) => {
  await t.test('resolves hotlines including 112 and 102/108 ambulance', () => {
    const res = getEmergencyDirectory('Delhi');
    assert.ok(res.hotlines.length >= 3);
    assert.ok(res.hotlines.some((h) => h.number === '112'));
    assert.ok(res.hotlines.some((h) => h.number.includes('102')));
  });

  await t.test('includes clinically rigorous red-flag symptoms with hypoxemia and cyanosis', () => {
    const res = getEmergencyDirectory('Delhi');
    assert.ok(res.redFlagSymptoms.length >= 5);
    assert.ok(res.redFlagSymptoms.some((s) => s.symptom.includes('Cyanosis')));
    assert.ok(res.redFlagSymptoms.some((s) => s.symptom.includes('SpO2') || s.symptom.includes('Pulse Oximeter')));
    assert.ok(res.disclaimer.includes('NOT a medical diagnostic'));
  });

  await t.test('prioritizes East Delhi / Ghaziabad hospitals for Anand Vihar query', () => {
    const res = getEmergencyDirectory('Anand Vihar');
    assert.ok(res.regionalHospitals.length > 0);
    const topHospitals = res.regionalHospitals.map((h) => h.name);
    assert.ok(topHospitals.some((name) => name.includes('Max Super Speciality Hospital, Patparganj') || name.includes('Yashoda')));
  });

  await t.test('prioritizes Gurugram hospitals for Gurugram query', () => {
    const res = getEmergencyDirectory('Gurugram, Cyber City');
    assert.ok(res.regionalHospitals.length > 0);
    const topHospital = res.regionalHospitals[0];
    assert.ok(topHospital?.region === 'Gurugram');
    assert.ok(topHospital?.name.includes('Medanta'));
  });

  await t.test('prioritizes Noida hospitals for Noida query', () => {
    const res = getEmergencyDirectory('Noida Sector 62');
    assert.ok(res.regionalHospitals.length > 0);
    const topHospital = res.regionalHospitals[0];
    assert.ok(topHospital?.region === 'Noida');
    assert.ok(topHospital?.name.includes('Jaypee'));
  });

  await t.test('defaults safely to apex national centers (AIIMS) for unspecified location', () => {
    const res = getEmergencyDirectory();
    assert.ok(res.regionalHospitals.length > 0);
    assert.ok(res.regionalHospitals.some((h) => h.id === 'aiims-delhi'));
  });
});
